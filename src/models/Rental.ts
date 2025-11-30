import mongoose from 'mongoose'

const RentalSchema = new mongoose.Schema({
  // References
  assetId: {
    type: String,
    required: true,
    index: true
  },
  assetName: {
    type: String,
    required: true
  },
  tokenId: {
    type: String,
    index: true
  },
  
  // Parties
  renterId: {
    type: String,
    required: true,
    index: true
  },
  renterKey: {
    type: String,
    required: true,
    index: true
  },
  renterHandle: String,
  
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  ownerKey: {
    type: String,
    required: true,
    index: true
  },
  ownerHandle: String,
  
  // Rental period
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  daysCount: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Pricing
  dailyRate: {
    type: Number,
    required: true,
    min: 0
  },
  rentalFee: {
    type: Number,
    required: true,
    min: 0
  },
  depositAmount: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'funded', 'active', 'completed', 'cancelled', 'disputed'],
    default: 'pending',
    index: true
  },
  
  // Escrow
  escrowId: {
    type: String,
    index: true
  },
  escrowAddress: String,
  escrowFunded: {
    type: Boolean,
    default: false
  },
  escrowReleased: {
    type: Boolean,
    default: false
  },
  
  // Rental details (unlocked after payment)
  pickupLocation: String,
  accessCode: String,
  ownerContact: {
    name: String,
    phone: String,
    email: String
  },
  specialInstructions: String,
  
  // Transaction IDs (on-chain logging)
  paymentTxId: String,
  escrowTxId: String,
  releaseTxId: String,
  unlockTxId: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  fundedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Indexes
RentalSchema.index({ status: 1, createdAt: -1 })
RentalSchema.index({ renterKey: 1, status: 1 })
RentalSchema.index({ ownerKey: 1, status: 1 })
RentalSchema.index({ assetId: 1, status: 1 })

// Update timestamp on save
RentalSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Method to fund rental
RentalSchema.methods.fund = function(escrowTxId: string) {
  if (this.status !== 'pending') {
    throw new Error('Rental can only be funded when pending')
  }
  
  this.escrowTxId = escrowTxId
  this.escrowFunded = true
  this.status = 'funded'
  this.fundedAt = new Date()
  
  return this.save()
}

// Method to start rental
RentalSchema.methods.start = function() {
  if (this.status !== 'funded') {
    throw new Error('Rental must be funded to start')
  }
  
  this.status = 'active'
  this.startedAt = new Date()
  
  return this.save()
}

// Method to complete rental
RentalSchema.methods.complete = function(releaseTxId?: string) {
  if (this.status !== 'active' && this.status !== 'funded') {
    throw new Error('Rental must be active or funded to complete')
  }
  
  this.status = 'completed'
  this.escrowReleased = true
  this.completedAt = new Date()
  if (releaseTxId) {
    this.releaseTxId = releaseTxId
  }
  
  return this.save()
}

// Method to cancel rental
RentalSchema.methods.cancel = function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    throw new Error('Cannot cancel completed or already cancelled rental')
  }
  
  this.status = 'cancelled'
  this.cancelledAt = new Date()
  
  return this.save()
}

// Static methods
RentalSchema.statics.findByRenter = function(renterKey: string) {
  return this.find({ renterKey })
    .sort({ createdAt: -1 })
}

RentalSchema.statics.findByOwner = function(ownerKey: string) {
  return this.find({ ownerKey })
    .sort({ createdAt: -1 })
}

RentalSchema.statics.findActiveByRenter = function(renterKey: string) {
  return this.find({
    renterKey,
    status: { $in: ['pending', 'funded', 'active'] }
  }).sort({ createdAt: -1 })
}

RentalSchema.statics.findActiveByOwner = function(ownerKey: string) {
  return this.find({
    ownerKey,
    status: { $in: ['pending', 'funded', 'active'] }
  }).sort({ createdAt: -1 })
}

RentalSchema.statics.findByAsset = function(assetId: string) {
  return this.find({ assetId })
    .sort({ createdAt: -1 })
}

export default mongoose.models.Rental || 
  mongoose.model('Rental', RentalSchema)
