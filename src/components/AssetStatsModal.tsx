import { useState, useEffect } from 'react'
import Portal from './Portal'

interface Asset {
  id: string
  tokenId: string
  name: string
  description: string
  category: string
  imageUrl?: string
  rentalRatePerDay: number
  depositAmount: number
  currency: string
  location: {
    city: string
    state: string
  }
  status: 'available' | 'rented' | 'pending'
  rating?: number
  unlockFee: number
  ownerKey: string
  totalRentals?: number
  totalEarnings?: number
  createdAt?: string | Date
}

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
}

interface AssetStatsModalProps {
  asset: Asset
  onClose: () => void
  demoMode?: boolean
}

export default function AssetStatsModal({ asset, onClose, demoMode = false }: AssetStatsModalProps) {
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'analytics'>('overview')

  useEffect(() => {
    loadRentals()
  }, [asset.id])

  async function loadRentals() {
    setLoading(true)
    try {
      const response = await fetch(`/api/rentals/by-asset?assetId=${asset.id}`)
      if (response.ok) {
        const data = await response.json()
        setRentals(data.rentals || [])
      }
    } catch (error) {
      console.error('Failed to load rentals:', error)
      // Generate demo data if in demo mode
      if (demoMode) {
        const mockRentals: Rental[] = Array.from({ length: asset.totalRentals || 3 }, (_, i) => ({
          id: `rental_demo_${i}`,
          assetId: asset.id,
          assetName: asset.name,
          renterKey: `demo_renter_${i}`,
          ownerKey: asset.ownerKey,
          startDate: new Date(Date.now() - (30 - i * 5) * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() - (28 - i * 5) * 24 * 60 * 60 * 1000).toISOString(),
          rentalDays: 2 + i,
          rentalFee: asset.rentalRatePerDay * (2 + i),
          depositAmount: asset.depositAmount,
          totalAmount: asset.rentalRatePerDay * (2 + i) + asset.depositAmount,
          status: i === 0 ? 'active' : 'completed',
          escrowId: `escrow_demo_${i}`,
          createdAt: new Date(Date.now() - (30 - i * 5) * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: i === 0 ? undefined : new Date(Date.now() - (28 - i * 5) * 24 * 60 * 60 * 1000).toISOString()
        }))
        setRentals(mockRentals)
      }
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const totalRentals = asset.totalRentals || rentals.length
  const totalEarnings = asset.totalEarnings || rentals.reduce((sum, r) => sum + r.rentalFee, 0)
  const activeRentals = rentals.filter(r => r.status === 'active').length
  const completedRentals = rentals.filter(r => r.status === 'completed').length
  const avgRentalDays = rentals.length > 0 
    ? (rentals.reduce((sum, r) => sum + r.rentalDays, 0) / rentals.length).toFixed(1) 
    : '0'
  const avgEarningsPerRental = totalRentals > 0 ? (totalEarnings / totalRentals).toFixed(0) : '0'
  
  // Days since listing
  const daysSinceListing = asset.createdAt 
    ? Math.floor((Date.now() - new Date(asset.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Utilization rate (simplified)
  const utilizationRate = daysSinceListing > 0 
    ? Math.min(100, Math.round((rentals.reduce((sum, r) => sum + r.rentalDays, 0) / daysSinceListing) * 100))
    : 0

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { id: 'history', label: 'Rental History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
  ]

  return (
    <Portal>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-content max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
          {/* Header */}
          <div className="relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-primary-600" />
            <div className="relative px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Listing Stats</h2>
                    <p className="text-white/70 text-sm truncate max-w-[200px]">{asset.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 py-3 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
            <div className="flex gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700/50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-900 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-surface-600 dark:text-surface-400">Loading stats...</p>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="glass-card p-4 text-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${totalEarnings.toFixed(0)}</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">Total Earnings</p>
                      </div>

                      <div className="glass-card p-4 text-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{totalRentals}</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">Total Rentals</p>
                      </div>

                      <div className="glass-card p-4 text-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{avgRentalDays}</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">Avg. Days/Rental</p>
                      </div>

                      <div className="glass-card p-4 text-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{utilizationRate}%</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">Utilization</p>
                      </div>
                    </div>

                    {/* Listing Info */}
                    <div className="glass-card p-5">
                      <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Listing Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Daily Rate</p>
                          <p className="font-semibold text-surface-900 dark:text-white">${asset.rentalRatePerDay}/day</p>
                        </div>
                        <div>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Security Deposit</p>
                          <p className="font-semibold text-surface-900 dark:text-white">${asset.depositAmount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Unlock Fee</p>
                          <p className="font-semibold text-surface-900 dark:text-white">{asset.unlockFee} BSV</p>
                        </div>
                        <div>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Status</p>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            asset.status === 'available'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : asset.status === 'rented'
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              asset.status === 'available' ? 'bg-emerald-500' :
                              asset.status === 'rented' ? 'bg-amber-500' : 'bg-surface-400'
                            }`}></span>
                            {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Location</p>
                          <p className="font-semibold text-surface-900 dark:text-white">{asset.location.city}, {asset.location.state}</p>
                        </div>
                        <div>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Days Listed</p>
                          <p className="font-semibold text-surface-900 dark:text-white">{daysSinceListing} days</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-surface-600 dark:text-surface-400">Active Rentals</span>
                          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{activeRentals}</span>
                        </div>
                        <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${totalRentals > 0 ? (activeRentals / totalRentals) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="glass-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-surface-600 dark:text-surface-400">Avg. Earnings/Rental</span>
                          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">${avgEarningsPerRental}</span>
                        </div>
                        <p className="text-xs text-surface-500">Based on {totalRentals} rental{totalRentals !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-4 animate-fade-in">
                    {rentals.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-surface-200 dark:border-surface-700">
                              <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Date</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Duration</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Status</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Earnings</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rentals.map(rental => (
                              <tr key={rental.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                                <td className="py-4 px-4">
                                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                                    {new Date(rental.startDate).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-surface-500 dark:text-surface-400">
                                    to {new Date(rental.endDate).toLocaleDateString()}
                                  </p>
                                </td>
                                <td className="py-4 px-4 text-sm text-surface-600 dark:text-surface-400">
                                  {rental.rentalDays} day{rental.rentalDays !== 1 ? 's' : ''}
                                </td>
                                <td className="py-4 px-4">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                    rental.status === 'active'
                                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                      : rental.status === 'completed'
                                      ? 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  }`}>
                                    {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                                  </span>
                                </td>
                                <td className="py-4 px-4 font-medium text-emerald-600 dark:text-emerald-400">
                                  ${rental.rentalFee.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-surface-600 dark:text-surface-400">No rental history yet</p>
                        <p className="text-sm text-surface-500 dark:text-surface-500 mt-1">Rentals will appear here once someone rents this item</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Revenue Breakdown */}
                    <div className="glass-card p-5">
                      <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Revenue Summary
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                          <span className="text-surface-600 dark:text-surface-400">Rental Fees</span>
                          <span className="font-semibold text-surface-900 dark:text-white">${totalEarnings.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                          <span className="text-surface-600 dark:text-surface-400">Unlock Fees (est.)</span>
                          <span className="font-semibold text-surface-900 dark:text-white">${(totalRentals * asset.unlockFee * 50).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <span className="font-medium text-surface-900 dark:text-white">Total Revenue</span>
                          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${(totalEarnings + totalRentals * asset.unlockFee * 50).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="glass-card p-5">
                      <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Performance Metrics
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Rentals/Month (avg)</p>
                          <p className="text-2xl font-bold text-surface-900 dark:text-white">
                            {daysSinceListing > 0 ? (totalRentals / (daysSinceListing / 30)).toFixed(1) : '0'}
                          </p>
                        </div>
                        <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Revenue/Month (avg)</p>
                          <p className="text-2xl font-bold text-surface-900 dark:text-white">
                            ${daysSinceListing > 0 ? (totalEarnings / (daysSinceListing / 30)).toFixed(0) : '0'}
                          </p>
                        </div>
                        <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Completion Rate</p>
                          <p className="text-2xl font-bold text-surface-900 dark:text-white">
                            {totalRentals > 0 ? Math.round((completedRentals / totalRentals) * 100) : 100}%
                          </p>
                        </div>
                        <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Avg. Rating</p>
                          <p className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-1">
                            {asset.rating?.toFixed(1) || '5.0'}
                            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-primary-800 dark:text-primary-300">
                          <p className="font-medium mb-1.5">Tips to Increase Earnings</p>
                          <ul className="list-disc list-inside space-y-1 text-primary-700 dark:text-primary-400">
                            <li>Add more photos to your listing</li>
                            <li>Respond quickly to rental inquiries</li>
                            <li>Consider offering weekly discounts</li>
                            <li>Keep your listing details up to date</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-200 dark:border-surface-700 flex justify-end flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
