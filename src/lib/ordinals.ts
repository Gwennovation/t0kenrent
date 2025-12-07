/**
 * 1Sat Ordinals Integration for T0kenRent
 * 
 * Implements 1Sat Ordinal verification and linking for asset tokenization.
 * Each rental listing can be linked to a 1Sat ordinal for on-chain proof of ownership.
 */

import { getBSVNetwork, getWhatsonchainApiBase } from './bsv-network'

const ONESAT_API_URL = 'https://ordinals.gorillapool.io/api'
const NETWORK = getBSVNetwork()
const WHATSONCHAIN_API = getWhatsonchainApiBase(NETWORK)

export interface OrdinalInscription {
  id: string // inscription ID (txid_vout format)
  txid: string
  vout: number
  contentType: string
  contentLength: number
  timestamp: number
  owner?: string
  genesisTransaction?: string
  metadata?: Record<string, any>
}

export interface OrdinalOwnership {
  inscriptionId: string
  owner: string
  verified: boolean
  lastChecked: string
}

/**
 * Verify that an ordinal inscription exists
 */
export async function verifyOrdinalExists(inscriptionId: string): Promise<{
  exists: boolean
  inscription?: OrdinalInscription
  error?: string
}> {
  try {
    // Parse inscription ID (format: txid_vout or just txid)
    const [txid, voutStr] = inscriptionId.includes('_') 
      ? inscriptionId.split('_') 
      : [inscriptionId, '0']
    const vout = parseInt(voutStr) || 0
    
    // Try to fetch from 1Sat API
    const response = await fetch(`${ONESAT_API_URL}/inscriptions/${txid}/${vout}`)
    
    if (response.ok) {
      const data = await response.json()
      return {
        exists: true,
        inscription: {
          id: `${txid}_${vout}`,
          txid,
          vout,
          contentType: data.contentType || 'unknown',
          contentLength: data.contentLength || 0,
          timestamp: data.timestamp || Date.now(),
          owner: data.owner,
          genesisTransaction: txid,
          metadata: data.metadata
        }
      }
    }
    
    // Fallback: Check if the transaction exists on WhatsOnChain
    const txResponse = await fetch(`${WHATSONCHAIN_API}/tx/${txid}`)
    if (txResponse.ok) {
      const tx = await txResponse.json()
      return {
        exists: true,
        inscription: {
          id: `${txid}_${vout}`,
          txid,
          vout,
          contentType: 'application/octet-stream',
          contentLength: tx.vout?.[vout]?.value || 0,
          timestamp: tx.time ? tx.time * 1000 : Date.now(),
          genesisTransaction: txid
        }
      }
    }
    
    return { exists: false, error: 'Ordinal not found' }
  } catch (error: any) {
    console.error('Ordinal verification error:', error)
    return { exists: false, error: error.message }
  }
}

/**
 * Get current owner of an ordinal
 */
export async function getOrdinalOwner(inscriptionId: string): Promise<string | null> {
  try {
    const [txid, vout] = inscriptionId.includes('_') 
      ? inscriptionId.split('_') 
      : [inscriptionId, '0']
    
    const response = await fetch(`${ONESAT_API_URL}/inscriptions/${txid}/${vout}/owner`)
    
    if (response.ok) {
      const data = await response.json()
      return data.owner || null
    }
    
    return null
  } catch (error) {
    console.error('Get ordinal owner error:', error)
    return null
  }
}

/**
 * Verify that a user owns a specific ordinal
 */
export async function verifyOrdinalOwnership(
  inscriptionId: string, 
  expectedOwner: string
): Promise<OrdinalOwnership> {
  try {
    const owner = await getOrdinalOwner(inscriptionId)
    
    return {
      inscriptionId,
      owner: owner || 'unknown',
      verified: owner?.toLowerCase() === expectedOwner.toLowerCase(),
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    console.error('Ownership verification error:', error)
    return {
      inscriptionId,
      owner: 'unknown',
      verified: false,
      lastChecked: new Date().toISOString()
    }
  }
}

/**
 * List ordinals owned by an address
 */
export async function listOrdinalsByOwner(ownerAddress: string): Promise<OrdinalInscription[]> {
  try {
    const response = await fetch(`${ONESAT_API_URL}/inscriptions/owner/${ownerAddress}`)
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return (data.inscriptions || []).map((i: any) => ({
      id: i.id || `${i.txid}_${i.vout || 0}`,
      txid: i.txid,
      vout: i.vout || 0,
      contentType: i.contentType || 'unknown',
      contentLength: i.contentLength || 0,
      timestamp: i.timestamp || Date.now(),
      owner: ownerAddress,
      metadata: i.metadata
    }))
  } catch (error) {
    console.error('List ordinals error:', error)
    return []
  }
}

/**
 * Get ordinal content/inscription data
 */
export async function getOrdinalContent(inscriptionId: string): Promise<{
  contentType: string
  content: string | null
  error?: string
}> {
  try {
    const [txid, vout] = inscriptionId.includes('_') 
      ? inscriptionId.split('_') 
      : [inscriptionId, '0']
    
    const response = await fetch(`${ONESAT_API_URL}/inscriptions/${txid}/${vout}/content`)
    
    if (!response.ok) {
      return { contentType: 'unknown', content: null, error: 'Content not found' }
    }
    
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    // For text/JSON content, return as string
    if (contentType.includes('text') || contentType.includes('json')) {
      const text = await response.text()
      return { contentType, content: text }
    }
    
    // For binary content, return base64
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return { contentType, content: `data:${contentType};base64,${base64}` }
  } catch (error: any) {
    console.error('Get ordinal content error:', error)
    return { contentType: 'unknown', content: null, error: error.message }
  }
}

/**
 * Create a mock ordinal for demo purposes
 */
export function createDemoOrdinal(assetId: string, assetName: string): OrdinalInscription {
  const mockTxid = `demo_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`
  
  return {
    id: `${mockTxid}_0`,
    txid: mockTxid,
    vout: 0,
    contentType: 'application/json',
    contentLength: 256,
    timestamp: Date.now(),
    owner: 'demo_owner',
    genesisTransaction: mockTxid,
    metadata: {
      protocol: 'T0kenRent',
      type: 'rental_asset',
      assetId,
      assetName,
      createdAt: new Date().toISOString()
    }
  }
}

/**
 * Format an inscription ID for display
 */
export function formatInscriptionId(id: string, length: number = 12): string {
  if (id.length <= length * 2) return id
  return `${id.slice(0, length)}...${id.slice(-length)}`
}

/**
 * Get explorer URL for an inscription
 */
export function getExplorerUrl(inscriptionId: string): string {
  const [txid] = inscriptionId.includes('_') ? inscriptionId.split('_') : [inscriptionId]
  return `https://whatsonchain.com/tx/${txid}`
}

/**
 * Validate inscription ID format
 */
export function isValidInscriptionId(id: string): boolean {
  if (!id) return false
  
  // Format: txid_vout or just txid (64 hex chars)
  const txidRegex = /^[a-fA-F0-9]{64}$/
  const fullRegex = /^[a-fA-F0-9]{64}_\d+$/
  
  return txidRegex.test(id) || fullRegex.test(id)
}

export default {
  verifyOrdinalExists,
  getOrdinalOwner,
  verifyOrdinalOwnership,
  listOrdinalsByOwner,
  getOrdinalContent,
  createDemoOrdinal,
  formatInscriptionId,
  getExplorerUrl,
  isValidInscriptionId
}
