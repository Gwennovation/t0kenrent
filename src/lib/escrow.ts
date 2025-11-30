/**
 * Escrow Smart Contract Implementation for T0kenRent
 * 
 * Implements a 2-of-2 multisig escrow system for rental deposits.
 * Both the owner and renter must sign to release funds.
 * 
 * Features:
 * - 2-of-2 multisig lock
 * - Automatic release on dual signature
 * - Timeout mechanism for dispute resolution
 * - Support for partial releases (damage deductions)
 */

import { Script } from '@bsv/sdk'

// Configuration
const DEFAULT_TIMEOUT_BLOCKS = 144 // ~1 day at 10 min/block
const MIN_ESCROW_AMOUNT = 0.0001 // BSV

export interface EscrowParams {
  // Parties
  ownerKey: string
  renterKey: string
  
  // Amounts
  depositAmount: number
  rentalFee: number
  currency: string
  
  // References
  rentalId: string
  assetId: string
  assetName: string
  
  // Config
  timeoutBlocks?: number
}

export interface EscrowContract {
  // Identity
  id: string
  address: string
  
  // Script
  multisigScript: string
  redeemScript: string
  
  // Parties
  ownerKey: string
  renterKey: string
  
  // Amounts
  depositAmount: number
  rentalFee: number
  totalAmount: number
  currency: string
  
  // References
  rentalId: string
  assetId: string
  assetName: string
  
  // Config
  timeoutBlocks: number
  
  // Status
  status: 'created' | 'funded' | 'active' | 'releasing' | 'released' | 'disputed' | 'expired'
  
  // Timestamps
  createdAt: string
  fundedAt?: string
  releasedAt?: string
}

export interface EscrowSignature {
  signerKey: string
  signature: string
  signedAt: string
}

export interface EscrowRelease {
  escrowId: string
  releaseType: 'standard' | 'partial' | 'full_to_owner' | 'full_to_renter'
  
  // Breakdown
  toOwner: number
  toRenter: number
  
  // Signatures
  ownerSignature?: EscrowSignature
  renterSignature?: EscrowSignature
  
  // Transaction
  releaseTxId?: string
  
  // Status
  status: 'pending_signatures' | 'ready' | 'released' | 'failed'
}

/**
 * Create a new escrow contract
 */
export function createEscrowContract(params: EscrowParams): EscrowContract {
  const id = generateEscrowId()
  const totalAmount = params.depositAmount + params.rentalFee
  
  // Create 2-of-2 multisig script
  const { multisigScript, redeemScript } = createMultisigScript(
    params.ownerKey,
    params.renterKey
  )
  
  // Generate escrow address from script
  const address = generateEscrowAddress(id, multisigScript)
  
  return {
    id,
    address,
    multisigScript,
    redeemScript,
    ownerKey: params.ownerKey,
    renterKey: params.renterKey,
    depositAmount: params.depositAmount,
    rentalFee: params.rentalFee,
    totalAmount,
    currency: params.currency,
    rentalId: params.rentalId,
    assetId: params.assetId,
    assetName: params.assetName,
    timeoutBlocks: params.timeoutBlocks || DEFAULT_TIMEOUT_BLOCKS,
    status: 'created',
    createdAt: new Date().toISOString()
  }
}

/**
 * Create a 2-of-2 multisig script
 * Format: OP_2 <pubkey1> <pubkey2> OP_2 OP_CHECKMULTISIG
 */
export function createMultisigScript(ownerKey: string, renterKey: string): {
  multisigScript: string
  redeemScript: string
} {
  try {
    // Sort keys for deterministic script (P2SH standard)
    const [key1, key2] = [ownerKey, renterKey].sort()
    
    // Build the multisig script ASM
    const asmScript = `OP_2 ${key1} ${key2} OP_2 OP_CHECKMULTISIG`
    
    // Try to create proper Bitcoin Script
    const script = Script.fromASM(asmScript)
    const scriptHex = script.toHex()
    
    // Create P2SH redeem script
    const redeemScript = createRedeemScript(scriptHex)
    
    return {
      multisigScript: scriptHex,
      redeemScript
    }
  } catch (error) {
    // Fallback to string representation for demo
    console.warn('Script creation fallback:', error)
    const fallbackScript = `OP_2 ${ownerKey} ${renterKey} OP_2 OP_CHECKMULTISIG`
    return {
      multisigScript: fallbackScript,
      redeemScript: fallbackScript
    }
  }
}

/**
 * Create P2SH redeem script
 */
function createRedeemScript(multisigScriptHex: string): string {
  try {
    // In production, this would create a proper P2SH script
    // OP_HASH160 <hash160(script)> OP_EQUAL
    const scriptHash = Buffer.from(multisigScriptHex, 'hex')
      .toString('base64')
      .substring(0, 20)
    return `OP_HASH160 ${scriptHash} OP_EQUAL`
  } catch (error) {
    return multisigScriptHex
  }
}

/**
 * Generate unique escrow ID
 */
function generateEscrowId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `escrow_${timestamp}_${random}`
}

/**
 * Generate escrow address from script
 */
function generateEscrowAddress(escrowId: string, script: string): string {
  // In production, this derives a P2SH address from the multisig script
  // For demo, generate a deterministic-looking address
  const hash = Buffer.from(escrowId + script)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 32)
  return `3${hash}`
}

/**
 * Create a signature for escrow release
 */
export function createSignature(
  escrowId: string,
  signerKey: string,
  action: 'release' | 'dispute'
): EscrowSignature {
  // In production, this would create a real cryptographic signature
  // using the signer's private key
  const signatureData = `${escrowId}_${signerKey}_${action}_${Date.now()}`
  const signature = Buffer.from(signatureData).toString('base64')
  
  return {
    signerKey,
    signature: `sig_${signature.substring(0, 40)}`,
    signedAt: new Date().toISOString()
  }
}

