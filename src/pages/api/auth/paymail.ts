import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Paymail Resolution API
 * 
 * Resolves a paymail address to get the associated public key
 * using the BRC-29 (Paymail) protocol
 */

interface PaymailCapabilities {
  pki?: string
  paymentDestination?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { paymail } = req.body

  if (!paymail || typeof paymail !== 'string' || !paymail.includes('@')) {
    return res.status(400).json({ error: 'Invalid paymail address' })
  }

  try {
    const [alias, domain] = paymail.split('@')
    
    // Fetch the paymail capabilities from the well-known endpoint
    const capabilitiesUrl = `https://${domain}/.well-known/bsvalias`
    const capabilitiesResponse = await fetch(capabilitiesUrl, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!capabilitiesResponse.ok) {
      // If we can't resolve capabilities, create a pseudo public key
      // This still allows the user to use QR-based payments
      return res.status(200).json({
        paymail,
        publicKey: `paymail_${alias}_${domain}_${Date.now()}`,
        resolved: false,
        message: 'Paymail provider not reachable, using fallback mode'
      })
    }

    const capabilities = await capabilitiesResponse.json()
    
    // Try to get the public key using PKI capability
    if (capabilities.capabilities?.pki || capabilities.capabilities?.['pki']) {
      const pkiUrl = (capabilities.capabilities.pki || capabilities.capabilities['pki'])
        .replace('{alias}', alias)
        .replace('{domain.tld}', domain)
      
      const pkiResponse = await fetch(pkiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      })

      if (pkiResponse.ok) {
        const pkiData = await pkiResponse.json()
        return res.status(200).json({
          paymail,
          publicKey: pkiData.pubkey || pkiData.publicKey,
          resolved: true
        })
      }
    }

    // If PKI not available, use the paymail as identifier
    return res.status(200).json({
      paymail,
      publicKey: `paymail_${alias}_${domain}_${Date.now()}`,
      resolved: false,
      message: 'PKI not available, using paymail as identifier'
    })

  } catch (error) {
    console.error('Paymail resolution error:', error)
    
    // Return a fallback response that still allows connection
    const [alias, domain] = paymail.split('@')
    return res.status(200).json({
      paymail,
      publicKey: `paymail_${alias}_${domain}_${Date.now()}`,
      resolved: false,
      message: 'Could not resolve paymail, using fallback mode'
    })
  }
}
