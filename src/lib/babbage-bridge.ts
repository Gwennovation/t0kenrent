/**
 * Babbage Bridge - Connect BSV Desktop Wallet to BRC-100
 * 
 * This module provides a bridge layer that allows T0kenRent to work with
 * imported BSV Desktop wallet keys by implementing the Babbage SDK interface.
 * 
 * Team: ChibiTech
 * Project: T0kenRent - BSV Hackathon 2025
 */

import crypto from 'crypto'

// Types for BRC-100 compatibility
interface BabbageConfig {
  privateKey: string
  publicKey: string
  identityId: string
  network: 'mainnet' | 'testnet'
}

interface GetPublicKeyOptions {
  protocolID: [number, string] | string
  keyID: string
  counterparty?: string
  forSelf?: boolean
}

interface CreateActionOptions {
  description: string
  inputs?: any[]
  outputs: Array<{
    satoshis: number
    script: string
    basket?: string
    customInstructions?: string
  }>
  lockTime?: number
  version?: number
}

interface CreateActionResult {
  txid: string
  rawTx: string
  inputs?: any[]
  outputs?: any[]
  signableTransaction?: any
}

interface EncryptOptions {
  protocolID: [number, string] | string
  keyID: string
  counterparty?: string
  plaintext: string | Uint8Array
}

interface DecryptOptions {
  protocolID: [number, string] | string
  keyID: string
  counterparty?: string
  ciphertext: string | Uint8Array
}

interface SignatureOptions {
  protocolID: [number, string] | string
  keyID: string
  counterparty?: string
  data: string | Uint8Array
}

/**
 * BabbageBridge - Implements BRC-100 WalletInterface using imported keys
 * 
 * This allows your BSV Desktop wallet private key to work with
 * applications that expect the Babbage SDK interface.
 */
export class BabbageBridge {
  private config: BabbageConfig
  private authenticated: boolean = false
  
  constructor(config: Partial<BabbageConfig>) {
    this.config = {
      privateKey: config.privateKey || '',
      publicKey: config.publicKey || '',
      identityId: config.identityId || '',
      network: config.network || 'testnet'
    }
    
    // Derive public key if not provided
    if (this.config.privateKey && !this.config.publicKey) {
      this.config.publicKey = this.derivePublicKey(this.config.privateKey)
    }
    
    // Generate identity ID if not provided
    if (this.config.publicKey && !this.config.identityId) {
      this.config.identityId = this.generateIdentityId(this.config.publicKey)
    }
  }

  /**
   * Derive public key from private key (secp256k1)
   */
  private derivePublicKey(privateKeyHex: string): string {
    try {
      const ecdh = crypto.createECDH('secp256k1')
      ecdh.setPrivateKey(Buffer.from(privateKeyHex, 'hex'))
      return ecdh.getPublicKey('hex')
    } catch (error) {
      console.error('Failed to derive public key:', error)
      return ''
    }
  }

  /**
   * Generate BRC-100 identity ID from public key
   */
  private generateIdentityId(publicKeyHex: string): string {
    return crypto
      .createHash('sha256')
      .update(Buffer.from(publicKeyHex, 'hex'))
      .digest('hex')
  }

  /**
   * Derive a protocol-specific key (BRC-42 key derivation)
   */
  private deriveProtocolKey(protocolID: [number, string] | string, keyID: string): string {
    const protocolStr = Array.isArray(protocolID) 
      ? `${protocolID[0]}-${protocolID[1]}` 
      : protocolID
    
    // Simple HMAC-based derivation (BRC-42 simplified)
    const derivedKey = crypto
      .createHmac('sha256', this.config.privateKey)
      .update(`${protocolStr}:${keyID}`)
      .digest('hex')
    
    return derivedKey
  }

  // ============================================
  // BRC-100 WalletInterface Implementation
  // ============================================

  /**
   * Check if wallet is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return this.authenticated && !!this.config.privateKey
  }

  /**
   * Wait for authentication (resolves immediately for bridge)
   */
  async waitForAuthentication(): Promise<boolean> {
    if (this.config.privateKey) {
      this.authenticated = true
      return true
    }
    throw new Error('No private key configured. Import your BSV Desktop wallet key first.')
  }

  /**
   * Get public key for a specific protocol
   */
  async getPublicKey(options: GetPublicKeyOptions): Promise<string> {
    if (!this.config.privateKey) {
      throw new Error('Wallet not initialized with private key')
    }
    
    // For 'self' counterparty, return the identity public key
    if (options.counterparty === 'self' || options.forSelf) {
      return this.config.publicKey
    }
    
    // Derive protocol-specific public key
    const derivedPrivate = this.deriveProtocolKey(options.protocolID, options.keyID)
    return this.derivePublicKey(derivedPrivate)
  }

  /**
   * Get the primary identity key
   */
  async getIdentityKey(): Promise<string> {
    return this.config.publicKey
  }

