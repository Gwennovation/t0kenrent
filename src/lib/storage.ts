/**
 * In-memory storage for demo mode and local development
 * This allows the app to work without MongoDB
 */

export interface StoredAsset {
  id: string
  tokenId: string
  name: string
  description: string
  category: string
  imageUrl?: string
  rentalRatePerDay: number
  depositAmount: number
  currency: string
  location: {
    city: string
    state: string
  }
  rentalDetails?: {
    pickupLocation: {
      address: string
      city?: string
      state?: string
    }
    accessCode?: string
    ownerContact?: {
      name?: string
      phone?: string
      email?: string
    }
    specialInstructions?: string
  }
  status: 'available' | 'rented' | 'pending'
  rating?: number
  unlockFee: number
  ownerKey: string
  condition: string
  accessories: string[]
  createdAt: string
  totalRentals: number
  totalEarnings: number
}

export interface StoredRental {
  id: string
  assetId: string
  assetName: string
  renterKey: string
  ownerKey: string
  startDate: string
  endDate: string
  rentalDays: number
  rentalFee: number
  depositAmount: number
  totalAmount: number
  status: 'active' | 'completed' | 'cancelled' | 'pending'
  escrowId: string
  createdAt: string
  completedAt?: string
  pickupLocation?: string
  accessCode?: string
  // On-chain transaction logging
  paymentTxId?: string
  escrowTxId?: string
  releaseTxId?: string
  unlockTxId?: string
}

export interface StoredUser {
  id: string
  publicKey: string
  displayName: string
  email?: string
  phone?: string
  avatar?: string
  bio?: string
  location?: {
    city: string
    state: string
  }
  joinedAt: string
  totalListings: number
  totalRentals: number
  totalEarnings: number
  totalSpent: number
  rating: number
  reviewCount: number
}

