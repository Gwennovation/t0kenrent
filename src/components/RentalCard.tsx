import { useState } from 'react'
import { getWhatsonchainExplorerBase } from '@/lib/bsv-network'
import SmartContractStatus from './SmartContractStatus'

interface Rental {
  id: string
  assetId: string
  assetName: string
  renterKey: string
  ownerKey: string
  startDate: string
  endDate: string
  rentalDays: number
  rentalFee: number
  depositAmount: number
  totalAmount: number
  status: 'active' | 'completed' | 'cancelled' | 'pending'
  escrowId: string
  createdAt: string
  completedAt?: string
  pickupLocation?: string
  accessCode?: string
  paymentTxId?: string
  escrowTxId?: string
}

interface RentalCardProps {
  rental: Rental
  userKey: string
  demoMode?: boolean
  onUpdate: () => void
}

export default function RentalCard({ rental, userKey, demoMode = false, onUpdate }: RentalCardProps) {
  const [completing, setCompleting] = useState(false)
  const wocExplorerBase = getWhatsonchainExplorerBase()
  const [showContractStatus, setShowContractStatus] = useState(false)

  const isRenter = rental.renterKey === userKey
  const statusConfig = {
    active: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      label: 'Active'
    },
    completed: {
      bg: 'bg-surface-100 dark:bg-surface-800',
      text: 'text-surface-600 dark:text-surface-400',
      label: 'Completed'
    },
    cancelled: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      label: 'Cancelled'
    },
    pending: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      label: 'Pending'
    }
  }

  const status = statusConfig[rental.status]

  const startDate = new Date(rental.startDate)
  const endDate = new Date(rental.endDate)
  const now = new Date()
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  async function handleComplete() {
    setCompleting(true)
    try {
      const response = await fetch('/api/rentals/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId: rental.id,
          userKey
        })
      })

      if (response.ok) {
        onUpdate()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to complete rental')
      }
    } catch (error) {
      console.error('Error completing rental:', error)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="glass-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-lg font-semibold text-surface-900 dark:text-white">
              {rental.assetName}
            </h4>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-surface-500 dark:text-surface-400">Dates</p>
              <p className="font-medium text-surface-900 dark:text-white">
                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-surface-500 dark:text-surface-400">Duration</p>
              <p className="font-medium text-surface-900 dark:text-white">{rental.rentalDays} days</p>
            </div>
            <div>
              <p className="text-surface-500 dark:text-surface-400">Total Cost</p>
              <p className="font-medium text-primary-600 dark:text-primary-400">${rental.totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-surface-500 dark:text-surface-400">Role</p>
              <p className="font-medium text-surface-900 dark:text-white">{isRenter ? 'Renter' : 'Owner'}</p>
            </div>
          </div>

          {rental.status === 'active' && daysRemaining >= 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-amber-600 dark:text-amber-400">
                {daysRemaining === 0 ? 'Ends today' : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`}
              </span>
            </div>
          )}

          {rental.pickupLocation && (
            <div className="mt-3 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
              <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Pickup Location</p>
              <p className="text-sm font-medium text-surface-900 dark:text-white">{rental.pickupLocation}</p>
              {rental.accessCode && (
                <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                  Access Code: <span className="font-mono">{rental.accessCode}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {rental.status === 'active' && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleComplete}
              disabled={completing}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {completing ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Complete Rental
            </button>
          </div>
        )}

        {rental.status === 'completed' && rental.completedAt && (
          <div className="text-sm text-surface-500 dark:text-surface-400">
            Completed {new Date(rental.completedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Transaction IDs */}
      {(rental.paymentTxId || rental.escrowTxId || rental.escrowId) && (
        <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-surface-500 dark:text-surface-400">On-Chain:</span>
            {rental.paymentTxId && (
              <a
                href={`${wocExplorerBase}/tx/${rental.paymentTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline font-mono"
              >
                Payment TX
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            {rental.escrowTxId && (
              <a
                href={`${wocExplorerBase}/tx/${rental.escrowTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline font-mono"
              >
                Escrow TX
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            <button
              type="button"
              onClick={() => setShowContractStatus(true)}
              className="flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Contract Status
            </button>
          </div>
        </div>
      )}

      {/* Smart Contract Status Modal */}
      {showContractStatus && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowContractStatus(false)}>
          <div className="modal-content max-w-lg animate-scale-in">
            <SmartContractStatus
              escrowId={rental.escrowId}
              userKey={userKey}
              demoMode={demoMode}
              onClose={() => setShowContractStatus(false)}
              onSign={() => {
                setShowContractStatus(false)
                onUpdate()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
