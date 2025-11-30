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
  walletType?: 'handcash' | 'metanet' | 'paymail' | 'demo'
  viewMode?: 'grid' | 'list'
  onRent: (rental?: any) => void
}

// Category icons mapping
const categoryIcons: Record<string, JSX.Element> = {
  photography: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  tools: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  electronics: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  sports: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  vehicles: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM3 9a1 1 0 011-1h1.586a1 1 0 01.707.293L8 10h8l1.707-1.707A1 1 0 0118.414 8H20a1 1 0 011 1v8a1 1 0 01-1 1h-1.5a2.5 2.5 0 00-5 0h-3a2.5 2.5 0 00-5 0H4a1 1 0 01-1-1V9z" />
    </svg>
  ),
  other: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  )
}

export default function AssetCard({ asset, userKey, isOwner = false, demoMode = false, walletType = 'demo', viewMode = 'grid', onRent }: AssetCardProps) {
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [showEscrowModal, setShowEscrowModal] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [rentalDetails, setRentalDetails] = useState<any>(null)
  const [isHovered, setIsHovered] = useState(false)

  const statusConfig = {
    available: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20 dark:border-emerald-500/30',
      dot: 'bg-emerald-500',
      label: 'Available'
    },
    rented: {
      bg: 'bg-red-500/10 dark:bg-red-500/20',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-500/20 dark:border-red-500/30',
      dot: 'bg-red-500',
      label: 'Rented'
    },
    pending: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/20 dark:border-amber-500/30',
      dot: 'bg-amber-500',
      label: 'Pending'
    }
  }

  const status = statusConfig[asset.status]

  async function handleUnlockSuccess(details: any) {
    setRentalDetails(details)
    setUnlocked(true)
    setShowUnlockModal(false)
  }

  function handleRentClick() {
    if (demoMode && !unlocked) {
      // In demo mode, show the unlock modal first for the full experience
      setShowUnlockModal(true)
    } else if (unlocked) {
      setShowEscrowModal(true)
    } else {
      setShowUnlockModal(true)
    }
  }

  function handleDemoUnlock() {
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

  // List view layout
  if (viewMode === 'list') {
    return (
      <>
        <div 
          className="glass-card-hover p-4 sm:p-5"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex gap-4 sm:gap-6">
            {/* Image */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-700">
              {asset.imageUrl ? (
                <img
                  src={asset.imageUrl}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-surface-400 dark:text-surface-500">
                  {categoryIcons[asset.category] || categoryIcons.other}
                </div>
              )}
              {/* Status Badge */}
              <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${status.bg} ${status.text} border ${status.border}`}>
                {status.label}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white truncate">{asset.name}</h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-1 mt-0.5">{asset.description}</p>
                </div>
                {asset.rating && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{asset.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-3 text-sm text-surface-500 dark:text-surface-400">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {asset.location.city}, {asset.location.state}
                </span>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">${asset.rentalRatePerDay}</span>
                  <span className="text-sm text-surface-500 dark:text-surface-400">/day</span>
                  <span className="text-sm text-surface-400 dark:text-surface-500">|</span>
                  <span className="text-sm text-surface-600 dark:text-surface-400">${asset.depositAmount} deposit</span>
                </div>

                {!isOwner && asset.status === 'available' && (
                  <button
                    onClick={handleRentClick}
                    className={`btn-primary text-sm py-2 ${unlocked ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700' : ''}`}
                  >
                    {unlocked ? 'Rent Now' : `Unlock ~$${(asset.unlockFee * 50).toFixed(2)}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {showUnlockModal && (
          <HTTP402Modal
            asset={asset}
            userKey={userKey}
            demoMode={demoMode}
            walletType={walletType}
            onClose={() => setShowUnlockModal(false)}
            onSuccess={handleUnlockSuccess}
          />
        )}

        {showEscrowModal && rentalDetails && (
          <EscrowModal
            asset={asset}
            userKey={userKey}
            rentalDetails={rentalDetails}
            demoMode={demoMode}
            walletType={walletType}
            onClose={() => setShowEscrowModal(false)}
            onSuccess={() => {
              setShowEscrowModal(false)
              onRent()
            }}
          />
        )}
      </>
    )
  }

  // Grid view layout (default)
  return (
    <>
      <div 
        className="glass-card-hover overflow-hidden group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Section */}
        <div className="relative h-52 overflow-hidden bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-700">
          {asset.imageUrl ? (
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-105' : 'scale-100'}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-surface-300 dark:text-surface-600">
              {categoryIcons[asset.category] || categoryIcons.other}
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status Badge */}
          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5 ${status.bg} ${status.text} border ${status.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
            {status.label}
          </div>

          {/* Unlock Fee Badge */}
          {!unlocked && !isOwner && (
            <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-accent-500/90 dark:bg-accent-600/90 backdrop-blur-sm text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-accent-500/25">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Unlock for ~${(asset.unlockFee * 50).toFixed(2)}
            </div>
          )}

          {/* Unlocked Badge */}
          {unlocked && (
            <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-emerald-500/90 dark:bg-emerald-600/90 backdrop-blur-sm text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-500/25">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Details Unlocked
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {asset.name}
            </h3>
            {asset.rating && (
              <div className="flex items-center gap-1 flex-shrink-0 px-2 py-0.5 bg-amber-100/80 dark:bg-amber-900/30 rounded-lg">
                <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{asset.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-surface-600 dark:text-surface-400 mb-4 line-clamp-2">{asset.description}</p>

          <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 mb-4">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{asset.location.city}, {asset.location.state}</span>
          </div>

          {/* Pricing */}
          <div className="flex items-end justify-between border-t border-surface-200/50 dark:border-surface-700/50 pt-4 mb-4">
            <div>
              <p className="text-xs text-surface-500 dark:text-surface-400 mb-0.5">Daily Rate</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                ${asset.rentalRatePerDay}
                <span className="text-sm font-normal text-surface-500 dark:text-surface-400">/day</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-surface-500 dark:text-surface-400 mb-0.5">Deposit</p>
              <p className="text-base font-semibold text-surface-700 dark:text-surface-300">${asset.depositAmount}</p>
            </div>
          </div>

          {/* Unlocked Details */}
          {unlocked && rentalDetails && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
              <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
                Rental Details
              </h4>
              <div className="text-sm text-emerald-700 dark:text-emerald-400 space-y-1">
                <p className="truncate"><span className="font-medium">Pickup:</span> {rentalDetails.pickupLocation?.address}</p>
                {rentalDetails.accessCode && (
                  <p><span className="font-medium">Access Code:</span> {rentalDetails.accessCode}</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div>
            {isOwner ? (
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2.5 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium rounded-xl transition-all duration-200 text-sm border border-surface-200 dark:border-surface-700">
                  Edit
                </button>
                <button className="flex-1 px-4 py-2.5 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium rounded-xl transition-all duration-200 text-sm border border-surface-200 dark:border-surface-700">
                  Stats
                </button>
              </div>
            ) : asset.status === 'available' ? (
              <button
                onClick={handleRentClick}
                className={`w-full px-4 py-3 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  unlocked
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5'
                    : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5'
                }`}
              >
                {unlocked ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Rent Now
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Unlock Contact Info
                  </>
                )}
              </button>
            ) : (
              <button
                disabled
                className="w-full px-4 py-3 bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400 font-medium rounded-xl cursor-not-allowed"
              >
                Currently Unavailable
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <HTTP402Modal
          asset={asset}
          userKey={userKey}
          demoMode={demoMode}
          walletType={walletType}
          onClose={() => setShowUnlockModal(false)}
          onSuccess={handleUnlockSuccess}
        />
      )}

      {/* Rental Modal */}
      {showEscrowModal && rentalDetails && (
        <EscrowModal
          asset={asset}
          userKey={userKey}
          rentalDetails={rentalDetails}
          demoMode={demoMode}
          walletType={walletType}
          onClose={() => setShowEscrowModal(false)}
          onSuccess={(rental) => {
            setShowEscrowModal(false)
            onRent(rental)
          }}
        />
      )}
    </>
  )
}
