import type { NextApiRequest, NextApiResponse } from 'next'
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
      status = 'available',
      page = '1',
      limit = '20'
    } = req.query

    // Get assets from storage
    const allAssets = storage.getAllAssets({
      category: category as string,
      status: status as string,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined
    })

    // Pagination
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const start = (pageNum - 1) * limitNum
    const paginatedAssets = allAssets.slice(start, start + limitNum)

    // Transform for response (hide rental details)
    const transformedAssets = paginatedAssets.map(asset => ({
      id: asset.id,
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
        total: allAssets.length,
        pages: Math.ceil(allAssets.length / limitNum)
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
