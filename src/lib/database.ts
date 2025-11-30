/**
 * T0kenRent Database Layer
 * 
 * Unified database interface supporting both in-memory storage (demo/development)
 * and MongoDB (production). Implements the schema from the whitepaper.
 * 
 * Tables/Collections:
 * - users: User accounts with wallet info
 * - assets: Rental listings with ordinal IDs and metadata
 * - rentals: Rental agreements (pending/active/completed)
 * - payments: Payment history and HTTP 402 records
 * - escrows: Smart contract escrow records
 */

// No external UUID dependency - using custom generateId function

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface User {
  id: string
  handle: string // HandCash handle or paymail
  publicKey: string
  displayName: string
  email?: string
  avatarUrl?: string
  walletType: 'handcash' | 'relysia' | 'paymail' | 'demo'
  
  // Stats
  totalListings: number
  totalRentals: number
  totalEarnings: number
  totalSpent: number
  rating: number
  reviewCount: number
  
  // Timestamps
  createdAt: string
  lastLoginAt: string
}

export interface Asset {
  id: string
  tokenId: string
  ordinalId?: string // 1Sat Ordinal ID if linked
  
  // Basic Info
  name: string
  description: string
  category: 'photography' | 'tools' | 'electronics' | 'sports' | 'vehicles' | 'other'
  condition: 'excellent' | 'good' | 'fair'
  imageUrl?: string
  images?: string[]
  
  // Pricing
  dailyRate: number
  depositAmount: number
  unlockFee: number // HTTP 402 unlock fee in BSV
  currency: string
  
  // Location
  location: {
    city: string
    state: string
    country: string
  }
  
  // Owner
  ownerId: string
  ownerHandle: string
  ownerKey: string
  
  // Rental Details (unlocked via HTTP 402)
  rentalDetails: {
    pickupAddress: string
    accessCode?: string
    contactPhone?: string
    contactEmail?: string
    instructions?: string
  }
  
  // Status
  status: 'available' | 'rented' | 'pending' | 'inactive'
  
  // Stats
  totalRentals: number
  totalEarnings: number
  averageRating?: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface Rental {
  id: string
  
  // References
  assetId: string
  assetName: string
  renterId: string
  renterHandle: string
  renterKey: string
  ownerId: string
  ownerHandle: string
  ownerKey: string
  
  // Terms
  startDate: string
  endDate: string
  daysCount: number
  dailyRate: number
  rentalFee: number
  depositAmount: number
  totalAmount: number
  
  // Status
  status: 'pending' | 'funded' | 'active' | 'completed' | 'cancelled' | 'disputed'
  
  // Escrow
  escrowId?: string
  escrowAddress?: string
  escrowFunded: boolean
  escrowReleased: boolean
  
  // Transaction IDs (on-chain logging)
  paymentTxId?: string
  escrowTxId?: string
  releaseTxId?: string
  
  // Rental details (after unlock)
  pickupLocation?: string
  accessCode?: string
  
  // Timestamps
  createdAt: string
  fundedAt?: string
  startedAt?: string
  completedAt?: string
  cancelledAt?: string
}

export interface Payment {
  id: string
  
  // Type
  type: 'unlock' | 'rental' | 'deposit' | 'refund' | 'escrow_fund' | 'escrow_release'
  
  // References
  userId: string
  assetId?: string
  rentalId?: string
  escrowId?: string
  
  // Amount
  amount: number
  currency: string
  amountBSV?: number
  
  // Transaction
  txId?: string
  fromAddress?: string
  toAddress?: string
  
  // HTTP 402 specific
  paymentReference?: string
  verified: boolean
  
  // Status
  status: 'pending' | 'completed' | 'failed' | 'expired'
  
  // Timestamps
  createdAt: string
  verifiedAt?: string
  expiresAt?: string
}

export interface Escrow {
  id: string
  
  // References
  rentalId: string
  assetId: string
  assetName: string
  
  // Parties
  ownerId: string
  ownerKey: string
  ownerHandle: string
  renterId: string
  renterKey: string
  renterHandle: string
  
  // Amounts
  depositAmount: number
  rentalFee: number
  totalAmount: number
  currency: string
  
  // Smart Contract
  escrowAddress: string
  multisigScript: string
  redeemScript?: string
  
  // Signatures (2-of-2)
  ownerSigned: boolean
  ownerSignature?: string
  ownerSignedAt?: string
  renterSigned: boolean
  renterSignature?: string
  renterSignedAt?: string
  
  // Release breakdown
  releaseToOwner?: number
  releaseToRenter?: number
  
  // Transaction IDs
  fundingTxId?: string
  releaseTxId?: string
  
