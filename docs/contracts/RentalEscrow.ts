/**
 * RentalEscrow - sCrypt Smart Contract for T0kenRent
 * 
 * A 2-of-2 multisig escrow contract that manages security deposits
 * for rental agreements on the BSV blockchain.
 * 
 * Features:
 * - 2-of-2 multisig for normal release (owner + renter)
 * - Timeout-based release for dispute resolution
 * - On-chain state tracking
 * 
 * Team: ChibiTech
 * Project: T0kenRent - BSV Hackathon 2025
 * 
 * Note: This is a TypeScript representation of the sCrypt contract.
 * For production, compile with: npx scrypt-cli compile
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
  bsv,
  UTXO,
  MethodCallOptions,
  ContractTransaction,
  StatefulNext
} from 'scrypt-ts'

/**
 * Escrow states
 */
export enum EscrowState {
  CREATED = 0,
  FUNDED = 1,
  ACTIVE = 2,
  RELEASED = 3,
  DISPUTED = 4,
  REFUNDED = 5
}

/**
 * RentalEscrow Contract
 * 
 * Implements a secure escrow mechanism for rental deposits.
 * The contract requires both owner and renter signatures to release funds,
 * with a timeout mechanism for dispute resolution.
 */
export class RentalEscrow extends SmartContract {
  // Owner's public key (asset owner)
  @prop()
  ownerPubKey: PubKey

  // Renter's public key
  @prop()
  renterPubKey: PubKey

  // Deposit amount in satoshis
  @prop()
  depositAmount: bigint

  // Rental fee in satoshis
  @prop()
  rentalFee: bigint

  // Timeout block height for dispute resolution
  @prop()
  timeoutBlock: bigint

  // Current state (stateful property)
  @prop(true)
  state: bigint

  // Rental token ID reference
  @prop()
  rentalTokenId: ByteString

  constructor(
    ownerPubKey: PubKey,
    renterPubKey: PubKey,
    depositAmount: bigint,
    rentalFee: bigint,
    timeoutBlock: bigint,
    rentalTokenId: ByteString
  ) {
    super(...arguments)
    this.ownerPubKey = ownerPubKey
    this.renterPubKey = renterPubKey
    this.depositAmount = depositAmount
    this.rentalFee = rentalFee
    this.timeoutBlock = timeoutBlock
    this.rentalTokenId = rentalTokenId
    this.state = BigInt(EscrowState.CREATED)
  }

  /**
   * Release funds with both signatures (happy path)
   * 
   * Both owner and renter must sign to release the escrow.
   * - Rental fee goes to owner
   * - Deposit returns to renter
   */
  @method()
  public release(ownerSig: Sig, renterSig: Sig) {
    // Verify current state is ACTIVE
    assert(this.state === BigInt(EscrowState.ACTIVE), 'Escrow must be active')

    // Verify both signatures
    assert(
      this.checkSig(ownerSig, this.ownerPubKey),
      'Owner signature invalid'
    )
    assert(
      this.checkSig(renterSig, this.renterPubKey),
      'Renter signature invalid'
    )

    // Update state to RELEASED
    this.state = BigInt(EscrowState.RELEASED)

    // Build outputs:
    // 1. Rental fee to owner
    // 2. Deposit back to renter (minus fee)
    const ownerOutput = Utils.buildPublicKeyHashOutput(
      hash256(this.ownerPubKey),
      this.rentalFee
    )
    
    const renterRefund = this.depositAmount - this.rentalFee
    const renterOutput = Utils.buildPublicKeyHashOutput(
      hash256(this.renterPubKey),
      renterRefund
    )

    // Verify outputs match expected
    const outputs = ownerOutput + renterOutput + this.buildChangeOutput()
    assert(
      hash256(outputs) === this.ctx.hashOutputs,
      'Output mismatch'
    )
  }

