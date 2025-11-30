import mongoose from 'mongoose'

const PaymentSchema = new mongoose.Schema({
  txid: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'verified', 'failed'],
    default: 'pending'
  },
  verifiedAt: Date,
  timestamp: {
    type: Date,
    default: Date.now
  }
})

const StageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  imageUrl: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Rent configuration
  requiresPayment: {
    type: Boolean,
    default: false
  },
  rentAmount: {
    type: Number,
    min: 0
  },
  ownerKey: String,
  duration: Number, // in days
  expiresAt: Date,
  
  // Payment tracking
  payment: PaymentSchema,
  
  // Blockchain data
  transactionId: String,
  lockScript: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const ActionChainSchema = new mongoose.Schema({
  chainId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  stages: [StageSchema],
  
  // Ownership
  ownerKey: {
    type: String,
    required: true,
    index: true
  },
  
  // Status
  finalized: {
    type: Boolean,
    default: false
  },
  
  // Financial tracking
  totalRentCollected: {
    type: Number,
    default: 0
  },
  pendingPayments: {
    type: Number,
    default: 0
  },
  
  // Metadata
  flow: [String], // Array of stage titles showing workflow
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Indexes for performance
ActionChainSchema.index({ ownerKey: 1, createdAt: -1 })
ActionChainSchema.index({ finalized: 1 })
ActionChainSchema.index({ 'stages.payment.txid': 1 })

// Update timestamp on save
ActionChainSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Virtual for total stages
ActionChainSchema.virtual('stageCount').get(function() {
  return this.stages.length
})

// Method to add stage
ActionChainSchema.methods.addStage = function(stageData: any) {
  this.stages.push(stageData)
  return this.save()
}

// Method to update payment status
ActionChainSchema.methods.updatePaymentStatus = function(
  stageIndex: number,
  paymentData: any
) {
  if (this.stages[stageIndex]) {
    this.stages[stageIndex].payment = paymentData
    
    if (paymentData.status === 'verified') {
      this.totalRentCollected += paymentData.amount
      this.pendingPayments = Math.max(0, this.pendingPayments - 1)
    }
    
    return this.save()
  }
  throw new Error('Stage not found')
}

// Static method to find by owner
ActionChainSchema.statics.findByOwner = function(ownerKey: string) {
  return this.find({ ownerKey }).sort({ createdAt: -1 })
}

// Static method to find chains with pending payments
ActionChainSchema.statics.findWithPendingPayments = function() {
  return this.find({
    'stages.requiresPayment': true,
    'stages.payment.status': { $in: ['pending', 'confirmed'] }
  })
}

export default mongoose.models.ActionChain || 
  mongoose.model('ActionChain', ActionChainSchema)
