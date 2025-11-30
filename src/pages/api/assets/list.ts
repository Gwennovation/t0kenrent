import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/mongodb'
import RentalAsset from '@/models/RentalAsset'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await connectDB()

    const {
      category,
      maxPrice,
      city,
      status = 'available',
      page = '1',
      limit = '20'
    } = req.query

    // Build query
    const query: any = {}
    
    if (status) {
      query.status = status
    }
    
    if (category && category !== 'all') {
      query.category = category
    }
    
    if (maxPrice) {
      query.rentalRatePerDay = { $lte: parseFloat(maxPrice as string) }
    }
    
    if (city) {
      query['location.city'] = new RegExp(city as string, 'i')
    }

    // Pagination
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    // Fetch assets (exclude protected rental details)
    const assets = await RentalAsset.find(query)
      .select('-rentalDetails -http402Payments')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    // Get total count for pagination
    const total = await RentalAsset.countDocuments(query)

    // Transform for response
    const transformedAssets = assets.map((asset: any) => ({
      id: asset._id.toString(),
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
      createdAt: asset.createdAt
    }))

    return res.status(200).json({
      assets: transformedAssets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
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
