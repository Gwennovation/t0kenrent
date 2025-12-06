import { useState, useEffect, useCallback, useMemo } from 'react'
import AssetCard from './AssetCard'
import CreateAssetModal from './CreateAssetModal'
import RentalCard from './RentalCard'
import { SkeletonGrid } from './SkeletonCard'
import { getErrorMessage } from '@/lib/error-utils'

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
  totalRentals?: number
  totalEarnings?: number
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
  pickupLocation?: string
  accessCode?: string
}

interface RentalMarketplaceProps {
  userKey: string
  demoMode?: boolean
  walletType?: 'handcash' | 'metanet' | 'paymail' | 'demo'
}

export default function RentalMarketplace({ userKey, demoMode = false, walletType = 'demo' }: RentalMarketplaceProps) {
  const [assets, setAssets] = useState<RentalAsset[]>([])
  const [myAssets, setMyAssets] = useState<RentalAsset[]>([])
  const [myRentals, setMyRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'browse' | 'myAssets' | 'myRentals'>('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [successMessage, setSuccessMessage] = useState('')
  const [myListingsFilter, setMyListingsFilter] = useState<'all' | 'available' | 'rented'>('all')
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [bulkRentMode, setBulkRentMode] = useState(false)

  const categories = useMemo(() => [
    { id: 'all', name: 'All Categories', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'realestate', name: 'Real Estate & Staycations', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'photography', name: 'Photography', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'tools', name: 'Tools & Equipment', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'electronics', name: 'Electronics', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'sports', name: 'Sports & Outdoors', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'vehicles', name: 'Vehicles', icon: 'M8 17a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM3 9a1 1 0 011-1h1.586a1 1 0 01.707.293L8 10h8l1.707-1.707A1 1 0 0118.414 8H20a1 1 0 011 1v8a1 1 0 01-1 1h-1.5a2.5 2.5 0 00-5 0h-3a2.5 2.5 0 00-5 0H4a1 1 0 01-1-1V9z' },
    { id: 'other', name: 'Other', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' }
  ], [])

  const loadAssets = useCallback(async () => {
    setLoading(true)
    try {
      // Parallel fetch for better performance
      const [assetsRes, myAssetsRes, myRentalsRes] = await Promise.all([
        fetch('/api/assets/list'),
        fetch(`/api/assets/my?owner=${userKey}`),
        fetch(`/api/rentals/my?userKey=${userKey}`)
      ])

      if (assetsRes.ok) {
        const data = await assetsRes.json()
        setAssets(data.assets || [])
      }

      if (myAssetsRes.ok) {
        const myData = await myAssetsRes.json()
        setMyAssets(myData.assets || [])
      }

      if (myRentalsRes.ok) {
        const rentalsData = await myRentalsRes.json()
        setMyRentals(rentalsData.rentals || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }, [userKey])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  const handleCreateAsset = useCallback(async (assetData: Partial<RentalAsset>) => {
    try {
      const response = await fetch('/api/assets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...assetData,
          ownerKey: userKey
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create asset')
      }

      // Add to both my assets and all assets
      setMyAssets(prev => [result.asset, ...prev])
      setAssets(prev => [result.asset, ...prev])
      setShowCreateModal(false)
      setSuccessMessage(`"${result.asset.name}" listed successfully! It's now visible in the marketplace.`)
      setTimeout(() => setSuccessMessage(''), 5000)
      
      // Switch to My Assets tab
      setActiveTab('myAssets')
    } catch (error) {
      alert('Failed to create asset: ' + getErrorMessage(error))
    }
  }, [userKey])

  const toggleAssetSelection = useCallback((assetId: string) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(assetId)) {
        newSet.delete(assetId)
      } else {
        newSet.add(assetId)
      }
      return newSet
    })
  }, [])

  const handleRentalCreated = useCallback((rental: Rental) => {
    setMyRentals(prev => [rental, ...prev])
    setSuccessMessage(`Rental confirmed for "${rental.assetName}"!`)
    setTimeout(() => setSuccessMessage(''), 5000)
    loadAssets() // Refresh to update asset status
  }, [loadAssets])

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           asset.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [assets, searchQuery, selectedCategory])

  const activeRentals = useMemo(() => myRentals.filter(r => r.status === 'active'), [myRentals])
  const completedRentals = useMemo(() => myRentals.filter(r => r.status === 'completed'), [myRentals])

  // Filter my listings by status
  const filteredMyAssets = useMemo(() => {
    if (myListingsFilter === 'all') return myAssets
    return myAssets.filter(asset => asset.status === myListingsFilter)
  }, [myAssets, myListingsFilter])

  // Bulk rental callbacks (defined after filteredAssets)
  const selectAllVisibleAssets = useCallback(() => {
    const availableAssets = filteredAssets.filter(a => a.status === 'available' && a.ownerKey !== userKey)
    setSelectedAssets(new Set(availableAssets.map(a => a.id)))
  }, [filteredAssets, userKey])

  const clearSelection = useCallback(() => {
    setSelectedAssets(new Set())
  }, [])

  const handleBulkRent = useCallback(async () => {
    if (selectedAssets.size === 0) return
    
    const confirmed = confirm(`Rent ${selectedAssets.size} item(s)? This will create ${selectedAssets.size} separate rental transactions.`)
    if (!confirmed) return

    try {
      const selectedAssetsList = Array.from(selectedAssets).map(assetId => {
        const asset = assets.find(a => a.id === assetId)
        return asset
      }).filter(Boolean)

      // Create rental requests for each selected asset
      const rentalRequests = selectedAssetsList.map(asset => ({
        assetId: asset!.id,
        renterKey: userKey,
        ownerKey: asset!.ownerKey,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day default
        rentalDays: 1,
        rentalFee: asset!.rentalRatePerDay,
        depositAmount: asset!.depositAmount,
        totalAmount: asset!.rentalRatePerDay + asset!.depositAmount
      }))

      const response = await fetch('/api/rentals/create-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentals: rentalRequests })
      })

      const result = await response.json()

      if (result.success) {
        setSuccessMessage(`Successfully rented ${result.created} item(s)!${result.failed > 0 ? ` ${result.failed} failed.` : ''}`)
        clearSelection()
        setBulkRentMode(false)
        loadAssets() // Refresh
        setTimeout(() => setSuccessMessage(''), 5000)
      } else {
        throw new Error(result.error || 'Batch rental failed')
      }
    } catch (error) {
      alert('Failed to rent items: ' + getErrorMessage(error))
    }
  }, [selectedAssets, assets, userKey, clearSelection, loadAssets])

  const tabs = useMemo(() => [
    { id: 'browse', label: 'Browse Items', count: filteredAssets.length },
    { id: 'myAssets', label: 'My Listings', count: myAssets.length },
    { id: 'myRentals', label: 'My Rentals', count: activeRentals.length }
  ], [filteredAssets.length, myAssets.length, activeRentals.length])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-8 animate-slide-up">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-2">
              Rental Marketplace
            </h1>
            <p className="text-surface-600 dark:text-surface-400 text-lg">
              Find and rent items from people in your area
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            List New Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 animate-slide-up animation-delay-100">
        <div className="tab-list w-fit">
          {tabs.map(tab => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={activeTab === tab.id ? 'tab-item-active' : 'tab-item-inactive'}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id 
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400' 
                    : 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <>
          {/* Search and Filter Bar */}
          <div className="glass-card p-4 mb-6 animate-slide-up animation-delay-150">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="input-field pl-12"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-3">
                <div className="relative min-w-[160px]">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input-field appearance-none pr-10 cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 border border-surface-200 dark:border-surface-700">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600 dark:text-primary-400' 
                        : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 rounded-lg transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600 dark:text-primary-400' 
                        : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Category Pills - Mobile Scrollable */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {categories.map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === cat.id
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.icon} />
                  </svg>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Rent Toolbar */}
          {filteredAssets.some(a => a.status === 'available' && a.ownerKey !== userKey) && (
            <div className="glass-card p-4 mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setBulkRentMode(!bulkRentMode)
                    if (bulkRentMode) clearSelection()
                  }}
                  className={`btn-${bulkRentMode ? 'secondary' : 'outline'} text-sm`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {bulkRentMode ? 'Cancel Selection' : 'Rent Multiple Items'}
                </button>
                {bulkRentMode && (
                  <>
                    <span className="text-sm text-surface-600 dark:text-surface-400">
                      {selectedAssets.size} selected
                    </span>
                    {selectedAssets.size > 0 && (
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                      >
                        Clear
                      </button>
                    )}
                  </>
                )}
              </div>
              {bulkRentMode && (
                <div className="flex gap-2">
                  {selectedAssets.size < filteredAssets.filter(a => a.status === 'available' && a.ownerKey !== userKey).length && (
                    <button
                      type="button"
                      onClick={selectAllVisibleAssets}
                      className="btn-outline text-sm"
                    >
                      Select All Available
                    </button>
                  )}
                  {selectedAssets.size > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkRent}
                      className="btn-primary text-sm"
                    >
                      Rent {selectedAssets.size} Item{selectedAssets.size !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Asset Grid */}
          {loading ? (
            <SkeletonGrid count={6} viewMode={viewMode} />
          ) : filteredAssets.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {filteredAssets.map((asset, index) => (
                <div 
                  key={asset.id} 
                  className="animate-slide-up"
                  style={{ animationDelay: `${Math.min(index, 5) * 50 + 100}ms` }}
                >
                  <AssetCard
                    asset={asset}
                    userKey={userKey}
                    demoMode={demoMode}
                    walletType={walletType}
                    viewMode={viewMode}
                    onRent={handleRentalCreated}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state animate-slide-up animation-delay-200">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-700 flex items-center justify-center">
                <svg className="w-12 h-12 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                No items found
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Be the first to list an item!'}
              </p>
              {!searchQuery && selectedCategory === 'all' && (
                <button type="button" onClick={() => setShowCreateModal(true)} className="btn-primary">
                  List Your First Item
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* My Assets Tab */}
      {activeTab === 'myAssets' && (
        <div className="animate-fade-in">
          {/* Status Filter */}
          {myAssets.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-surface-600 dark:text-surface-400">Filter by status:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMyListingsFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      myListingsFilter === 'all'
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700'
                    }`}
                  >
                    All ({myAssets.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMyListingsFilter('available')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      myListingsFilter === 'available'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      myListingsFilter === 'available' ? 'bg-white' : 'bg-emerald-500'
                    }`}></span>
                    Available ({myAssets.filter(a => a.status === 'available').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMyListingsFilter('rented')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      myListingsFilter === 'rented'
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      myListingsFilter === 'rented' ? 'bg-white' : 'bg-amber-500'
                    }`}></span>
                    Rented ({myAssets.filter(a => a.status === 'rented').length})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          {myAssets.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{myAssets.length}</p>
                <p className="text-sm text-surface-600 dark:text-surface-400">Total Listings</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {myAssets.filter(a => a.status === 'available').length}
                </p>
                <p className="text-sm text-surface-600 dark:text-surface-400">Available</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {myAssets.filter(a => a.status === 'rented').length}
                </p>
                <p className="text-sm text-surface-600 dark:text-surface-400">Rented Out</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-surface-900 dark:text-white">
                  ${myAssets.reduce((sum, a) => sum + (a.totalEarnings || 0), 0).toFixed(0)}
                </p>
                <p className="text-sm text-surface-600 dark:text-surface-400">Total Earned</p>
              </div>
            </div>
          )}

          {filteredMyAssets.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {filteredMyAssets.map((asset, index) => (
                <div 
                  key={asset.id} 
                  className="animate-slide-up"
                  style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
                >
                  <AssetCard
                    asset={asset}
                    userKey={userKey}
                    isOwner={true}
                    demoMode={demoMode}
                    walletType={walletType}
                    viewMode={viewMode}
                    onRent={() => loadAssets()}
                  />
                </div>
              ))}
            </div>
          ) : myAssets.length > 0 ? (
            /* No items match filter */
            <div className="empty-state">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-700 flex items-center justify-center">
                <svg className="w-12 h-12 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                No {myListingsFilter === 'available' ? 'available' : 'rented'} items
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
                {myListingsFilter === 'available' 
                  ? 'All your items are currently rented out!' 
                  : 'None of your items are currently being rented.'}
              </p>
              <button type="button" onClick={() => setMyListingsFilter('all')} className="btn-secondary">
                View All Listings
              </button>
            </div>
          ) : (
            /* No items at all */
            <div className="empty-state">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-700 flex items-center justify-center">
                <svg className="w-12 h-12 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                No items listed yet
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
                Start earning by listing your first item
              </p>
              <button type="button" onClick={() => setShowCreateModal(true)} className="btn-primary">
                List Your First Item
              </button>
            </div>
          )}
        </div>
      )}

      {/* My Rentals Tab */}
      {activeTab === 'myRentals' && (
        <div className="animate-fade-in">
          {myRentals.length > 0 ? (
            <div className="space-y-6">
              {/* Active Rentals */}
              {activeRentals.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Active Rentals ({activeRentals.length})
                  </h3>
                  <div className="grid gap-4">
                    {activeRentals.map(rental => (
                      <RentalCard key={rental.id} rental={rental} userKey={userKey} demoMode={demoMode} onUpdate={loadAssets} />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Rentals */}
              {completedRentals.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                    Completed ({completedRentals.length})
                  </h3>
                  <div className="grid gap-4">
                    {completedRentals.map(rental => (
                      <RentalCard key={rental.id} rental={rental} userKey={userKey} demoMode={demoMode} onUpdate={loadAssets} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-700 flex items-center justify-center">
                <svg className="w-12 h-12 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                No rentals yet
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
                Browse the marketplace to find items to rent
              </p>
              <button type="button" onClick={() => setActiveTab('browse')} className="btn-secondary">
                Browse Items
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Asset Modal */}
      {showCreateModal && (
        <CreateAssetModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateAsset}
          categories={categories.filter(c => c.id !== 'all')}
          demoMode={demoMode}
          ownerKey={userKey}
        />
      )}
    </div>
  )
}
