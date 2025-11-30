import mongoose from 'mongoose'

const EscrowSchema = new mongoose.Schema({
  escrowId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Asset reference
  rentalTokenId: {
    type: String,
    required: true,
    index: true
  },
  assetName: String,
  
  // Parties
  ownerKey: {
    type: String,
    required: true,
    index: true
  },
  renterKey: {
    type: String,
    required: true,
    index: true
  },
  
  // Optional arbitrator for disputes
  arbitratorKey: String,
  
  // Rental period
  rentalPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  
  // Financial details
  depositAmount: {
    type: Number,
    required: true,
    min: 0
  },
  rentalFee: {
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
  
  // Blockchain escrow details
  escrowAddress: {
    type: String,
    required: true
  },
  escrowScript: String,
  multisigScript: String,
  
  // 2-of-2 multisig public keys
  ownerPubKey: String,
  renterPubKey: String,
  
  // Timeout configuration (in blocks)
  timeoutBlocks: {
    type: Number,
    default: 144 // ~1 day at 10 min blocks
  },
  
  // Transaction tracking
  fundingTxid: String,
  fundingVout: {
    type: Number,
    default: 0
  },
  releaseTxid: String,
  
  // Escrow state machine
  status: {
    type: String,
    enum: [
      'created',        // Escrow contract created, awaiting funding
      'funded',         // Funds deposited, rental active
      'completed',      // Both parties agreed, funds released to appropriate parties
      'disputed',       // Dispute raised, awaiting resolution
      'arbitrated',     // Arbitrator resolved the dispute
      'expired',        // Timeout reached, funds released per timeout rules
      'cancelled'       // Cancelled before funding
    ],
    default: 'created'
  },
  
  // Dispute tracking
  dispute: {
    raisedBy: String,
    reason: String,
    evidence: [String],
    raisedAt: Date,
    resolvedAt: Date,
    resolution: String,
    resolvedBy: String
  },
  
  // Release breakdown
  releaseBreakdown: {
    toOwner: Number,      // Amount released to owner (rental fee + any damages)
    toRenter: Number,     // Amount released to renter (deposit return)
    toArbitrator: Number  // Optional arbitration fee
  },
  
  // Signatures tracking (for 2-of-2 release)
  signatures: {
    ownerSigned: {
      type: Boolean,
      default: false
    },
    ownerSignature: String,
    ownerSignedAt: Date,
    renterSigned: {
      type: Boolean,
      default: false
    },
    renterSignature: String,
    renterSignedAt: Date
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  fundedAt: Date,
  completedAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Indexes
EscrowSchema.index({ status: 1, 'rentalPeriod.endDate': 1 })
EscrowSchema.index({ ownerKey: 1, status: 1 })
EscrowSchema.index({ renterKey: 1, status: 1 })

// Update timestamp on save
EscrowSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Method to fund escrow
EscrowSchema.methods.fund = function(fundingTxid: string, fundingVout: number = 0) {
  if (this.status !== 'created') {
    throw new Error('Escrow can only be funded when in created state')
  }
  
  this.fundingTxid = fundingTxid
  this.fundingVout = fundingVout
  this.status = 'funded'
  this.fundedAt = new Date()
  
  return this.save()
}

// Method to add owner signature for release
EscrowSchema.methods.addOwnerSignature = function(signature: string) {
  if (this.status !== 'funded') {
    throw new Error('Escrow must be funded to sign release')
  }
  
  this.signatures.ownerSigned = true
  this.signatures.ownerSignature = signature
  this.signatures.ownerSignedAt = new Date()
  
  // Check if both signed
  if (this.signatures.renterSigned) {
    this.status = 'completed'
    this.completedAt = new Date()
  }
  
  return this.save()
}

// Method to add renter signature for release
EscrowSchema.methods.addRenterSignature = function(signature: string) {
  if (this.status !== 'funded') {
    throw new Error('Escrow must be funded to sign release')
  }
  
  this.signatures.renterSigned = true
  this.signatures.renterSignature = signature
  this.signatures.renterSignedAt = new Date()
  
  // Check if both signed
  if (this.signatures.ownerSigned) {
    this.status = 'completed'
    this.completedAt = new Date()
  }
  
  return this.save()
}

// Method to raise dispute
EscrowSchema.methods.raiseDispute = function(
  raisedBy: string,
  reason: string,
  evidence: string[] = []
) {
  if (this.status !== 'funded') {
    throw new Error('Can only raise dispute on funded escrow')
  }
  
  this.status = 'disputed'
  this.dispute = {
    raisedBy,
    reason,
    evidence,
    raisedAt: new Date()
  }
  
  return this.save()
}

// Method to resolve dispute (by arbitrator)
EscrowSchema.methods.resolveDispute = function(
  resolvedBy: string,
  resolution: string,
  breakdown: { toOwner: number; toRenter: number; toArbitrator?: number }
) {
  if (this.status !== 'disputed') {
    throw new Error('Can only resolve disputed escrows')
  }
  
  this.status = 'arbitrated'
  this.dispute.resolvedAt = new Date()
  this.dispute.resolution = resolution
  this.dispute.resolvedBy = resolvedBy
  this.releaseBreakdown = breakdown
  this.completedAt = new Date()
  
  return this.save()
}

// Method to complete with standard release (deposit back to renter, fee to owner)
EscrowSchema.methods.completeStandard = function(releaseTxid: string) {
  if (this.status !== 'funded' && this.status !== 'completed') {
    throw new Error('Invalid escrow state for completion')
  }
  
  this.status = 'completed'
  this.releaseTxid = releaseTxid
  this.releaseBreakdown = {
    toOwner: this.rentalFee,
    toRenter: this.depositAmount,
    toArbitrator: 0
  }
  this.completedAt = new Date()
  
  return this.save()
}

// Static methods
EscrowSchema.statics.findByParticipant = function(publicKey: string) {
  return this.find({
    $or: [
      { ownerKey: publicKey },
      { renterKey: publicKey }
    ]
  }).sort({ createdAt: -1 })
}

EscrowSchema.statics.findActiveByRenter = function(renterKey: string) {
  return this.find({
    renterKey,
    status: { $in: ['created', 'funded'] }
  }).sort({ createdAt: -1 })
}

EscrowSchema.statics.findActiveByOwner = function(ownerKey: string) {
  return this.find({
    ownerKey,
    status: { $in: ['created', 'funded'] }
  }).sort({ createdAt: -1 })
}

EscrowSchema.statics.findDisputed = function() {
  return this.find({ status: 'disputed' }).sort({ 'dispute.raisedAt': -1 })
}

export default mongoose.models.Escrow || 
  mongoose.model('Escrow', EscrowSchema)
