import mongoose, { Document, Model, Schema } from 'mongoose'

// Interface for User document
export interface IUser extends Document {
  publicKey: string
  walletType: 'handcash' | 'metanet' | 'paymail' | 'demo'
  handle?: string
  displayName?: string
  email?: string
  avatarUrl?: string
  paymail?: string
  bio?: string
  location?: {
    city?: string
    state?: string
    country?: string
  }
  totalListings: number
  totalRentals: number
  totalEarnings: number
  totalSpent: number
  rating: number
  reviewCount: number
  lastLoginAt: Date
  createdAt: Date
  updatedAt: Date
  // Instance methods
  incrementListings(): Promise<IUser>
  recordRental(amount: number): Promise<IUser>
  recordEarning(amount: number): Promise<IUser>
}

// Interface for User model with statics
interface IUserModel extends Model<IUser> {
  findOrCreate(
    publicKey: string,
    walletType: string,
    profileData?: {
      handle?: string
      displayName?: string
      email?: string
      avatarUrl?: string
      paymail?: string
    }
  ): Promise<IUser>
}

const UserSchema = new Schema<IUser>({
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
): Promise<IUser> {
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

const User = (mongoose.models.User as IUserModel) || 
  mongoose.model<IUser, IUserModel>('User', UserSchema)

export default User
