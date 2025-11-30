import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

// Check if we're in mock mode (no MongoDB required)
export const MOCK_MODE = process.env.MOCK_PAYMENTS === 'true' || !MONGODB_URI

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

let cached: CachedConnection = global.mongoose || { conn: null, promise: null, mockMode: MOCK_MODE }

if (!global.mongoose) {
  global.mongoose = cached
}

async function connectDB() {
  // If in mock mode, return null (APIs should handle this)
  if (MOCK_MODE) {
    console.log('📦 Running in MOCK MODE - no MongoDB connection')
    cached.mockMode = true
    return null
  }

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully')
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    console.error('❌ MongoDB connection error:', e)
    // In development, fall back to mock mode instead of crashing
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 Falling back to MOCK MODE')
      cached.mockMode = true
      return null
    }
    throw e
  }

  return cached.conn
}

export function isMockMode(): boolean {
  return cached.mockMode || MOCK_MODE
}

export default connectDB
