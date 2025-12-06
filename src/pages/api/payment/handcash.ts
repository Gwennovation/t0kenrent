import type { NextApiRequest, NextApiResponse } from 'next'
import { requestPaymentServer } from '@/lib/handcash-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { accessToken, amount, destination, description, paymentReference } = req.body

    if (!accessToken) {
      return res.status(401).json({ error: 'HandCash access token required' })
    }

    if (!amount || !destination) {
      return res.status(400).json({ error: 'Amount and destination required' })
    }

    console.log('💳 Processing HandCash payment:', {
      destination: destination?.substring(0, 20) + '...',
      amount,
      description,
      hasValidFormat: destination?.includes('@') || destination?.startsWith('$')
    })

    // Request payment via HandCash (server-side SDK)
    const result = await requestPaymentServer({
      accessToken,
      destination,
      amount,
      currencyCode: 'BSV',
      description: description || 'T0kenRent Payment'
    })

    return res.status(200).json({
      success: true,
      transactionId: result.transactionId,
      paymentReference
    })

  } catch (error) {
    console.error('HandCash payment error:', error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Payment failed' 
    })
  }
}
