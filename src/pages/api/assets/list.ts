import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { isMockMode } from '@/lib/mongodb'
import RentalAsset from '@/models/RentalAsset'

// Mock data for testing without MongoDB
const MOCK_ASSETS = [
  {
    id: 'mock_asset_001',
    tokenId: 'token_camera_001',
    name: 'Canon EOS R5 Camera Kit',
    description: 'Professional mirrorless camera with RF 24-70mm lens. Perfect for photography and video projects.',
    category: 'electronics',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
    rentalRatePerDay: 50,
    depositAmount: 500,
    currency: 'MNEE',
    location: { city: 'San Francisco', country: 'USA' },
    status: 'available',
    rating: 4.8,
    unlockFee: 0.01,
    ownerKey: '04813250da3d3f1b3ee46f0c9062813bee38e54fcd66e7cb944ae7445dda3a536653a8612d47e44b54368afda1b8685e1aec0063f4d943300bfc8133bf1571d18e',
    createdAt: new Date('2025-11-28').toISOString()
  },
  {
    id: 'mock_asset_002',
    tokenId: 'token_bike_001',
    name: 'Trek Mountain Bike',
    description: 'High-performance mountain bike, great for trails and off-road adventures.',
    category: 'sports',
    imageUrl: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400',
    rentalRatePerDay: 25,
    depositAmount: 200,
    currency: 'MNEE',
    location: { city: 'Denver', country: 'USA' },
    status: 'available',
    rating: 4.6,
    unlockFee: 0.01,
    ownerKey: '04813250da3d3f1b3ee46f0c9062813bee38e54fcd66e7cb944ae7445dda3a536653a8612d47e44b54368afda1b8685e1aec0063f4d943300bfc8133bf1571d18e',
    createdAt: new Date('2025-11-27').toISOString()
  },
  {
    id: 'mock_asset_003',
    tokenId: 'token_drill_001',
    name: 'DeWalt Power Drill Set',
    description: 'Complete cordless drill kit with multiple bits and carrying case.',
    category: 'tools',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
    rentalRatePerDay: 15,
    depositAmount: 100,
    currency: 'MNEE',
    location: { city: 'Austin', country: 'USA' },
    status: 'available',
    rating: 4.9,
    unlockFee: 0.005,
    ownerKey: '04813250da3d3f1b3ee46f0c9062813bee38e54fcd66e7cb944ae7445dda3a536653a8612d47e44b54368afda1b8685e1aec0063f4d943300bfc8133bf1571d18e',
    createdAt: new Date('2025-11-26').toISOString()
  },
  {
    id: 'mock_asset_004',
    tokenId: 'token_projector_001',
    name: 'Epson Home Cinema Projector',
    description: '4K PRO-UHD projector, perfect for movie nights and presentations.',
    category: 'electronics',
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400',
    rentalRatePerDay: 40,
    depositAmount: 300,
    currency: 'MNEE',
    location: { city: 'New York', country: 'USA' },
    status: 'available',
    rating: 4.7,
    unlockFee: 0.01,
    ownerKey: '04813250da3d3f1b3ee46f0c9062813bee38e54fcd66e7cb944ae7445dda3a536653a8612d47e44b54368afda1b8685e1aec0063f4d943300bfc8133bf1571d18e',
    createdAt: new Date('2025-11-25').toISOString()
  },
  {
    id: 'mock_asset_005',
    tokenId: 'token_tent_001',
    name: '4-Person Camping Tent',
    description: 'Waterproof dome tent with easy setup, perfect for weekend camping trips.',
    category: 'outdoor',
    imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400',
    rentalRatePerDay: 20,
    depositAmount: 150,
    currency: 'MNEE',
    location: { city: 'Seattle', country: 'USA' },
    status: 'available',
    rating: 4.5,
    unlockFee: 0.005,
    ownerKey: '04813250da3d3f1b3ee46f0c9062813bee38e54fcd66e7cb944ae7445dda3a536653a8612d47e44b54368afda1b8685e1aec0063f4d943300bfc8133bf1571d18e',
    createdAt: new Date('2025-11-24').toISOString()
  }
]

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const db = await connectDB()
    
    const {
      category,
      maxPrice,
      city,
      status = 'available',
      page = '1',
      limit = '20'
    } = req.query

    // Pagination params
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)

    // If in mock mode, use mock data
    if (isMockMode() || !db) {
      let filteredAssets = [...MOCK_ASSETS]
      
      // Apply filters
      if (status) {
        filteredAssets = filteredAssets.filter(a => a.status === status)
      }
      if (category && category !== 'all') {
        filteredAssets = filteredAssets.filter(a => a.category === category)
      }
      if (maxPrice) {
        const maxPriceNum = parseFloat(maxPrice as string)
        filteredAssets = filteredAssets.filter(a => a.rentalRatePerDay <= maxPriceNum)
      }
      if (city) {
        const cityRegex = new RegExp(city as string, 'i')
        filteredAssets = filteredAssets.filter(a => cityRegex.test(a.location.city))
      }

      // Paginate
      const start = (pageNum - 1) * limitNum
      const paginatedAssets = filteredAssets.slice(start, start + limitNum)

      return res.status(200).json({
        assets: paginatedAssets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredAssets.length,
          pages: Math.ceil(filteredAssets.length / limitNum)
        },
        mockMode: true
      })
    }

    // Build query for MongoDB
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
