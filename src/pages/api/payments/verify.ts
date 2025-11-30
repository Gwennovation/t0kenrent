import type { NextApiRequest, NextApiResponse } from 'next'
import { getTransactionByTxid } from '@/lib/overlay'
import { decodeMNEEAmount } from '@/lib/mnee'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { txid, expectedAmount } = req.body

    if (!txid) {
      return res.status(400).json({ error: 'Missing txid' })
    }

    // Fetch transaction from overlay
    const tx = await getTransactionByTxid(txid)

    if (!tx) {
      return res.status(404).json({ 
        verified: false,
        status: 'not_found',
        error: 'Transaction not found' 
      })
    }

    // Check if transaction is confirmed
    if (!tx.timestamp || tx.timestamp === 0) {
      return res.status(200).json({
        verified: false,
        status: 'pending',
        message: 'Transaction not yet confirmed'
      })
    }

    // Verify MNEE amount if provided
    if (expectedAmount) {
      const actualAmount = decodeMNEEAmount(tx.outputs[0].script)

      if (actualAmount !== expectedAmount) {
        return res.status(200).json({
          verified: false,
          status: 'amount_mismatch',
          expected: expectedAmount,
          actual: actualAmount
        })
      }
    }

    // Payment verified
    return res.status(200).json({
      verified: true,
      status: 'verified',
      txid,
      amount: decodeMNEEAmount(tx.outputs[0].script),
      timestamp: tx.timestamp
    })

  } catch (error: any) {
    console.error('Payment verification error:', error)
    return res.status(500).json({ 
      verified: false,
      status: 'error',
      error: 'Verification failed',
      message: error.message 
    })
  }
}