  // Status
  status: 'created' | 'funded' | 'active' | 'releasing' | 'released' | 'disputed' | 'expired'
  
  // Config
  timeoutBlocks: number
  
  // Timestamps
  createdAt: string
  fundedAt?: string
  releasedAt?: string
  expiresAt?: string
}

export interface HTTP402Request {
  id: string
  resourceId: string
  resourceType: 'rental_details' | 'asset_info'
  
  // Payment details
  amount: number
  paymentAddress: string
  paymentReference: string
  
  // Requester
  requesterId?: string
  requesterKey?: string
  
  // Status
  status: 'pending' | 'paid' | 'verified' | 'expired'
  
  // Transaction
  txId?: string
  
  // Access token (issued after verification)
  accessToken?: string
  accessTokenExpiry?: string
  
  // Timestamps
  createdAt: string
  paidAt?: string
  verifiedAt?: string
  expiresAt: string
}

// ============================================================================
// IN-MEMORY DATABASE
// ============================================================================

class InMemoryDatabase {
  private users: Map<string, User> = new Map()
  private assets: Map<string, Asset> = new Map()
  private rentals: Map<string, Rental> = new Map()
  private payments: Map<string, Payment> = new Map()
  private escrows: Map<string, Escrow> = new Map()
  private http402Requests: Map<string, HTTP402Request> = new Map()
  
  constructor() {
    this.seedDemoData()
  }
  
  // -------------------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------------------
  
  async createUser(data: Omit<User, 'id' | 'createdAt' | 'lastLoginAt' | 'totalListings' | 'totalRentals' | 'totalEarnings' | 'totalSpent' | 'rating' | 'reviewCount'>): Promise<User> {
    const user: User = {
      ...data,
      id: generateId('user'),
      totalListings: 0,
      totalRentals: 0,
      totalEarnings: 0,
      totalSpent: 0,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    }
    this.users.set(user.id, user)
    return user
  }
  
  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }
  
