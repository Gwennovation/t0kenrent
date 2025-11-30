import mongoose from 'mongoose'

const RentalDetailsSchema = new mongoose.Schema({
  pickupLocation: {
    address: { type: String, required: true },
    city: String,
    state: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  accessCode: String,
  ownerContact: {
    phone: String,
    email: String
  },
  specialInstructions: String
})

const HTTP402PaymentSchema = new mongoose.Schema({
  paymentReference: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  payerKey: String,
  transactionId: String,
  status: {
    type: String,
    enum: ['pending', 'paid', 'verified', 'expired'],
    default: 'pending'
  },
  accessToken: String,
  accessTokenExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: Date
})

const RentalAssetSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic Information
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['photography', 'tools', 'electronics', 'sports', 'vehicles', 'other']
  },
  imageUrl: String,
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair'],
    default: 'excellent'
  },
  accessories: [String],
  
  // Pricing
  rentalRatePerDay: {
    type: Number,
    required: true,
    min: 0
  },
  depositAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  unlockFee: {
    type: Number,
    required: true,
    default: 0.0001, // BSV amount for HTTP 402
    min: 0
  },
  
  // Location (public - city/state only)
  location: {
    city: { type: String, required: true },
    state: { type: String, required: true }
  },
  
  // Protected rental details (unlocked via HTTP 402)
  rentalDetails: RentalDetailsSchema,
  
  // HTTP 402 payment records
  http402Payments: [HTTP402PaymentSchema],
  
  // Ownership
  ownerKey: {
    type: String,
    required: true,
    index: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['available', 'rented', 'pending', 'inactive'],
    default: 'available'
  },
  
  // Metrics
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  totalRentals: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  
  // Blockchain data
  mintTransactionId: String,
  brc76Metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Indexes
RentalAssetSchema.index({ ownerKey: 1, createdAt: -1 })
RentalAssetSchema.index({ category: 1, status: 1 })
RentalAssetSchema.index({ 'location.city': 1, 'location.state': 1 })
RentalAssetSchema.index({ status: 1, rentalRatePerDay: 1 })

// Update timestamp on save
RentalAssetSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Method to create HTTP 402 payment record
RentalAssetSchema.methods.createHTTP402Payment = function(amount: number, payerKey?: string) {
  const paymentReference = `pay_${this.tokenId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
  
  const payment = {
    paymentReference,
    amount,
    payerKey,
    status: 'pending',
    createdAt: new Date()
  }
  
  this.http402Payments.push(payment)
  return { payment, reference: paymentReference }
}

// Method to verify and complete HTTP 402 payment
RentalAssetSchema.methods.verifyHTTP402Payment = function(
  paymentReference: string,
  transactionId: string
) {
  const payment = this.http402Payments.find(
    (p: any) => p.paymentReference === paymentReference
  )
  
  if (!payment) {
    throw new Error('Payment not found')
  }
  
  if (payment.status !== 'pending') {
    throw new Error('Payment already processed')
  }
  
  // Generate access token
  const accessToken = `access_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const accessTokenExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  
  payment.transactionId = transactionId
  payment.status = 'verified'
  payment.verifiedAt = new Date()
  payment.accessToken = accessToken
  payment.accessTokenExpiry = accessTokenExpiry
  
  return {
    accessToken,
    expiresIn: 1800, // 30 minutes in seconds
    rentalDetails: this.rentalDetails
  }
}

// Static method to find available assets
RentalAssetSchema.statics.findAvailable = function(filters: any = {}) {
  const query: any = { status: 'available' }
  
  if (filters.category) {
    query.category = filters.category
  }
  
  if (filters.maxPrice) {
    query.rentalRatePerDay = { $lte: filters.maxPrice }
  }
  
  if (filters.city) {
    query['location.city'] = new RegExp(filters.city, 'i')
  }
  
  return this.find(query)
    .select('-rentalDetails -http402Payments')
    .sort({ createdAt: -1 })
}

// Static method to find by owner
RentalAssetSchema.statics.findByOwner = function(ownerKey: string) {
  return this.find({ ownerKey })
    .select('-http402Payments')
    .sort({ createdAt: -1 })
}

export default mongoose.models.RentalAsset || 
  mongoose.model('RentalAsset', RentalAssetSchema)
