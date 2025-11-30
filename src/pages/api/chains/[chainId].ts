import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { MOCK_MODE } from '@/lib/mongodb'
import Chain from '@/models/Chain'
import { inMemoryStorage } from '@/lib/storage'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { chainId } = req.query

  if (!chainId || typeof chainId !== 'string') {
    return res.status(400).json({ error: 'Chain ID is required' })
  }

  if (req.method === 'GET') {
    return getChain(chainId, res)
  } else if (req.method === 'PUT') {
    return updateChain(chainId, req.body, res)
  } else if (req.method === 'DELETE') {
    return deleteChain(chainId, res)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function getChain(chainId: string, res: NextApiResponse) {
  try {
    if (MOCK_MODE) {
      const chain = inMemoryStorage.chains.find(c => c.chainId === chainId)
      
      // Return demo chain if not found
      if (!chain && chainId.startsWith('chain_demo')) {
        const demoChain = {
          chainId,
          title: 'Demo Supply Chain',
          description: 'A demonstration rental chain',
          ownerKey: 'demo_owner',
          ownerName: 'Demo User',
          stages: [],
          status: 'draft' as const,
          totalStages: 0,
          completedStages: 0,
          totalPaymentsReceived: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        return res.status(200).json({ success: true, chain: demoChain })
      }

      if (!chain) {
        return res.status(404).json({ error: 'Chain not found' })
      }

      return res.status(200).json({ success: true, chain })
    }

    await connectDB()
    const chain = await Chain.findOne({ chainId })

    if (!chain) {
      return res.status(404).json({ error: 'Chain not found' })
    }

    return res.status(200).json({ success: true, chain: chain.toObject() })

  } catch (error: any) {
    console.error('Get chain error:', error)
    return res.status(500).json({ error: 'Failed to fetch chain', message: error.message })
  }
}

async function updateChain(chainId: string, data: any, res: NextApiResponse) {
  try {
    const { title, description, status } = data

    if (MOCK_MODE) {
      const chainIndex = inMemoryStorage.chains.findIndex(c => c.chainId === chainId)
      
      if (chainIndex === -1) {
        return res.status(404).json({ error: 'Chain not found' })
      }

      const chain = inMemoryStorage.chains[chainIndex]
      if (title) chain.title = title
      if (description !== undefined) chain.description = description
      if (status) chain.status = status
      chain.updatedAt = new Date()

      return res.status(200).json({ success: true, chain })
    }

    await connectDB()
    const updateData: any = { updatedAt: new Date() }
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status) updateData.status = status

    const chain = await Chain.findOneAndUpdate(
      { chainId },
      updateData,
      { new: true }
    )

    if (!chain) {
      return res.status(404).json({ error: 'Chain not found' })
    }

    return res.status(200).json({ success: true, chain: chain.toObject() })

  } catch (error: any) {
    console.error('Update chain error:', error)
    return res.status(500).json({ error: 'Failed to update chain', message: error.message })
  }
}

async function deleteChain(chainId: string, res: NextApiResponse) {
  try {
    if (MOCK_MODE) {
      const chainIndex = inMemoryStorage.chains.findIndex(c => c.chainId === chainId)
      
      if (chainIndex === -1) {
        return res.status(404).json({ error: 'Chain not found' })
      }

      inMemoryStorage.chains.splice(chainIndex, 1)
      return res.status(200).json({ success: true, message: 'Chain deleted' })
    }

    await connectDB()
    const result = await Chain.deleteOne({ chainId })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Chain not found' })
    }

    return res.status(200).json({ success: true, message: 'Chain deleted' })

  } catch (error: any) {
    console.error('Delete chain error:', error)
    return res.status(500).json({ error: 'Failed to delete chain', message: error.message })
  }
}