  async getUserByHandle(handle: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.handle === handle) || null
  }
  
  async getUserByPublicKey(publicKey: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.publicKey === publicKey) || null
  }
  
  async getOrCreateUser(publicKey: string, handle: string, walletType: User['walletType']): Promise<User> {
    let user = await this.getUserByPublicKey(publicKey)
    if (!user) {
      user = await this.createUser({
        handle,
        publicKey,
        displayName: handle,
        walletType
      })
    } else {
      user.lastLoginAt = new Date().toISOString()
      this.users.set(user.id, user)
    }
    return user
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id)
    if (!user) return null
    const updated = { ...user, ...updates }
    this.users.set(id, updated)
    return updated
  }
  
  // -------------------------------------------------------------------------
  // ASSETS
  // -------------------------------------------------------------------------
  
  async createAsset(data: Omit<Asset, 'id' | 'tokenId' | 'createdAt' | 'updatedAt' | 'totalRentals' | 'totalEarnings'>): Promise<Asset> {
    const asset: Asset = {
      ...data,
      id: generateId('asset'),
      tokenId: generateId('token'),
      totalRentals: 0,
      totalEarnings: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.assets.set(asset.id, asset)
    
    // Update owner stats
    const owner = await this.getUserById(data.ownerId)
    if (owner) {
      owner.totalListings++
      this.users.set(owner.id, owner)
    }
    
    return asset
  }
  
  async getAssetById(id: string): Promise<Asset | null> {
    return this.assets.get(id) || null
  }
  
  async getAssetByTokenId(tokenId: string): Promise<Asset | null> {
    return Array.from(this.assets.values()).find(a => a.tokenId === tokenId) || null
  }
  
  async getAssetByOrdinalId(ordinalId: string): Promise<Asset | null> {
    return Array.from(this.assets.values()).find(a => a.ordinalId === ordinalId) || null
  }
  
  async listAssets(filters?: {
    status?: Asset['status']
    category?: Asset['category']
    ownerId?: string
    maxPrice?: number
    city?: string
  }): Promise<Asset[]> {
    let assets = Array.from(this.assets.values())
    
    if (filters?.status) {
      assets = assets.filter(a => a.status === filters.status)
    }
    if (filters?.category) {
      assets = assets.filter(a => a.category === filters.category)
    }
    if (filters?.ownerId) {
      assets = assets.filter(a => a.ownerId === filters.ownerId)
    }
    if (filters?.maxPrice) {
      assets = assets.filter(a => a.dailyRate <= filters.maxPrice!)
    }
    if (filters?.city) {
      assets = assets.filter(a => a.location.city.toLowerCase().includes(filters.city!.toLowerCase()))
    }
    
    return assets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  
  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | null> {
    const asset = this.assets.get(id)
    if (!asset) return null
    const updated = { ...asset, ...updates, updatedAt: new Date().toISOString() }
    this.assets.set(id, updated)
    return updated
  }
  
  async deleteAsset(id: string): Promise<boolean> {
    return this.assets.delete(id)
  }
  
  // -------------------------------------------------------------------------
  // RENTALS
  // -------------------------------------------------------------------------
  
  async createRental(data: Omit<Rental, 'id' | 'createdAt' | 'escrowFunded' | 'escrowReleased'>): Promise<Rental> {
    const rental: Rental = {
      ...data,
      id: generateId('rental'),
      escrowFunded: false,
      escrowReleased: false,
      createdAt: new Date().toISOString()
    }
    this.rentals.set(rental.id, rental)
    
    // Update asset status
    const asset = await this.getAssetById(data.assetId)
    if (asset) {
      asset.status = 'pending'
      asset.totalRentals++
      this.assets.set(asset.id, asset)
    }
    
    // Update renter stats
    const renter = await this.getUserById(data.renterId)
    if (renter) {
      renter.totalRentals++
      renter.totalSpent += data.totalAmount
      this.users.set(renter.id, renter)
    }
    
    return rental
  }
  
  async getRentalById(id: string): Promise<Rental | null> {
    return this.rentals.get(id) || null
  }
  
  async listRentals(filters?: {
    renterId?: string
    ownerId?: string
    assetId?: string
    status?: Rental['status']
  }): Promise<Rental[]> {
    let rentals = Array.from(this.rentals.values())
    
    if (filters?.renterId) {
      rentals = rentals.filter(r => r.renterId === filters.renterId)
    }
    if (filters?.ownerId) {
      rentals = rentals.filter(r => r.ownerId === filters.ownerId)
    }
    if (filters?.assetId) {
      rentals = rentals.filter(r => r.assetId === filters.assetId)
    }
    if (filters?.status) {
      rentals = rentals.filter(r => r.status === filters.status)
    }
    
    return rentals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  
  async updateRental(id: string, updates: Partial<Rental>): Promise<Rental | null> {
    const rental = this.rentals.get(id)
    if (!rental) return null
    const updated = { ...rental, ...updates }
    this.rentals.set(id, updated)
    return updated
  }
  
  async completeRental(id: string): Promise<Rental | null> {
    const rental = this.rentals.get(id)
    if (!rental) return null
    
    rental.status = 'completed'
    rental.completedAt = new Date().toISOString()
    this.rentals.set(id, rental)
    
    // Update asset
    const asset = await this.getAssetById(rental.assetId)
    if (asset) {
      asset.status = 'available'
      asset.totalEarnings += rental.rentalFee
      this.assets.set(asset.id, asset)
    }
    
    // Update owner earnings
    const owner = await this.getUserById(rental.ownerId)
    if (owner) {
      owner.totalEarnings += rental.rentalFee
      this.users.set(owner.id, owner)
    }
    
    return rental
  }
  
  // -------------------------------------------------------------------------
  // PAYMENTS
  // -------------------------------------------------------------------------
  
  async createPayment(data: Omit<Payment, 'id' | 'createdAt' | 'verified'>): Promise<Payment> {
    const payment: Payment = {
      ...data,
      id: generateId('payment'),
      verified: false,
      createdAt: new Date().toISOString()
    }
    this.payments.set(payment.id, payment)
    return payment
  }
  
  async getPaymentById(id: string): Promise<Payment | null> {
    return this.payments.get(id) || null
  }
  
  async getPaymentByReference(reference: string): Promise<Payment | null> {
    return Array.from(this.payments.values()).find(p => p.paymentReference === reference) || null
  }
  
  async listPayments(userId: string): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  
  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | null> {
    const payment = this.payments.get(id)
    if (!payment) return null
    const updated = { ...payment, ...updates }
    this.payments.set(id, updated)
    return updated
  }
  
  // -------------------------------------------------------------------------
  // ESCROWS
  // -------------------------------------------------------------------------
  
  async createEscrow(data: Omit<Escrow, 'id' | 'createdAt' | 'ownerSigned' | 'renterSigned'>): Promise<Escrow> {
    const escrow: Escrow = {
      ...data,
      id: generateId('escrow'),
      ownerSigned: false,
      renterSigned: false,
      createdAt: new Date().toISOString()
    }
    this.escrows.set(escrow.id, escrow)
    return escrow
  }
  
  async getEscrowById(id: string): Promise<Escrow | null> {
    return this.escrows.get(id) || null
  }
  
  async getEscrowByRentalId(rentalId: string): Promise<Escrow | null> {
    return Array.from(this.escrows.values()).find(e => e.rentalId === rentalId) || null
  }
  
  async updateEscrow(id: string, updates: Partial<Escrow>): Promise<Escrow | null> {
    const escrow = this.escrows.get(id)
    if (!escrow) return null
    const updated = { ...escrow, ...updates }
    this.escrows.set(id, updated)
    return updated
  }
  
  async signEscrow(id: string, signerKey: string, signature: string): Promise<Escrow | null> {
    const escrow = this.escrows.get(id)
    if (!escrow) return null
    
    const isOwner = signerKey === escrow.ownerKey
    const isRenter = signerKey === escrow.renterKey
    
    if (!isOwner && !isRenter) return null
    
    if (isOwner && !escrow.ownerSigned) {
      escrow.ownerSigned = true
      escrow.ownerSignature = signature
      escrow.ownerSignedAt = new Date().toISOString()
    } else if (isRenter && !escrow.renterSigned) {
      escrow.renterSigned = true
      escrow.renterSignature = signature
      escrow.renterSignedAt = new Date().toISOString()
    }
    
    // Check if both signed
    if (escrow.ownerSigned && escrow.renterSigned) {
      escrow.status = 'releasing'
    }
    
    this.escrows.set(id, escrow)
    return escrow
  }
  
  // -------------------------------------------------------------------------
  // HTTP 402
  // -------------------------------------------------------------------------
  
  async createHTTP402Request(data: Omit<HTTP402Request, 'id' | 'createdAt' | 'status'>): Promise<HTTP402Request> {
    const request: HTTP402Request = {
      ...data,
      id: generateId('402req'),
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    this.http402Requests.set(request.id, request)
    return request
  }
  
  async getHTTP402ByReference(reference: string): Promise<HTTP402Request | null> {
    return Array.from(this.http402Requests.values()).find(r => r.paymentReference === reference) || null
  }
  
  async updateHTTP402Request(id: string, updates: Partial<HTTP402Request>): Promise<HTTP402Request | null> {
    const request = this.http402Requests.get(id)
    if (!request) return null
    const updated = { ...request, ...updates }
    this.http402Requests.set(id, updated)
    return updated
  }
  
  // -------------------------------------------------------------------------
  // STATS
  // -------------------------------------------------------------------------
  
  async getStats() {
    const assets = Array.from(this.assets.values())
    const rentals = Array.from(this.rentals.values())
    const payments = Array.from(this.payments.values())
    
    return {
      totalAssets: assets.length,
      availableAssets: assets.filter(a => a.status === 'available').length,
      totalRentals: rentals.length,
      activeRentals: rentals.filter(r => r.status === 'active' || r.status === 'funded').length,
      completedRentals: rentals.filter(r => r.status === 'completed').length,
      totalUsers: this.users.size,
      totalPayments: payments.length,
      totalVolume: rentals.reduce((sum, r) => sum + r.totalAmount, 0)
    }
  }
  
  // -------------------------------------------------------------------------
  // SEED DATA
  // -------------------------------------------------------------------------
  
  private seedDemoData() {
    // Create demo owner
    const demoOwner: User = {
      id: 'user_demo_owner',
      handle: 'demo_owner',
      publicKey: 'demo_owner_pubkey_123',
      displayName: 'Demo Owner',
      walletType: 'demo',
      totalListings: 5,
      totalRentals: 0,
      totalEarnings: 4465,
      totalSpent: 0,
      rating: 4.8,
      reviewCount: 23,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastLoginAt: new Date().toISOString()
    }
    this.users.set(demoOwner.id, demoOwner)
    
    // Create demo assets
    const demoAssets: Omit<Asset, 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'asset_001',
        tokenId: 'token_camera_001',
        ordinalId: '1sat_ord_camera_abc123',
        name: 'Canon EOS R5 Camera Kit',
        description: 'Professional mirrorless camera with RF 24-70mm lens. Perfect for photography and video projects. Includes extra batteries and memory cards.',
        category: 'photography',
        condition: 'excellent',
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
        dailyRate: 75,
        depositAmount: 500,
        unlockFee: 0.0001,
        currency: 'USD',
        location: { city: 'San Francisco', state: 'CA', country: 'USA' },
        ownerId: demoOwner.id,
        ownerHandle: demoOwner.handle,
        ownerKey: demoOwner.publicKey,
        rentalDetails: {
          pickupAddress: '123 Market Street, Suite 400, San Francisco, CA 94102',
          accessCode: 'CAM-2024',
          contactPhone: '(415) 555-0123',
          contactEmail: 'demo@t0kenrent.com',
          instructions: 'Please return with battery fully charged. Handle with care.'
        },
        status: 'available',
        totalRentals: 12,
        totalEarnings: 1450,
        averageRating: 4.8
      },
      {
        id: 'asset_002',
        tokenId: 'token_bike_001',
        name: 'Trek Mountain Bike - Fuel EX 8',
        description: 'High-performance full suspension mountain bike. Great for trails and off-road adventures. Recently serviced.',
        category: 'sports',
        condition: 'excellent',
        imageUrl: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800',
        dailyRate: 45,
        depositAmount: 300,
        unlockFee: 0.0001,
        currency: 'USD',
        location: { city: 'Denver', state: 'CO', country: 'USA' },
        ownerId: demoOwner.id,
        ownerHandle: demoOwner.handle,
        ownerKey: demoOwner.publicKey,
        rentalDetails: {
          pickupAddress: '456 Mountain View Road, Denver, CO 80202',
          accessCode: 'BIKE-MTN',
          contactPhone: '(720) 555-0456',
          instructions: 'Helmet included. Please wipe down after use.'
        },
        status: 'available',
        totalRentals: 8,
        totalEarnings: 720,
        averageRating: 4.9
      },
      {
        id: 'asset_003',
        tokenId: 'token_drill_001',
        name: 'Milwaukee M18 FUEL Power Tool Set',
        description: 'Complete cordless tool kit including drill, impact driver, circular saw, and reciprocating saw. All M18 FUEL series.',
        category: 'tools',
        condition: 'good',
        imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800',
        dailyRate: 35,
        depositAmount: 250,
        unlockFee: 0.0001,
        currency: 'USD',
        location: { city: 'Austin', state: 'TX', country: 'USA' },
        ownerId: demoOwner.id,
        ownerHandle: demoOwner.handle,
        ownerKey: demoOwner.publicKey,
        rentalDetails: {
          pickupAddress: '789 Workshop Lane, Austin, TX 78701',
          accessCode: 'TOOLS-123',
          contactPhone: '(512) 555-0789',
          instructions: 'Return tools clean. Report any damage immediately.'
        },
        status: 'available',
        totalRentals: 15,
        totalEarnings: 875,
        averageRating: 4.7
      },
      {
        id: 'asset_004',
        tokenId: 'token_projector_001',
        name: 'Epson Home Cinema 5050UB Projector',
        description: '4K PRO-UHD projector with HDR support. Perfect for movie nights, presentations, and gaming.',
        category: 'electronics',
        condition: 'excellent',
        imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800',
        dailyRate: 55,
        depositAmount: 400,
        unlockFee: 0.0001,
        currency: 'USD',
        location: { city: 'Los Angeles', state: 'CA', country: 'USA' },
        ownerId: demoOwner.id,
        ownerHandle: demoOwner.handle,
        ownerKey: demoOwner.publicKey,
        rentalDetails: {
          pickupAddress: '321 Hollywood Blvd, Apt 12, Los Angeles, CA 90028',
          accessCode: 'PROJ-4K',
          contactPhone: '(213) 555-0321',
          instructions: 'Handle projector lens carefully. Includes 100" screen.'
        },
        status: 'available',
        totalRentals: 6,
        totalEarnings: 660,
        averageRating: 4.6
      },
      {
        id: 'asset_005',
        tokenId: 'token_drone_001',
        ordinalId: '1sat_ord_drone_xyz789',
        name: 'DJI Mavic 3 Pro Drone',
        description: 'Professional drone with Hasselblad camera. 4/3 CMOS sensor, 46-min flight time. FAA registered.',
        category: 'electronics',
        condition: 'excellent',
        imageUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800',
        dailyRate: 95,
        depositAmount: 800,
        unlockFee: 0.0001,
        currency: 'USD',
        location: { city: 'Seattle', state: 'WA', country: 'USA' },
        ownerId: demoOwner.id,
        ownerHandle: demoOwner.handle,
        ownerKey: demoOwner.publicKey,
        rentalDetails: {
          pickupAddress: '555 Aviation Way, Seattle, WA 98101',
          accessCode: 'DRONE-PRO',
          contactPhone: '(206) 555-0555',
          instructions: 'Part 107 certification required. 3 batteries included.'
        },
        status: 'available',
        totalRentals: 4,
        totalEarnings: 760,
        averageRating: 4.9
      }
    ]
    
    for (const asset of demoAssets) {
      const fullAsset: Asset = {
        ...asset,
        createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
      this.assets.set(fullAsset.id, fullAsset)
    }
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${timestamp}_${random}`
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const db = new InMemoryDatabase()

export default db
