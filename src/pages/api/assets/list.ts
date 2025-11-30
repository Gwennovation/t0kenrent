import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { RentalAsset } from '@/models'
import { storage } from '@/lib/storage'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      category,
      maxPrice,
      status,
      page = '1',
      limit = '20'
    } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)

    // Connect to MongoDB
    await connectDB()

    let assets: any[] = []
    let totalCount = 0

    if (isMockMode()) {
      // Use in-memory storage for demo
      const allAssets = storage.getAllAssets({
        category: category as string,
        status: status as string,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined
      })
      
      totalCount = allAssets.length
      const start = (pageNum - 1) * limitNum
      assets = allAssets.slice(start, start + limitNum)
    } else {
      // Use MongoDB
      const query: any = {}
      
      if (status) query.status = status
      if (category && category !== 'all') query.category = category
      if (maxPrice) query.rentalRatePerDay = { $lte: parseFloat(maxPrice as string) }
      
      totalCount = await RentalAsset.countDocuments(query)
      assets = await RentalAsset.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
    }

    // Transform for response (hide rental details)
    const transformedAssets = assets.map((asset: any) => ({
      id: asset._id?.toString() || asset.id,
      tokenId: asset.tokenId,
      name: asset.name,
      description: asset.description,
      category: asset.category,
      imageUrl: asset.imageUrl,
      rentalRatePerDay: asset.rentalRatePerDay,
      depositAmount: asset.depositAmount,
      currency: asset.currency,
      location: asset.location,
      status: asset.status,
      rating: asset.rating,
      unlockFee: asset.unlockFee,
      ownerKey: asset.ownerKey,
      createdAt: asset.createdAt,
      totalRentals: asset.totalRentals || 0,
      totalEarnings: asset.totalEarnings || 0
    }))

    return res.status(200).json({
      assets: transformedAssets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    })

  } catch (error: any) {
    console.error('Asset listing error:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch assets',
      message: error.message 
    })
  }
}
