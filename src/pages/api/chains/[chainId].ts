import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/mongodb'
import ActionChain from '@/models/ActionChain'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { chainId } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await connectDB()

    const actionChain = await ActionChain.findOne({ chainId })

    if (!actionChain) {
      return res.status(404).json({ error: 'Action chain not found' })
    }

    return res.status(200).json(actionChain)

  } catch (error: any) {
    console.error('Failed to fetch chain:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch action chain',
      message: error.message 
    })
  }
}
