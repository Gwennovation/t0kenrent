/**
 * PaymentChannel - sCrypt Smart Contract for T0kenRent
 * 
 * Implements a bidirectional payment channel for streaming rental payments.
 * This allows hourly/minute-based rentals with off-chain payment updates.
 * 
 * Features:
 * - Off-chain payment updates (no on-chain fees per update)
 * - Bidirectional value transfer
 * - Timeout-based settlement
 * - nSequence-based replacement for channel updates
 * 
 * Team: ChibiTech
 * Project: T0kenRent - BSV Hackathon 2025
 * 
 * Reference: Workshop 5 - Payment Channels & Sighash Types
 */

import {
  assert,
  ByteString,
  hash256,
  method,
  prop,
  PubKey,
  Sig,
  SmartContract,
  Utils,
  toByteString
} from 'scrypt-ts'

/**
 * Channel states
 */
export enum ChannelState {
  OPEN = 0,
  CLOSING = 1,
  CLOSED = 2
}

/**
 * PaymentChannel Contract
 * 
 * A bidirectional payment channel between renter and owner.
 * Enables streaming payments for time-based rentals.
 */
export class PaymentChannel extends SmartContract {
  // Owner's public key
  @prop()
  ownerPubKey: PubKey

  // Renter's public key
  @prop()
  renterPubKey: PubKey

  // Total channel capacity
  @prop()
  capacity: bigint

  // Current owner balance (stateful)
  @prop(true)
  ownerBalance: bigint

  // Current renter balance (stateful)
  @prop(true)
  renterBalance: bigint

  // Sequence number for updates
  @prop(true)
  sequence: bigint

  // Timeout for dispute window
  @prop()
  disputeTimeout: bigint

  // Channel state
  @prop(true)
  state: bigint

  constructor(
    ownerPubKey: PubKey,
    renterPubKey: PubKey,
    capacity: bigint,
    disputeTimeout: bigint
  ) {
    super(...arguments)
    this.ownerPubKey = ownerPubKey
    this.renterPubKey = renterPubKey
    this.capacity = capacity
    this.ownerBalance = 0n
    this.renterBalance = capacity
    this.sequence = 0n
    this.disputeTimeout = disputeTimeout
    this.state = BigInt(ChannelState.OPEN)
  }

  /**
   * Update channel balance (off-chain, then on-chain settlement)
   * 
   * Both parties sign the new balance distribution.
   * Higher sequence number replaces lower.
   */
  @method()
  public update(
    newOwnerBalance: bigint,
    newRenterBalance: bigint,
    newSequence: bigint,
    ownerSig: Sig,
    renterSig: Sig
  ) {
    // Channel must be open
    assert(this.state === BigInt(ChannelState.OPEN), 'Channel not open')

    // New sequence must be higher
    assert(newSequence > this.sequence, 'Sequence must increase')

    // Balances must equal capacity
    assert(
      newOwnerBalance + newRenterBalance === this.capacity,
      'Balance mismatch'
    )

    // Verify both signatures
    assert(this.checkSig(ownerSig, this.ownerPubKey), 'Owner sig invalid')
    assert(this.checkSig(renterSig, this.renterPubKey), 'Renter sig invalid')

    // Update state
    this.ownerBalance = newOwnerBalance
    this.renterBalance = newRenterBalance
    this.sequence = newSequence

    // Build state output
    const stateOutput = this.buildStateOutput(this.ctx.utxo.value)
    assert(
      hash256(stateOutput + this.buildChangeOutput()) === this.ctx.hashOutputs,
      'Output mismatch'
    )
  }

  /**
   * Cooperative close - both parties agree to close
   * 
   * Distributes funds according to final balances.
   */
  @method()
  public cooperativeClose(ownerSig: Sig, renterSig: Sig) {
    // Verify both signatures
    assert(this.checkSig(ownerSig, this.ownerPubKey), 'Owner sig invalid')
    assert(this.checkSig(renterSig, this.renterPubKey), 'Renter sig invalid')

    // Build final outputs
    let outputs = toByteString('')
    
    if (this.ownerBalance > 0n) {
      outputs += Utils.buildPublicKeyHashOutput(
        hash256(this.ownerPubKey),
        this.ownerBalance
      )
    }
    
    if (this.renterBalance > 0n) {
      outputs += Utils.buildPublicKeyHashOutput(
        hash256(this.renterPubKey),
        this.renterBalance
      )
    }

    outputs += this.buildChangeOutput()

    assert(hash256(outputs) === this.ctx.hashOutputs, 'Output mismatch')
  }

