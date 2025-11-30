/**
 * Bridge Identity API
 * 
 * Serves the imported BSV Desktop wallet identity for the BabbageBridge.
 * This allows T0kenRent to work with your existing BSV wallet keys.
 * 
 * Team: ChibiTech
 * Project: T0kenRent - BSV Hackathon 2025
 * 
 * ⚠️  SECURITY WARNING: This endpoint exposes private keys.
 * Only use in development/testing environments!
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const CONFIG_DIR = path.join(process.cwd(), 'Config')
const IDENTITY_FILE = path.join(CONFIG_DIR, 'babbage-identity.json')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow in development or when explicitly enabled
  const isDev = process.env.NODE_ENV === 'development'
  const bridgeEnabled = process.env.ENABLE_WALLET_BRIDGE === 'true'
  
  if (!isDev && !bridgeEnabled) {
    return res.status(403).json({
      error: 'Bridge disabled',
      message: 'Wallet bridge is only available in development mode'
    })
  }

  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(IDENTITY_FILE)) {
        return res.status(404).json({
          error: 'No identity found',
          message: 'Run `node scripts/wallet-bridge.js` to import your BSV Desktop wallet',
          instructions: [
            '1. Export WIF private key from your BSV Desktop wallet',
            '2. Run: node scripts/wallet-bridge.js',
            '3. Select option 1 to import WIF key',
            '4. Restart the development server'
          ]
        })
      }

      const identity = JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf8'))
      
      // In development, return full identity including private key
      if (isDev) {
        return res.status(200).json({
          id: identity.id,
          publicKey: identity.publicKey,
          privateKey: identity.privateKey,
          source: identity.source || 'unknown',
          createdAt: identity.createdAt,
          metadata: identity.metadata,
          warning: 'Private key exposed - development mode only!'
        })
      }

      // In production with bridge enabled, only return public info
      return res.status(200).json({
        id: identity.id,
        publicKey: identity.publicKey,
        source: identity.source || 'unknown',
        createdAt: identity.createdAt
      })
      
    } catch (error: any) {
      return res.status(500).json({
        error: 'Failed to load identity',
        message: error.message
      })
    }
  }

  if (req.method === 'POST') {
    // Allow importing identity via API in development
    if (!isDev) {
      return res.status(403).json({ error: 'Import only available in development' })
    }

    try {
      const { privateKey, wif } = req.body

      if (!privateKey && !wif) {
        return res.status(400).json({
          error: 'Missing key',
          message: 'Provide privateKey (hex) or wif in request body'
        })
      }

      let privateKeyHex = privateKey

      // Convert WIF to hex if provided
      if (wif && !privateKeyHex) {
        try {
          // Dynamic import for @bsv/sdk
          const { PrivateKey } = await import('@bsv/sdk')
          const pk = PrivateKey.fromWif(wif)
          privateKeyHex = pk.toString()
        } catch (e) {
          return res.status(400).json({
            error: 'WIF conversion failed',
            message: 'Install @bsv/sdk or provide hex privateKey instead'
          })
        }
      }

      // Generate identity
      const crypto = await import('crypto')
      const ecdh = crypto.createECDH('secp256k1')
      ecdh.setPrivateKey(Buffer.from(privateKeyHex, 'hex'))
      const publicKeyHex = ecdh.getPublicKey('hex')
      const identityId = crypto
        .createHash('sha256')
        .update(Buffer.from(publicKeyHex, 'hex'))
        .digest('hex')

      const identity = {
        id: identityId,
        publicKey: publicKeyHex,
        privateKey: privateKeyHex,
        createdAt: new Date().toISOString(),
        source: 'api-import',
        metadata: {
          importedAt: new Date().toISOString(),
          team: 'ChibiTech',
          project: 'T0kenRent'
        },
        note: 'Imported via API for T0kenRent testing'
      }

      // Save to config
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true })
      }
      fs.writeFileSync(IDENTITY_FILE, JSON.stringify(identity, null, 2), { mode: 0o600 })

      return res.status(201).json({
        success: true,
        id: identity.id,
        publicKey: identity.publicKey,
        message: 'Identity imported successfully'
      })
      
    } catch (error: any) {
      return res.status(500).json({
        error: 'Import failed',
        message: error.message
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
