import type { NextApiRequest, NextApiResponse } from 'next'
import { requestPayment } from '@/lib/handcash'

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

    // Request payment via HandCash
    const result = await requestPayment({
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
