import { useState, useEffect, useCallback } from 'react'
import QRCode from 'react-qr-code'

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
}

interface RentalAsset {
  id: string
  name: string
  status: 'available' | 'rented' | 'pending'
  rentalRatePerDay: number
  totalRentals: number
  totalEarnings: number
}

interface Transaction {
  id: string
  type: 'payment' | 'deposit' | 'refund' | 'unlock'
  amount: number
  currency: string
  txId: string
  status: 'confirmed' | 'pending'
  timestamp: string
  description: string
  assetName?: string
}

interface RentalDashboardProps {
  userKey: string
  demoMode?: boolean
  walletType?: 'handcash' | 'metanet' | 'paymail' | 'demo'
  walletBalance?: number | null
}

export default function RentalDashboard({ userKey, demoMode = false, walletType = 'demo', walletBalance }: RentalDashboardProps) {
  const [activeRentals, setActiveRentals] = useState<Rental[]>([])
  const [pastRentals, setPastRentals] = useState<Rental[]>([])
  const [myAssets, setMyAssets] = useState<RentalAsset[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'rentals' | 'earnings' | 'transactions'>('overview')
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch rentals (both as renter and owner)
      const [rentalsRes, assetsRes] = await Promise.all([
        fetch(`/api/rentals/my?userKey=${userKey}&role=all`),
        fetch(`/api/assets/my?owner=${userKey}`)
      ])

      if (rentalsRes.ok) {
        const data = await rentalsRes.json()
        const rentals = data.rentals || []
        setActiveRentals(rentals.filter((r: Rental) => r.status === 'active' || r.status === 'pending'))
        setPastRentals(rentals.filter((r: Rental) => r.status === 'completed' || r.status === 'cancelled'))
        
        // Generate mock transactions from rentals for demo
        const mockTransactions: Transaction[] = rentals.map((r: Rental, idx: number) => ({
          id: `tx_${r.id}`,
          type: 'payment' as const,
          amount: r.totalAmount,
          currency: 'USD',
          txId: r.paymentTxId || `demo_tx_${Date.now()}_${idx}`,
          status: 'confirmed' as const,
          timestamp: r.createdAt,
          description: `Rental payment for ${r.assetName}`,
          assetName: r.assetName
        }))
        setTransactions(mockTransactions)
      }

      if (assetsRes.ok) {
        const data = await assetsRes.json()
        setMyAssets(data.assets || [])
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [userKey])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Calculate stats
  const totalEarnings = myAssets.reduce((sum, a) => sum + (a.totalEarnings || 0), 0)
  const totalSpent = pastRentals.reduce((sum, r) => sum + r.totalAmount, 0) + 
                     activeRentals.reduce((sum, r) => sum + r.totalAmount, 0)
  const totalRentals = activeRentals.length + pastRentals.length

  const handleCompleteRental = async (rentalId: string) => {
    try {
      const response = await fetch('/api/rentals/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentalId, userKey })
      })
      if (response.ok) {
        loadDashboardData()
      }
    } catch (error) {
      console.error('Error completing rental:', error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 dark:border-primary-900 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-surface-600 dark:text-surface-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-2">
              Rental Dashboard
            </h1>
            <p className="text-surface-600 dark:text-surface-400 text-lg">
              Manage your rentals, earnings, and transactions
            </p>
          </div>
          
          {/* Wallet Info Card */}
          <div className="glass-card p-4 min-w-[280px]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">Connected Wallet</p>
                <p className="font-mono text-sm font-medium text-surface-900 dark:text-white">
                  {userKey.slice(0, 10)}...{userKey.slice(-6)}
                </p>
                {walletBalance !== null && walletBalance !== undefined && (
                  <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {walletBalance.toFixed(4)} BSV
                    <span className="text-xs text-surface-500 ml-1">
                      (~${(walletBalance * 50).toFixed(2)})
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up animation-delay-100">
        <div className="glass-card p-5 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{activeRentals.length}</p>
          <p className="text-sm text-surface-600 dark:text-surface-400">Active Rentals</p>
        </div>

        <div className="glass-card p-5 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">${totalEarnings.toFixed(0)}</p>
          <p className="text-sm text-surface-600 dark:text-surface-400">Total Earned</p>
        </div>

        <div className="glass-card p-5 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">${totalSpent.toFixed(0)}</p>
          <p className="text-sm text-surface-600 dark:text-surface-400">Total Spent</p>
        </div>

        <div className="glass-card p-5 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalRentals}</p>
          <p className="text-sm text-surface-600 dark:text-surface-400">Total Rentals</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 animate-slide-up animation-delay-150">
        <div className="tab-list w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
            { id: 'rentals', label: 'My Rentals', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'earnings', label: 'Earnings', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'transactions', label: 'Transactions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' }
          ].map(tab => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 ${activeTab === tab.id ? 'tab-item-active' : 'tab-item-inactive'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Active Rentals */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Active Rentals
              </h3>
              {activeRentals.length > 0 ? (
                <div className="space-y-3">
                  {activeRentals.slice(0, 3).map(rental => (
                    <div key={rental.id} className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200/50 dark:border-surface-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-surface-900 dark:text-white">{rental.assetName}</h4>
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
                          Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-surface-500 dark:text-surface-400">
                          {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                        </span>
                        <span className="font-medium text-primary-600 dark:text-primary-400">${rental.totalAmount}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => { setSelectedRental(rental); setShowQRModal(true); }}
                          className="flex-1 px-3 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          QR Code
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompleteRental(rental.id)}
                          className="flex-1 px-3 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-surface-500 dark:text-surface-400 text-center py-8">No active rentals</p>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Recent Transactions
              </h3>
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200/50 dark:border-surface-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            tx.type === 'payment' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                            tx.type === 'refund' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                            'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {tx.type === 'payment' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h14m-6 4v1a3 3 0 003 3h4a3 3 0 003-3V7a3 3 0 00-3-3h-4a3 3 0 00-3 3v1" />
                              )}
                            </svg>
                          </span>
                          <div>
                            <p className="text-sm font-medium text-surface-900 dark:text-white capitalize">{tx.type}</p>
                            <p className="text-xs text-surface-500 dark:text-surface-400">{tx.assetName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${tx.type === 'refund' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {tx.type === 'refund' ? '+' : '-'}${tx.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-surface-500 dark:text-surface-400">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-surface-200/50 dark:border-surface-700/50">
                        <span className="text-surface-500 dark:text-surface-400">TX ID:</span>
                        <a
                          href={`https://whatsonchain.com/tx/${tx.txId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-primary-600 dark:text-primary-400 hover:underline truncate max-w-[200px]"
                        >
                          {tx.txId.slice(0, 12)}...{tx.txId.slice(-8)}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-surface-500 dark:text-surface-400 text-center py-8">No transactions yet</p>
              )}
            </div>
          </div>
        )}

        {/* Rentals Tab */}
        {activeTab === 'rentals' && (
          <div className="space-y-6">
            {/* Active Rentals Section */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Active Rentals ({activeRentals.length})
              </h3>
              {activeRentals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Item</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Dates</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Total</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">TX ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRentals.map(rental => (
                        <tr key={rental.id} className="border-b border-surface-100 dark:border-surface-800">
                          <td className="py-4 px-4">
                            <p className="font-medium text-surface-900 dark:text-white">{rental.assetName}</p>
                          </td>
                          <td className="py-4 px-4 text-sm text-surface-600 dark:text-surface-400">
                            {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
                              {rental.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-medium text-primary-600 dark:text-primary-400">
                            ${rental.totalAmount.toFixed(2)}
                          </td>
                          <td className="py-4 px-4">
                            <a
                              href={`https://whatsonchain.com/tx/${rental.escrowId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-primary-600 dark:text-primary-400 hover:underline"
                            >
                              {rental.escrowId.slice(0, 8)}...
                            </a>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => { setSelectedRental(rental); setShowQRModal(true); }}
                                className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                title="Show QR Code"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCompleteRental(rental.id)}
                                className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                              >
                                Complete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-surface-500 dark:text-surface-400 text-center py-8">No active rentals</p>
              )}
            </div>

            {/* Past Rentals Section */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                Past Rentals ({pastRentals.length})
              </h3>
              {pastRentals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Item</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Dates</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Total</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">TX ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastRentals.map(rental => (
                        <tr key={rental.id} className="border-b border-surface-100 dark:border-surface-800">
                          <td className="py-4 px-4">
                            <p className="font-medium text-surface-900 dark:text-white">{rental.assetName}</p>
                          </td>
                          <td className="py-4 px-4 text-sm text-surface-600 dark:text-surface-400">
                            {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                              rental.status === 'completed' 
                                ? 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {rental.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-medium text-surface-600 dark:text-surface-400">
                            ${rental.totalAmount.toFixed(2)}
                          </td>
                          <td className="py-4 px-4">
                            <a
                              href={`https://whatsonchain.com/tx/${rental.escrowId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-primary-600 dark:text-primary-400 hover:underline"
                            >
                              {rental.escrowId.slice(0, 8)}...
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-surface-500 dark:text-surface-400 text-center py-8">No past rentals</p>
              )}
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            {/* Earnings Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="glass-card p-6 text-center">
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">Total Earnings</p>
                <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">${totalEarnings.toFixed(2)}</p>
                <p className="text-sm text-surface-400 mt-1">~{(totalEarnings / 50).toFixed(4)} BSV</p>
              </div>
              <div className="glass-card p-6 text-center">
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">Active Listings</p>
                <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">{myAssets.length}</p>
              </div>
              <div className="glass-card p-6 text-center">
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">Total Rentals Given</p>
                <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                  {myAssets.reduce((sum, a) => sum + (a.totalRentals || 0), 0)}
                </p>
              </div>
            </div>

            {/* My Assets */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">My Listings Performance</h3>
              {myAssets.length > 0 ? (
                <div className="grid gap-4">
                  {myAssets.map(asset => (
                    <div key={asset.id} className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200/50 dark:border-surface-700/50 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-surface-900 dark:text-white">{asset.name}</h4>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          ${asset.rentalRatePerDay}/day | {asset.totalRentals || 0} rentals
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          ${(asset.totalEarnings || 0).toFixed(2)}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          asset.status === 'available' 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        }`}>
                          {asset.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-surface-500 dark:text-surface-400 text-center py-8">No listings yet</p>
              )}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Transaction History</h3>
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">TX ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} className="border-b border-surface-100 dark:border-surface-800">
                        <td className="py-4 px-4">
                          <span className={`capitalize font-medium ${
                            tx.type === 'refund' ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-900 dark:text-white'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-surface-600 dark:text-surface-400">
                          {tx.description}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`font-semibold ${
                            tx.type === 'refund' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {tx.type === 'refund' ? '+' : '-'}${tx.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            tx.status === 'confirmed'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <a
                            href={`https://whatsonchain.com/tx/${tx.txId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                          >
                            {tx.txId.slice(0, 10)}...
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </td>
                        <td className="py-4 px-4 text-sm text-surface-600 dark:text-surface-400">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-surface-500 dark:text-surface-400 text-center py-8">No transactions yet</p>
            )}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedRental && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowQRModal(false)}>
          <div className="modal-content max-w-md animate-scale-in">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-600" />
              <div className="relative px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Rental QR Code</h2>
                      <p className="text-white/70 text-sm">Pickup / Return Verification</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQRModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-2">{selectedRental.assetName}</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Scan to verify pickup or return
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl flex items-center justify-center mb-6">
                <QRCode
                  value={JSON.stringify({
                    rentalId: selectedRental.id,
                    escrowId: selectedRental.escrowId,
                    asset: selectedRental.assetName,
                    accessCode: selectedRental.accessCode,
                    dates: {
                      start: selectedRental.startDate,
                      end: selectedRental.endDate
                    }
                  })}
                  size={200}
                  level="H"
                />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-500 dark:text-surface-400">Rental ID</span>
                  <span className="font-mono text-surface-900 dark:text-white">{selectedRental.id.slice(0, 15)}...</span>
                </div>
                {selectedRental.accessCode && (
                  <div className="flex justify-between">
                    <span className="text-surface-500 dark:text-surface-400">Access Code</span>
                    <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{selectedRental.accessCode}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-surface-500 dark:text-surface-400">Pickup Date</span>
                  <span className="text-surface-900 dark:text-white">{new Date(selectedRental.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500 dark:text-surface-400">Return Date</span>
                  <span className="text-surface-900 dark:text-white">{new Date(selectedRental.endDate).toLocaleDateString()}</span>
                </div>
              </div>

              {selectedRental.pickupLocation && (
                <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-xl">
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-1">Pickup Location</p>
                  <p className="text-sm text-primary-800 dark:text-primary-300">{selectedRental.pickupLocation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