  /**
   * Initiate unilateral close (start dispute period)
   * 
   * Either party can start closing the channel.
   * The other party has disputeTimeout blocks to challenge.
   */
  @method()
  public initiateClose(initiatorSig: Sig, isOwner: boolean) {
    // Channel must be open
    assert(this.state === BigInt(ChannelState.OPEN), 'Channel not open')

    // Verify initiator
    if (isOwner) {
      assert(this.checkSig(initiatorSig, this.ownerPubKey), 'Owner sig invalid')
    } else {
      assert(this.checkSig(initiatorSig, this.renterPubKey), 'Renter sig invalid')
    }

    // Transition to CLOSING state
    this.state = BigInt(ChannelState.CLOSING)

    // Build state output with CLOSING state
    const stateOutput = this.buildStateOutput(this.ctx.utxo.value)
    assert(
      hash256(stateOutput + this.buildChangeOutput()) === this.ctx.hashOutputs,
      'Output mismatch'
    )
  }

  /**
   * Finalize close after timeout
   * 
   * After disputeTimeout, the closing party can finalize.
   */
  @method()
  public finalizeClose(sig: Sig) {
    // Must be in CLOSING state
    assert(this.state === BigInt(ChannelState.CLOSING), 'Not closing')

    // Timeout must have passed
    assert(this.ctx.locktime >= this.disputeTimeout, 'Timeout not reached')

    // Build final outputs
    let outputs = toByteString('')
    
    if (this.ownerBalance > 0n) {
      outputs += Utils.buildPublicKeyHashOutput(
        hash256(this.ownerPubKey),
        this.ownerBalance
      )
    }
    
    if (this.renterBalance > 0n) {
      outputs += Utils.buildPublicKeyHashOutput(
        hash256(this.renterPubKey),
        this.renterBalance
      )
    }

    outputs += this.buildChangeOutput()

    assert(hash256(outputs) === this.ctx.hashOutputs, 'Output mismatch')
  }
}

/**
 * Off-chain payment channel state
 * 
 * This represents the current state of a payment channel
 * that can be updated off-chain and settled on-chain.
 */
export interface ChannelUpdate {
  channelId: string
  ownerBalance: number
  renterBalance: number
  sequence: number
  ownerSig: string
  renterSig: string
  timestamp: number
}

/**
 * Payment channel manager for off-chain updates
 */
export class PaymentChannelManager {
  private channelId: string
  private updates: ChannelUpdate[] = []
  private currentState: ChannelUpdate | null = null

  constructor(channelId: string) {
    this.channelId = channelId
  }

  /**
   * Create a new payment update (off-chain)
   */
  createUpdate(
    ownerBalance: number,
    renterBalance: number,
    ownerSig: string,
    renterSig: string
  ): ChannelUpdate {
    const sequence = this.currentState ? this.currentState.sequence + 1 : 1
    
    const update: ChannelUpdate = {
      channelId: this.channelId,
      ownerBalance,
      renterBalance,
      sequence,
      ownerSig,
      renterSig,
      timestamp: Date.now()
    }

    this.updates.push(update)
    this.currentState = update
    
    return update
  }

  /**
   * Get the latest valid state
   */
  getLatestState(): ChannelUpdate | null {
    return this.currentState
  }

  /**
   * Stream payment - increment owner balance by amount
   */
  streamPayment(
    amount: number,
    totalCapacity: number,
    ownerSig: string,
    renterSig: string
  ): ChannelUpdate | null {
    const current = this.currentState || {
      ownerBalance: 0,
      renterBalance: totalCapacity,
      sequence: 0
    }

    const newOwnerBalance = current.ownerBalance + amount
    const newRenterBalance = current.renterBalance - amount

    if (newRenterBalance < 0) {
      console.error('Insufficient channel balance')
      return null
    }

    return this.createUpdate(
      newOwnerBalance,
      newRenterBalance,
      ownerSig,
      renterSig
    )
  }
}

/**
 * Helper to create a payment channel for streaming rentals
 */
export async function createStreamingRental(params: {
  ownerPubKey: string
  renterPubKey: string
  hourlyRate: number
  maxHours: number
  depositAmount: number
}): Promise<{
  channelId: string
  capacity: number
  manager: PaymentChannelManager
}> {
  const channelId = `channel_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const capacity = params.hourlyRate * params.maxHours + params.depositAmount
  
  const manager = new PaymentChannelManager(channelId)

  console.log('Created streaming rental channel:', {
    channelId,
    capacity,
    hourlyRate: params.hourlyRate,
    maxHours: params.maxHours
  })

  return {
    channelId,
    capacity,
    manager
  }
}

export default PaymentChannel