  /**
   * Create a BSV action/transaction
   * 
   * Note: This is a simplified implementation for testing.
   * Production use requires proper transaction building with @bsv/sdk
   */
  async createAction(options: CreateActionOptions): Promise<CreateActionResult> {
    if (!this.config.privateKey) {
      throw new Error('Wallet not initialized')
    }

    console.log('BabbageBridge: Creating action:', options.description)
    
    // For testing/hackathon purposes, return a mock transaction
    // In production, this would build and sign a real BSV transaction
    const mockTxid = crypto.randomBytes(32).toString('hex')
    
    return {
      txid: mockTxid,
      rawTx: '0100000001' + mockTxid, // Placeholder raw tx
      outputs: options.outputs.map((out, idx) => ({
        ...out,
        vout: idx,
        txid: mockTxid
      }))
    }
  }

  /**
   * Sign arbitrary data with protocol-specific key
   */
  async createSignature(options: SignatureOptions): Promise<string> {
    if (!this.config.privateKey) {
      throw new Error('Wallet not initialized')
    }
    
    const derivedKey = this.deriveProtocolKey(options.protocolID, options.keyID)
    const dataBuffer = typeof options.data === 'string' 
      ? Buffer.from(options.data, 'utf8')
      : Buffer.from(options.data)
    
    // HMAC signature (simplified - real implementation uses ECDSA)
    const signature = crypto
      .createHmac('sha256', derivedKey)
      .update(dataBuffer)
      .digest('hex')
    
    return signature
  }

  /**
   * Verify a signature
   */
  async verifySignature(options: SignatureOptions & { signature: string }): Promise<boolean> {
    const expectedSig = await this.createSignature(options)
    return expectedSig === options.signature
  }

  /**
   * Encrypt data using protocol-specific key
   */
  async encrypt(options: EncryptOptions): Promise<string> {
    const derivedKey = this.deriveProtocolKey(options.protocolID, options.keyID)
    const keyBuffer = Buffer.from(derivedKey, 'hex').slice(0, 32) // AES-256 key
    const iv = crypto.randomBytes(16)
    
    const plaintextBuffer = typeof options.plaintext === 'string'
      ? Buffer.from(options.plaintext, 'utf8')
      : Buffer.from(options.plaintext)
    
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv)
    const encrypted = Buffer.concat([cipher.update(plaintextBuffer), cipher.final()])
    const authTag = cipher.getAuthTag()
    
    // Return IV + AuthTag + Ciphertext as hex
    return Buffer.concat([iv, authTag, encrypted]).toString('hex')
  }

  /**
   * Decrypt data using protocol-specific key
   */
  async decrypt(options: DecryptOptions): Promise<string> {
    const derivedKey = this.deriveProtocolKey(options.protocolID, options.keyID)
    const keyBuffer = Buffer.from(derivedKey, 'hex').slice(0, 32)
    
    const ciphertextBuffer = typeof options.ciphertext === 'string'
      ? Buffer.from(options.ciphertext, 'hex')
      : Buffer.from(options.ciphertext)
    
    const iv = ciphertextBuffer.slice(0, 16)
    const authTag = ciphertextBuffer.slice(16, 32)
    const encrypted = ciphertextBuffer.slice(32)
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv)
    decipher.setAuthTag(authTag)
    
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
  }

  /**
   * Get network (mainnet/testnet)
   */
  getNetwork(): string {
    return this.config.network
  }

  /**
   * Get identity information
   */
  getIdentity(): { id: string; publicKey: string } {
    return {
      id: this.config.identityId,
      publicKey: this.config.publicKey
    }
  }
}

/**
 * Create and inject BabbageBridge into window.Babbage
 * This makes T0kenRent work with your imported BSV Desktop wallet
 */
export function injectBabbageBridge(config: Partial<BabbageConfig>): BabbageBridge {
  const bridge = new BabbageBridge(config)
  
  // Inject into window for browser environments
  if (typeof window !== 'undefined') {
    (window as any).Babbage = bridge
    console.log('✅ BabbageBridge injected into window.Babbage')
  }
  
  return bridge
}

/**
 * Load identity from Config/babbage-identity.json
 */
export async function loadBridgeFromConfig(): Promise<BabbageBridge | null> {
  // In browser, try to fetch from public path
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/bridge/identity')
      if (response.ok) {
        const identity = await response.json()
        return injectBabbageBridge({
          privateKey: identity.privateKey,
          publicKey: identity.publicKey,
          identityId: identity.id
        })
      }
    } catch (error) {
      console.warn('Could not load bridge identity:', error)
    }
  }
  
  return null
}

/**
 * Check if BabbageBridge or native Babbage is available
 */
export function isBabbageAvailable(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).Babbage || !!(window as any).babbage
}

export default BabbageBridge
