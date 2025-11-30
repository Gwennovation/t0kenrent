import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { MOCK_MODE } from '@/lib/mongodb'
import Chain from '@/models/Chain'
import { inMemoryStorage } from '@/lib/storage'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { ownerKey, status } = req.query

    if (MOCK_MODE) {
      // Return from in-memory storage
      let chains = [...inMemoryStorage.chains]
      
      // Add some demo chains if empty
      if (chains.length === 0) {
        const demoChains = [
          {
            chainId: 'chain_demo_camera',
            title: 'Camera Equipment Rental',
            description: 'Professional camera kit rental lifecycle',
            ownerKey: ownerKey as string || 'demo_owner',
            ownerName: 'Demo User',
            stages: [
              {
                id: 'stage_1',
                stageIndex: 0,
                title: 'Item Listed',
                metadata: { condition: 'Excellent', location: 'San Francisco' },
                requiresPayment: false,
                status: 'completed' as const,
                txid: 'demo_tx_001',
                timestamp: new Date(Date.now() - 86400000)
              },
              {
                id: 'stage_2',
                stageIndex: 1,
                title: 'Rental Approved',
                metadata: { renter: 'John Doe', duration: '3 days' },
                requiresPayment: false,
                status: 'completed' as const,
                txid: 'demo_tx_002',
                timestamp: new Date(Date.now() - 43200000)
              },
              {
                id: 'stage_3',
                stageIndex: 2,
                title: 'Payment Required',
                metadata: { amount: 150, currency: 'USD' },
                requiresPayment: true,
                rentAmount: 150,
                status: 'active' as const
              }
            ],
            status: 'active' as const,
            totalStages: 3,
            completedStages: 2,
            totalPaymentsReceived: 0,
            createdAt: new Date(Date.now() - 86400000),
            updatedAt: new Date()
          },
          {
            chainId: 'chain_demo_tools',
            title: 'Power Tools Rental',
            description: 'Track rental of power tool set',
            ownerKey: ownerKey as string || 'demo_owner',
            ownerName: 'Demo User',
            stages: [
              {
                id: 'stage_1',
                stageIndex: 0,
                title: 'Listed for Rent',
                metadata: { items: ['Drill', 'Saw', 'Sander'] },
                requiresPayment: false,
                status: 'completed' as const,
                txid: 'demo_tx_003',
                timestamp: new Date(Date.now() - 172800000)
              }
            ],
            status: 'active' as const,
            totalStages: 1,
            completedStages: 1,
            totalPaymentsReceived: 0,
            createdAt: new Date(Date.now() - 172800000),
            updatedAt: new Date()
          }
        ]
        chains = demoChains
      }

      // Filter by owner if provided
      if (ownerKey) {
        chains = chains.filter(c => c.ownerKey === ownerKey || c.ownerKey === 'demo_owner')
      }

      // Filter by status if provided
      if (status && status !== 'all') {
        chains = chains.filter(c => c.status === status)
      }

      return res.status(200).json({
        success: true,
        chains,
        total: chains.length
      })
    }

    // Query MongoDB
    await connectDB()
    
    const query: any = {}
    if (ownerKey) query.ownerKey = ownerKey
    if (status && status !== 'all') query.status = status

    const chains = await Chain.find(query)
      .sort({ createdAt: -1 })
      .limit(50)

    return res.status(200).json({
      success: true,
      chains: chains.map(c => c.toObject()),
      total: chains.length
    })

  } catch (error: any) {
    console.error('Chain list error:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch chains',
      message: error.message 
    })
  }
}