  /**
   * Timeout release - owner can claim after timeout
   * 
   * If the renter doesn't return the item by the timeout,
   * the owner can claim the full deposit.
   */
  @method()
  public timeout(ownerSig: Sig) {
    // Verify current state is ACTIVE
    assert(this.state === BigInt(EscrowState.ACTIVE), 'Escrow must be active')

    // Verify timeout has passed (using nLockTime)
    assert(
      this.ctx.locktime >= this.timeoutBlock,
      'Timeout not reached'
    )

    // Verify owner signature
    assert(
      this.checkSig(ownerSig, this.ownerPubKey),
      'Owner signature invalid'
    )

    // Update state to DISPUTED
    this.state = BigInt(EscrowState.DISPUTED)

    // Full amount goes to owner
    const totalAmount = this.depositAmount
    const ownerOutput = Utils.buildPublicKeyHashOutput(
      hash256(this.ownerPubKey),
      totalAmount
    )

    assert(
      hash256(ownerOutput + this.buildChangeOutput()) === this.ctx.hashOutputs,
      'Output mismatch'
    )
  }

  /**
   * Refund - renter can get refund if rental cancelled before active
   * 
   * Requires owner signature to approve refund.
   */
  @method()
  public refund(ownerSig: Sig, renterSig: Sig) {
    // Can only refund if FUNDED (not yet active)
    assert(this.state === BigInt(EscrowState.FUNDED), 'Can only refund when funded')

    // Verify both signatures
    assert(
      this.checkSig(ownerSig, this.ownerPubKey),
      'Owner signature invalid'
    )
    assert(
      this.checkSig(renterSig, this.renterPubKey),
      'Renter signature invalid'
    )

    // Update state
    this.state = BigInt(EscrowState.REFUNDED)

    // Full deposit returns to renter
    const renterOutput = Utils.buildPublicKeyHashOutput(
      hash256(this.renterPubKey),
      this.depositAmount
    )

    assert(
      hash256(renterOutput + this.buildChangeOutput()) === this.ctx.hashOutputs,
      'Output mismatch'
    )
  }

  /**
   * Activate - transition from FUNDED to ACTIVE
   * 
   * Called when renter confirms receipt of the rental item.
   */
  @method()
  public activate(renterSig: Sig) {
    // Must be in FUNDED state
    assert(this.state === BigInt(EscrowState.FUNDED), 'Must be funded first')

    // Renter confirms activation
    assert(
      this.checkSig(renterSig, this.renterPubKey),
      'Renter signature invalid'
    )

    // Transition to ACTIVE
    const nextState = this.state + 1n // FUNDED (1) -> ACTIVE (2)
    
    // Build state output with updated state
    const stateOutput = this.buildStateOutput(this.ctx.utxo.value)
    
    assert(
      hash256(stateOutput + this.buildChangeOutput()) === this.ctx.hashOutputs,
      'Output mismatch'
    )
  }
}

/**
 * Helper type for escrow deployment
 */
export interface EscrowDeployParams {
  ownerPubKey: string
  renterPubKey: string
  depositAmount: number
  rentalFee: number
  timeoutBlocks: number
  rentalTokenId: string
}

/**
 * Helper type for escrow instance
 */
export interface EscrowInstance {
  contractId: string
  txid: string
  vout: number
  state: EscrowState
  params: EscrowDeployParams
  createdAt: Date
}

/**
 * Deploy a new RentalEscrow contract
 */
export async function deployRentalEscrow(
  params: EscrowDeployParams
): Promise<{ txid: string; contractId: string }> {
  // This would be implemented with actual sCrypt deployment
  // For hackathon MVP, we use the API-based approach
  
  console.log('Deploying RentalEscrow with params:', params)
  
  // Placeholder - actual deployment would use:
  // const instance = new RentalEscrow(...)
  // const deployTx = await instance.deploy(depositAmount)
  
  return {
    txid: `deploy_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    contractId: `escrow_${Date.now()}`
  }
}

export default RentalEscrow
