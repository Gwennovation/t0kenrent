import { useState } from 'react'
import HTTP402Modal from './HTTP402Modal'
import EscrowModal from './EscrowModal'

interface RentalAsset {
  id: string
  tokenId: string
  name: string
  description: string
  category: string
  imageUrl?: string
  rentalRatePerDay: number
  depositAmount: number
  currency: string
  ownerKey: string
  location: {
    city: string
    state: string
  }
  status: 'available' | 'rented' | 'pending'
  rating?: number
  unlockFee: number
  createdAt: Date
}

interface AssetCardProps {
  asset: RentalAsset
  userKey: string
  isOwner?: boolean
  demoMode?: boolean
  onRent: () => void
}

export default function AssetCard({ asset, userKey, isOwner = false, demoMode = false, onRent }: AssetCardProps) {
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [showEscrowModal, setShowEscrowModal] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [rentalDetails, setRentalDetails] = useState<any>(null)

  const statusColors = {
    available: 'bg-green-100 text-green-800',
    rented: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800'
  }

  const categoryIcons: Record<string, string> = {
    photography: '📷',
    tools: '🔧',
    electronics: '💻',
    sports: '🏃',
    vehicles: '🚗',
    other: '📦'
  }

  async function handleUnlockSuccess(details: any) {
    setRentalDetails(details)
    setUnlocked(true)
    setShowUnlockModal(false)
  }

  function handleRentClick() {
    if (demoMode) {
      // In demo mode, simulate unlocking without payment
      handleDemoUnlock()
    } else if (unlocked) {
      setShowEscrowModal(true)
    } else {
      setShowUnlockModal(true)
    }
  }

  function handleDemoUnlock() {
    // Simulate rental details for demo mode
    const mockDetails = {
      pickupLocation: {
        address: '123 Demo Street, San Francisco, CA 94102',
        coordinates: { lat: 37.7749, lng: -122.4194 }
      },
      accessCode: 'DEMO-1234',
      ownerContact: {
        name: 'Demo Owner',
        phone: '(555) 123-4567',
        email: 'demo@t0kenrent.com'
      },
      specialInstructions: 'This is demo mode - no real rental is being created.'
    }
    setRentalDetails(mockDetails)
    setUnlocked(true)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
        {asset.imageUrl ? (
          <img
            src={asset.imageUrl}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {categoryIcons[asset.category] || '📦'}
          </div>
        )}
        
        {/* Status Badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
          {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
        </div>

        {/* HTTP 402 Badge */}
        {!unlocked && !isOwner && (
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-purple-600 text-white rounded-full text-xs font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {asset.unlockFee} BSV to unlock
          </div>
        )}

        {/* Unlocked Badge */}
        {unlocked && (
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-green-600 text-white rounded-full text-xs font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Details Unlocked
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{asset.name}</h3>
          {asset.rating && (
            <div className="flex items-center gap-1 text-yellow-500">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
              <span className="text-sm text-gray-600">{asset.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{asset.description}</p>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {asset.location.city}, {asset.location.state}
        </div>

        {/* Pricing */}
        <div className="flex items-end justify-between border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs text-gray-500">Daily Rate</p>
            <p className="text-xl font-bold text-primary-600">
              ${asset.rentalRatePerDay}
              <span className="text-sm font-normal text-gray-500">/day</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Deposit</p>
            <p className="text-sm font-medium text-gray-700">${asset.depositAmount}</p>
          </div>
        </div>

        {/* Unlocked Details */}
        {unlocked && rentalDetails && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
            <h4 className="text-sm font-semibold text-green-800">Rental Details</h4>
            <div className="text-sm text-green-700">
              <p><strong>Pickup:</strong> {rentalDetails.pickupLocation?.address}</p>
              {rentalDetails.accessCode && (
                <p><strong>Access Code:</strong> {rentalDetails.accessCode}</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4">
          {isOwner ? (
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm">
                Edit
              </button>
              <button className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm">
                View Stats
              </button>
            </div>
          ) : asset.status === 'available' ? (
            <button
              onClick={handleRentClick}
              className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {unlocked ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Create Escrow & Rent
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Pay to Unlock Details
                </>
              )}
            </button>
          ) : (
            <button
              disabled
              className="w-full px-4 py-3 bg-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed"
            >
              Currently Unavailable
            </button>
          )}
        </div>
      </div>

      {/* HTTP 402 Modal */}
      {showUnlockModal && (
        <HTTP402Modal
          asset={asset}
          userKey={userKey}
          demoMode={demoMode}
          onClose={() => setShowUnlockModal(false)}
          onSuccess={handleUnlockSuccess}
        />
      )}

      {/* Escrow Modal */}
      {showEscrowModal && rentalDetails && (
        <EscrowModal
          asset={asset}
          userKey={userKey}
          rentalDetails={rentalDetails}
          demoMode={demoMode}
          onClose={() => setShowEscrowModal(false)}
          onSuccess={() => {
            setShowEscrowModal(false)
            onRent()
          }}
        />
      )}
    </div>
  )
}
