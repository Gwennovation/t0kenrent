import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  // Unique identifier from wallet
  publicKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Wallet type
  walletType: {
    type: String,
    enum: ['handcash', 'metanet', 'paymail', 'demo'],
    required: true
  },
  
  // User display info
  handle: {
    type: String,
    index: true
  },
  displayName: String,
  email: String,
  avatarUrl: String,
  paymail: String,
  
  // Profile details
  bio: String,
  location: {
    city: String,
    state: String,
    country: String
  },
  
  // Stats
  totalListings: {
    type: Number,
    default: 0
  },
  totalRentals: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  
  // Ratings
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  
  // Activity tracking
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  
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
UserSchema.index({ handle: 1 })
UserSchema.index({ walletType: 1, createdAt: -1 })

// Update timestamp on save
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Method to update stats after listing
UserSchema.methods.incrementListings = function() {
  this.totalListings++
  return this.save()
}

// Method to update stats after rental (as renter)
UserSchema.methods.recordRental = function(amount: number) {
  this.totalRentals++
  this.totalSpent += amount
  return this.save()
}

// Method to update stats after rental (as owner)
UserSchema.methods.recordEarning = function(amount: number) {
  this.totalEarnings += amount
  return this.save()
}

// Static method to find or create user
UserSchema.statics.findOrCreate = async function(
  publicKey: string,
  walletType: string,
  profileData?: {
    handle?: string
    displayName?: string
    email?: string
    avatarUrl?: string
    paymail?: string
  }
) {
  let user = await this.findOne({ publicKey })
  
  if (!user) {
    user = await this.create({
      publicKey,
      walletType,
      handle: profileData?.handle,
      displayName: profileData?.displayName || profileData?.handle,
      email: profileData?.email,
      avatarUrl: profileData?.avatarUrl,
      paymail: profileData?.paymail
    })
  } else {
    // Update last login
    user.lastLoginAt = new Date()
    if (profileData) {
      if (profileData.handle) user.handle = profileData.handle
      if (profileData.displayName) user.displayName = profileData.displayName
      if (profileData.avatarUrl) user.avatarUrl = profileData.avatarUrl
    }
    await user.save()
  }
  
  return user
}

export default mongoose.models.User || 
  mongoose.model('User', UserSchema)
