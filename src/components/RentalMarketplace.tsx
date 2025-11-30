import { useState, useEffect } from 'react'
import AssetCard from './AssetCard'
import CreateAssetModal from './CreateAssetModal'
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
  unlockFee: number // HTTP 402 micropayment amount
  createdAt: Date
}

interface RentalMarketplaceProps {
  userKey: string
  demoMode?: boolean
}

export default function RentalMarketplace({ userKey, demoMode = false }: RentalMarketplaceProps) {
  const [assets, setAssets] = useState<RentalAsset[]>([])
  const [myAssets, setMyAssets] = useState<RentalAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'browse' | 'myAssets' | 'myRentals'>('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'photography', name: 'Photography' },
    { id: 'tools', name: 'Tools & Equipment' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'sports', name: 'Sports & Outdoors' },
    { id: 'vehicles', name: 'Vehicles' },
    { id: 'other', name: 'Other' }
  ]

  useEffect(() => {
    loadAssets()
  }, [])

  async function loadAssets() {
    setLoading(true)
    try {
      // Load marketplace assets
      const response = await fetch('/api/assets/list')
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets || [])
      }

      // Load user's own assets
      const myResponse = await fetch(`/api/assets/my?owner=${userKey}`)
      if (myResponse.ok) {
        const myData = await myResponse.json()
        setMyAssets(myData.assets || [])
      }
    } catch (error) {
      console.error('Failed to load assets:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAsset(assetData: Partial<RentalAsset>) {
    try {
      const response = await fetch('/api/assets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...assetData,
          ownerKey: userKey
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create asset')
      }

      const result = await response.json()
      
      // Add to my assets
      setMyAssets(prev => [...prev, result.asset])
      setShowCreateModal(false)
      
      alert('Asset created successfully! Token ID: ' + result.tokenId)
    } catch (error) {
      alert('Failed to create asset: ' + getErrorMessage(error))
    }
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Marketplace Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rental Marketplace</h1>
          <p className="text-gray-600 mt-1">Discover and rent tokenized assets</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          List New Asset
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'browse'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Browse Marketplace
        </button>
        <button
          onClick={() => setActiveTab('myAssets')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'myAssets'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Listed Assets
        </button>
        <button
          onClick={() => setActiveTab('myRentals')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'myRentals'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Rentals
        </button>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <>
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Asset Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredAssets.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssets.map(asset => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  userKey={userKey}
                  demoMode={demoMode}
                  onRent={() => loadAssets()}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-xl">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No assets found</h3>
              <p className="text-gray-600">Be the first to list an asset on the marketplace!</p>
            </div>
          )}
        </>
      )}

      {/* My Assets Tab */}
      {activeTab === 'myAssets' && (
        <div>
          {myAssets.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myAssets.map(asset => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  userKey={userKey}
                  isOwner={true}
                  demoMode={demoMode}
                  onRent={() => loadAssets()}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-xl">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No assets listed</h3>
              <p className="text-gray-600 mb-4">Start earning by listing your first asset</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                List Your First Asset
              </button>
            </div>
          )}
        </div>
      )}

      {/* My Rentals Tab */}
      {activeTab === 'myRentals' && (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No active rentals</h3>
          <p className="text-gray-600">Browse the marketplace to find assets to rent</p>
        </div>
      )}

      {/* Create Asset Modal */}
      {showCreateModal && (
        <CreateAssetModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateAsset}
          categories={categories.filter(c => c.id !== 'all')}
        />
      )}
    </div>
  )
}