// Default sample assets
const DEFAULT_ASSETS: StoredAsset[] = [
  {
    id: 'asset_001',
    tokenId: 'token_camera_001',
    name: 'Canon EOS R5 Camera Kit',
    description: 'Professional mirrorless camera with RF 24-70mm lens. Perfect for photography and video projects. Includes extra batteries and memory cards.',
    category: 'photography',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
    rentalRatePerDay: 75,
    depositAmount: 500,
    currency: 'USD',
    location: { city: 'San Francisco', state: 'CA' },
    rentalDetails: {
      pickupLocation: { address: '123 Market Street, Suite 400', city: 'San Francisco', state: 'CA' },
      accessCode: 'CAM-2024',
      ownerContact: { name: 'Alex Chen', phone: '(415) 555-0123', email: 'alex@example.com' },
      specialInstructions: 'Please return with battery fully charged. Handle with care.'
    },
    status: 'available',
    rating: 4.8,
    unlockFee: 0.0001,
    ownerKey: 'demo_owner_001',
    condition: 'excellent',
    accessories: ['24-70mm Lens', 'Battery Grip', 'Extra Battery', '128GB SD Card'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalRentals: 12,
    totalEarnings: 1450
  },
  {
    id: 'asset_002',
    tokenId: 'token_bike_001',
    name: 'Trek Mountain Bike - Fuel EX 8',
    description: 'High-performance full suspension mountain bike. Great for trails and off-road adventures. Recently serviced.',
    category: 'sports',
    imageUrl: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800',
    rentalRatePerDay: 45,
    depositAmount: 300,
    currency: 'USD',
    location: { city: 'Denver', state: 'CO' },
    rentalDetails: {
      pickupLocation: { address: '456 Mountain View Road', city: 'Denver', state: 'CO' },
      accessCode: 'BIKE-MTN',
      ownerContact: { name: 'Sarah Johnson', phone: '(720) 555-0456', email: 'sarah@example.com' },
      specialInstructions: 'Helmet included. Please wipe down after use.'
    },
    status: 'available',
    rating: 4.9,
    unlockFee: 0.0001,
    ownerKey: 'demo_owner_002',
    condition: 'excellent',
    accessories: ['Helmet', 'Repair Kit', 'Water Bottle'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    totalRentals: 8,
    totalEarnings: 720
  },
  {
    id: 'asset_003',
    tokenId: 'token_drill_001',
    name: 'Milwaukee M18 FUEL Power Tool Set',
    description: 'Complete cordless tool kit including drill, impact driver, circular saw, and reciprocating saw. All M18 FUEL series.',
    category: 'tools',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800',
    rentalRatePerDay: 35,
    depositAmount: 250,
    currency: 'USD',
    location: { city: 'Austin', state: 'TX' },
    rentalDetails: {
      pickupLocation: { address: '789 Workshop Lane', city: 'Austin', state: 'TX' },
      accessCode: 'TOOLS-123',
      ownerContact: { name: 'Mike Rodriguez', phone: '(512) 555-0789', email: 'mike@example.com' },
      specialInstructions: 'Return tools clean. Report any damage immediately.'
    },
    status: 'available',
    rating: 4.7,
    unlockFee: 0.0001,
    ownerKey: 'demo_owner_003',
    condition: 'good',
    accessories: ['4 Batteries', 'Charger', '50pc Bit Set', 'Tool Bag'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    totalRentals: 15,
    totalEarnings: 875
  },
  {
    id: 'asset_004',
    tokenId: 'token_projector_001',
    name: 'Epson Home Cinema 5050UB Projector',
    description: '4K PRO-UHD projector with HDR support. Perfect for movie nights, presentations, and gaming.',
    category: 'electronics',
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800',
    rentalRatePerDay: 55,
    depositAmount: 400,
    currency: 'USD',
    location: { city: 'Los Angeles', state: 'CA' },
    rentalDetails: {
      pickupLocation: { address: '321 Hollywood Blvd, Apt 12', city: 'Los Angeles', state: 'CA' },
      accessCode: 'PROJ-4K',
      ownerContact: { name: 'Jamie Lee', phone: '(213) 555-0321', email: 'jamie@example.com' },
      specialInstructions: 'Handle projector lens carefully. Includes 100" screen.'
    },
    status: 'available',
    rating: 4.6,
    unlockFee: 0.0001,
    ownerKey: 'demo_owner_004',
    condition: 'excellent',
    accessories: ['100" Screen', 'HDMI Cable', 'Ceiling Mount', 'Remote'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    totalRentals: 6,
    totalEarnings: 660
  },
  {
    id: 'asset_005',
    tokenId: 'token_drone_001',
    name: 'DJI Mavic 3 Pro Drone',
    description: 'Professional drone with Hasselblad camera. 4/3 CMOS sensor, 46-min flight time. FAA registered.',
    category: 'electronics',
    imageUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800',
    rentalRatePerDay: 95,
    depositAmount: 800,
    currency: 'USD',
    location: { city: 'Seattle', state: 'WA' },
    rentalDetails: {
      pickupLocation: { address: '555 Aviation Way', city: 'Seattle', state: 'WA' },
      accessCode: 'DRONE-PRO',
      ownerContact: { name: 'Chris Park', phone: '(206) 555-0555', email: 'chris@example.com' },
      specialInstructions: 'Part 107 certification required. 3 batteries included.'
    },
    status: 'available',
    rating: 4.9,
    unlockFee: 0.0001,
    ownerKey: 'demo_owner_005',
    condition: 'excellent',
    accessories: ['3 Batteries', 'ND Filters', 'Carrying Case', 'Extra Props'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    totalRentals: 4,
    totalEarnings: 760
  }
]

// In-memory storage (simulates database)
class InMemoryStorage {
  private assets: Map<string, StoredAsset> = new Map()
  private rentals: Map<string, StoredRental> = new Map()
  private users: Map<string, StoredUser> = new Map()
  private unlockedAssets: Map<string, Set<string>> = new Map() // userKey -> Set of assetIds

  constructor() {
    // Initialize with default assets
    DEFAULT_ASSETS.forEach(asset => {
      this.assets.set(asset.id, asset)
    })
  }

  // Asset methods
  getAllAssets(filters?: { category?: string; status?: string; maxPrice?: number }): StoredAsset[] {
    let assets = Array.from(this.assets.values())
    
    if (filters?.status) {
      assets = assets.filter(a => a.status === filters.status)
    }
    if (filters?.category && filters.category !== 'all') {
      assets = assets.filter(a => a.category === filters.category)
    }
    if (filters?.maxPrice) {
      assets = assets.filter(a => a.rentalRatePerDay <= filters.maxPrice!)
    }
    
    return assets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  getAssetById(id: string): StoredAsset | undefined {
    return this.assets.get(id)
  }

  getAssetByTokenId(tokenId: string): StoredAsset | undefined {
    return Array.from(this.assets.values()).find(a => a.tokenId === tokenId)
  }

  getAssetsByOwner(ownerKey: string): StoredAsset[] {
    return Array.from(this.assets.values())
      .filter(a => a.ownerKey === ownerKey)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  createAsset(data: Omit<StoredAsset, 'id' | 'tokenId' | 'createdAt' | 'totalRentals' | 'totalEarnings'>): StoredAsset {
    const id = `asset_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const tokenId = `token_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    const asset: StoredAsset = {
      ...data,
      id,
      tokenId,
      createdAt: new Date().toISOString(),
      totalRentals: 0,
      totalEarnings: 0
    }
    
    this.assets.set(id, asset)
    
    // Update user stats
    const user = this.getUserByKey(data.ownerKey)
    if (user) {
      user.totalListings++
      this.users.set(user.publicKey, user)
    }
    
    return asset
  }

  updateAsset(id: string, updates: Partial<StoredAsset>): StoredAsset | undefined {
    const asset = this.assets.get(id)
    if (!asset) return undefined
    
    const updated = { ...asset, ...updates }
    this.assets.set(id, updated)
    return updated
  }

  deleteAsset(id: string): boolean {
    return this.assets.delete(id)
  }

  // Unlock tracking
  unlockAsset(userKey: string, assetId: string): void {
    if (!this.unlockedAssets.has(userKey)) {
      this.unlockedAssets.set(userKey, new Set())
    }
    this.unlockedAssets.get(userKey)!.add(assetId)
  }

  isAssetUnlocked(userKey: string, assetId: string): boolean {
    return this.unlockedAssets.get(userKey)?.has(assetId) || false
  }

  getUnlockedAssets(userKey: string): string[] {
    return Array.from(this.unlockedAssets.get(userKey) || [])
  }

  // Rental methods
  getAllRentals(): StoredRental[] {
    return Array.from(this.rentals.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  getRentalById(id: string): StoredRental | undefined {
    return this.rentals.get(id)
  }

  getRentalsByRenter(renterKey: string): StoredRental[] {
    return Array.from(this.rentals.values())
      .filter(r => r.renterKey === renterKey)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  getRentalsByOwner(ownerKey: string): StoredRental[] {
    return Array.from(this.rentals.values())
      .filter(r => r.ownerKey === ownerKey)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  createRental(data: Omit<StoredRental, 'id' | 'escrowId' | 'createdAt'> & Partial<Pick<StoredRental, 'paymentTxId' | 'escrowTxId'>>): StoredRental {
    const id = `rental_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    const rental: StoredRental = {
      ...data,
      id,
      escrowId,
      createdAt: new Date().toISOString()
    }
    
    this.rentals.set(id, rental)
    
    // Update asset status
    const asset = Array.from(this.assets.values()).find(a => a.id === data.assetId)
    if (asset) {
      asset.status = 'rented'
      asset.totalRentals++
      this.assets.set(asset.id, asset)
    }
    
    // Update user stats
    const renter = this.getUserByKey(data.renterKey)
    if (renter) {
      renter.totalRentals++
      renter.totalSpent += data.totalAmount
      this.users.set(renter.publicKey, renter)
    }
    
    return rental
  }

  completeRental(id: string): StoredRental | undefined {
    const rental = this.rentals.get(id)
    if (!rental) return undefined
    
    rental.status = 'completed'
    rental.completedAt = new Date().toISOString()
    this.rentals.set(id, rental)
    
    // Update asset status and earnings
    const asset = Array.from(this.assets.values()).find(a => a.id === rental.assetId)
    if (asset) {
      asset.status = 'available'
      asset.totalEarnings += rental.rentalFee
      this.assets.set(asset.id, asset)
    }
    
    // Update owner earnings
    const owner = this.getUserByKey(rental.ownerKey)
    if (owner) {
      owner.totalEarnings += rental.rentalFee
      this.users.set(owner.publicKey, owner)
    }
    
    return rental
  }

  // User methods
  getUserByKey(publicKey: string): StoredUser | undefined {
    return this.users.get(publicKey)
  }

  createUser(publicKey: string, data?: Partial<StoredUser>): StoredUser {
    const user: StoredUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      publicKey,
      displayName: data?.displayName || `User_${publicKey.slice(0, 8)}`,
      email: data?.email,
      phone: data?.phone,
      avatar: data?.avatar,
      bio: data?.bio,
      location: data?.location,
      joinedAt: new Date().toISOString(),
      totalListings: 0,
      totalRentals: 0,
      totalEarnings: 0,
      totalSpent: 0,
      rating: 5.0,
      reviewCount: 0
    }
    
    this.users.set(publicKey, user)
    return user
  }

  updateUser(publicKey: string, updates: Partial<StoredUser>): StoredUser | undefined {
    const user = this.users.get(publicKey)
    if (!user) return undefined
    
    const updated = { ...user, ...updates }
    this.users.set(publicKey, updated)
    return updated
  }

  getOrCreateUser(publicKey: string): StoredUser {
    let user = this.users.get(publicKey)
    if (!user) {
      user = this.createUser(publicKey)
    }
    return user
  }

  // Stats
  getStats() {
    const assets = Array.from(this.assets.values())
    const rentals = Array.from(this.rentals.values())
    
    return {
      totalAssets: assets.length,
      availableAssets: assets.filter(a => a.status === 'available').length,
      totalRentals: rentals.length,
      activeRentals: rentals.filter(r => r.status === 'active').length,
      totalUsers: this.users.size,
      totalVolume: rentals.reduce((sum, r) => sum + r.totalAmount, 0)
    }
  }
}

// Singleton instance
export const storage = new InMemoryStorage()

// Simple chains storage for demo mode
export const inMemoryStorage = {
  chains: [] as any[],
  assets: [] as any[],
  rentals: [] as any[],
  users: [] as any[]
}

// Global escrow store for persistence across API calls
// Using globalThis to ensure singleton behavior in serverless environment
declare global {
  var escrowStore: Map<string, any> | undefined
  var releaseStore: Map<string, any> | undefined
}

export const globalEscrowStore = globalThis.escrowStore || new Map<string, any>()
export const globalReleaseStore = globalThis.releaseStore || new Map<string, any>()

if (process.env.NODE_ENV !== 'production') {
  globalThis.escrowStore = globalEscrowStore
  globalThis.releaseStore = globalReleaseStore
}