/**
 * Verify a signature
 */
export function verifySignature(
  signature: EscrowSignature,
  escrowContract: EscrowContract,
  expectedKey: string
): boolean {
  // In production, verify cryptographic signature
  // For demo, check that signer matches expected
  return signature.signerKey === expectedKey && 
         (signature.signerKey === escrowContract.ownerKey || 
          signature.signerKey === escrowContract.renterKey)
}

/**
 * Initialize escrow release process
 */
export function initializeRelease(
  escrow: EscrowContract,
  releaseType: EscrowRelease['releaseType'] = 'standard',
  damageAmount: number = 0
): EscrowRelease {
  let toOwner = escrow.rentalFee
  let toRenter = escrow.depositAmount
  
  switch (releaseType) {
    case 'partial':
      // Deduct damage from renter's deposit
      const deduction = Math.min(damageAmount, escrow.depositAmount)
      toRenter -= deduction
      toOwner += deduction
      break
      
    case 'full_to_owner':
      // All funds to owner (e.g., renter breach)
      toOwner = escrow.totalAmount
      toRenter = 0
      break
      
    case 'full_to_renter':
      // All funds to renter (e.g., owner breach)
      toOwner = 0
      toRenter = escrow.totalAmount
      break
      
    default:
      // Standard release: fee to owner, deposit to renter
      break
  }
  
  return {
    escrowId: escrow.id,
    releaseType,
    toOwner,
    toRenter,
    status: 'pending_signatures'
  }
}

/**
 * Add signature to release
 */
export function addSignatureToRelease(
  release: EscrowRelease,
  escrow: EscrowContract,
  signature: EscrowSignature
): EscrowRelease {
  const isOwner = signature.signerKey === escrow.ownerKey
  const isRenter = signature.signerKey === escrow.renterKey
  
  if (!isOwner && !isRenter) {
    throw new Error('Signer is not a party to this escrow')
  }
  
  if (isOwner) {
    release.ownerSignature = signature
  } else {
    release.renterSignature = signature
  }
  
  // Check if both have signed
  if (release.ownerSignature && release.renterSignature) {
    release.status = 'ready'
  }
  
  return release
}

/**
 * Check if escrow can be released
 */
export function canRelease(release: EscrowRelease): boolean {
  return release.status === 'ready' &&
         !!release.ownerSignature &&
         !!release.renterSignature
}

/**
 * Execute escrow release (create release transaction)
 */
export async function executeRelease(
  escrow: EscrowContract,
  release: EscrowRelease
): Promise<{
  success: boolean
  txId?: string
  error?: string
}> {
  if (!canRelease(release)) {
    return { 
      success: false, 
      error: 'Cannot release: missing signatures' 
    }
  }
  
  try {
    // In production, this would:
    // 1. Create a Bitcoin transaction spending the escrow UTXO
    // 2. Add outputs for owner and renter based on release breakdown
    // 3. Sign with both parties' signatures
    // 4. Broadcast to network
    
    // For demo, generate mock transaction ID
    const txId = `release_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`
    
    release.releaseTxId = txId
    release.status = 'released'
    
    return {
      success: true,
      txId
    }
  } catch (error: any) {
    release.status = 'failed'
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Check if escrow has timed out
 */
export function isEscrowTimedOut(
  escrow: EscrowContract,
  currentBlockHeight: number,
  fundedBlockHeight: number
): boolean {
  const blocksSinceFunding = currentBlockHeight - fundedBlockHeight
  return blocksSinceFunding >= escrow.timeoutBlocks
}

/**
 * Get escrow status summary
 */
export function getEscrowStatus(escrow: EscrowContract): {
  status: string
  canRelease: boolean
  waitingFor: string[]
  message: string
} {
  const waitingFor: string[] = []
  
  switch (escrow.status) {
    case 'created':
      return {
        status: 'Awaiting Funding',
        canRelease: false,
        waitingFor: ['funding'],
        message: 'Escrow created. Waiting for renter to fund.'
      }
      
    case 'funded':
      return {
        status: 'Funded',
        canRelease: false,
        waitingFor: ['rental_start'],
        message: 'Escrow funded. Rental period has not started.'
      }
      
    case 'active':
      return {
        status: 'Active',
        canRelease: true,
        waitingFor: [],
        message: 'Rental in progress. Both parties can sign to release.'
      }
      
    case 'releasing':
      return {
        status: 'Releasing',
        canRelease: true,
        waitingFor: ['signature'],
        message: 'One party has signed. Waiting for other signature.'
      }
      
    case 'released':
      return {
        status: 'Released',
        canRelease: false,
        waitingFor: [],
        message: 'Escrow has been released to both parties.'
      }
      
    case 'disputed':
      return {
        status: 'Disputed',
        canRelease: false,
        waitingFor: ['resolution'],
        message: 'Escrow is under dispute. Awaiting resolution.'
      }
      
    case 'expired':
      return {
        status: 'Expired',
        canRelease: false,
        waitingFor: [],
        message: 'Escrow has expired. Funds returned to renter.'
      }
      
    default:
      return {
        status: 'Unknown',
        canRelease: false,
        waitingFor: [],
        message: 'Unknown escrow status.'
      }
  }
}

export default {
  createEscrowContract,
  createMultisigScript,
  createSignature,
  verifySignature,
  initializeRelease,
  addSignatureToRelease,
  canRelease,
  executeRelease,
  isEscrowTimedOut,
  getEscrowStatus,
  DEFAULT_TIMEOUT_BLOCKS,
  MIN_ESCROW_AMOUNT
}
