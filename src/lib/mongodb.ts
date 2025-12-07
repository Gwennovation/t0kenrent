import mongoose from 'mongoose'

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface CachedConnection {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
  mockMode: boolean
}

declare global {
  var mongoose: CachedConnection | undefined
}

let cached: CachedConnection = global.mongoose || { conn: null, promise: null, mockMode: false }

if (!global.mongoose) {
  global.mongoose = cached
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI
  const MOCK_PAYMENTS = process.env.MOCK_PAYMENTS === 'true'
  
  // Check if we should use mock mode
  if (MOCK_PAYMENTS) {
    console.log('📦 Running in MOCK MODE - MOCK_PAYMENTS is enabled')
    cached.mockMode = true
    return null
  }
  
  if (!MONGODB_URI) {
    console.log('⚠️  WARNING: No MONGODB_URI configured!')
    console.log('⚠️  DATA WILL NOT PERSIST - using temporary in-memory storage')
    console.log('⚠️  Add MONGODB_URI environment variable to enable persistence')
    cached.mockMode = true
    return null
  }

  // Already connected
  if (cached.conn) {
    return cached.conn
  }

  // Connection in progress
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }

    console.log('🔌 Connecting to MongoDB...')
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully to:', MONGODB_URI.split('@')[1]?.split('/')[0] || 'database')
      cached.mockMode = false
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e: any) {
    cached.promise = null
    console.error('❌ MongoDB connection error:', e.message || e)
    
    // Fall back to mock mode instead of crashing (both dev and production)
    console.log('⚠️  WARNING: MongoDB connection failed!')
    console.log('⚠️  Error:', e.message || e)
    console.log('⚠️  DATA WILL NOT PERSIST - using temporary in-memory storage')
    console.log('⚠️  Fix: Update MONGODB_URI in Vercel environment variables')
    console.log('⚠️  Current issue: Authentication failed - password may be incorrect')
    cached.mockMode = true
    return null
  }

  return cached.conn
}

export function isMockMode(): boolean {
  return cached.mockMode
}

export default connectDB
