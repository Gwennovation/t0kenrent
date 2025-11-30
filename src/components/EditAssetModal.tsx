import { useState, useEffect } from 'react'
import Portal from './Portal'

interface Category {
  id: string
  name: string
  icon?: string
}

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
  rentalDetails?: {
    pickupLocation?: {
      address: string
    }
    accessCode?: string
    specialInstructions?: string
  }
  status: 'available' | 'rented' | 'pending'
  rating?: number
  unlockFee: number
  ownerKey: string
  condition?: string
  accessories?: string[]
  totalRentals?: number
  totalEarnings?: number
}

interface EditAssetModalProps {
  asset: Asset
  onClose: () => void
  onSave: (updatedAsset: Partial<Asset>) => void
  categories: Category[]
  demoMode?: boolean
}

export default function EditAssetModal({ asset, onClose, onSave, categories, demoMode = false }: EditAssetModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'location'>('basic')
  
  const [formData, setFormData] = useState({
    name: asset.name || '',
    description: asset.description || '',
    category: asset.category || '',
    imageUrl: asset.imageUrl || '',
    rentalRatePerDay: asset.rentalRatePerDay?.toString() || '',
    depositAmount: asset.depositAmount?.toString() || '',
    currency: asset.currency || 'USD',
    location: {
      city: asset.location?.city || '',
      state: asset.location?.state || '',
      address: asset.rentalDetails?.pickupLocation?.address || ''
    },
    accessCode: asset.rentalDetails?.accessCode || '',
    specialInstructions: asset.rentalDetails?.specialInstructions || '',
    unlockFee: asset.unlockFee?.toString() || '0.0001',
    condition: asset.condition || 'excellent',
    accessories: asset.accessories || [],
    status: asset.status || 'available'
  })

  const [newAccessory, setNewAccessory] = useState('')

  function updateFormData(field: string, value: any) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  function updateLocation(field: string, value: string) {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }))
  }

  function addAccessory() {
    if (newAccessory.trim()) {
      setFormData(prev => ({
        ...prev,
        accessories: [...prev.accessories, newAccessory.trim()]
      }))
      setNewAccessory('')
    }
  }

  function removeAccessory(index: number) {
    setFormData(prev => ({
      ...prev,
      accessories: prev.accessories.filter((_, i) => i !== index)
    }))
  }

  async function handleSave() {
    setLoading(true)
    try {
      await onSave({
        id: asset.id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        imageUrl: formData.imageUrl,
        rentalRatePerDay: parseFloat(formData.rentalRatePerDay),
        depositAmount: parseFloat(formData.depositAmount),
        currency: formData.currency,
        location: {
          city: formData.location.city,
          state: formData.location.state
        },
        rentalDetails: {
          pickupLocation: {
            address: formData.location.address
          },
          accessCode: formData.accessCode,
          specialInstructions: formData.specialInstructions
        },
        unlockFee: parseFloat(formData.unlockFee),
        condition: formData.condition,
        accessories: formData.accessories,
        status: formData.status as 'available' | 'rented' | 'pending'
      })
    } catch (error) {
      console.error('Failed to save asset:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'pricing', label: 'Pricing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'location', label: 'Location & Details', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' }
  ]

  return (
    <Portal>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-content max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
          {/* Header */}
          <div className="relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-600" />
            <div className="relative px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Edit Listing</h2>
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

          {/* Demo Mode Banner */}
          {demoMode && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800/50 px-6 py-3 flex-shrink-0">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Demo Mode: Changes are stored locally</span>
              </div>
            </div>
          )}

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
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Asset Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => updateFormData('category', e.target.value)}
                      className="input-field appearance-none pr-10"
                    >
                      <option value="">Select a category</option>
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => updateFormData('imageUrl', e.target.value)}
                    className="input-field"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Status
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['available', 'pending', 'rented'].map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateFormData('status', status)}
                        className={`py-2.5 px-4 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
                          formData.status === status
                            ? status === 'available' 
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                              : status === 'pending'
                              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                              : 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                            : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Condition
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['excellent', 'good', 'fair'].map(condition => (
                      <button
                        key={condition}
                        type="button"
                        onClick={() => updateFormData('condition', condition)}
                        className={`py-2.5 px-4 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
                          formData.condition === condition
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                            : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700'
                        }`}
                      >
                        {condition}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Daily Rental Rate <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-500 font-medium">$</span>
                      <input
                        type="number"
                        value={formData.rentalRatePerDay}
                        onChange={(e) => updateFormData('rentalRatePerDay', e.target.value)}
                        min="1"
                        className="input-field pl-8"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Security Deposit <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-500 font-medium">$</span>
                      <input
                        type="number"
                        value={formData.depositAmount}
                        onChange={(e) => updateFormData('depositAmount', e.target.value)}
                        min="0"
                        className="input-field pl-8"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Unlock Fee (BSV)
                  </label>
                  <input
                    type="number"
                    value={formData.unlockFee}
                    onChange={(e) => updateFormData('unlockFee', e.target.value)}
                    step="0.0001"
                    min="0.0001"
                    className="input-field"
                  />
                  <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                    Small fee renters pay to see your contact info and pickup location (~${(parseFloat(formData.unlockFee || '0') * 50).toFixed(4)} USD)
                  </p>
                </div>

                {/* Earnings Summary */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-emerald-800 dark:text-emerald-300">
                      <p className="font-medium mb-1.5">Listing Performance</p>
                      <div className="grid grid-cols-2 gap-4 text-emerald-700 dark:text-emerald-400">
                        <div>
                          <span className="text-2xl font-bold">{asset.totalRentals || 0}</span>
                          <p className="text-xs">Total Rentals</p>
                        </div>
                        <div>
                          <span className="text-2xl font-bold">${asset.totalEarnings?.toFixed(0) || 0}</span>
                          <p className="text-xs">Total Earnings</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={(e) => updateLocation('city', e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location.state}
                      onChange={(e) => updateLocation('state', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Pickup Address
                    <span className="text-xs text-surface-500 ml-1">(shown after unlock fee is paid)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={(e) => updateLocation('address', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Access Code
                    <span className="text-xs text-surface-500 ml-1">(shown after unlock fee is paid)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.accessCode}
                    onChange={(e) => updateFormData('accessCode', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => updateFormData('specialInstructions', e.target.value)}
                    rows={2}
                    className="input-field resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Included Accessories
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newAccessory}
                      onChange={(e) => setNewAccessory(e.target.value)}
                      placeholder="Add an accessory..."
                      className="input-field flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAccessory())}
                    />
                    <button
                      type="button"
                      onClick={addAccessory}
                      className="btn-secondary px-4"
                    >
                      Add
                    </button>
                  </div>
                  {formData.accessories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.accessories.map((acc, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-100 dark:bg-surface-800 rounded-full text-sm text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700"
                        >
                          {acc}
                          <button
                            type="button"
                            onClick={() => removeAccessory(i)}
                            className="text-surface-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-200 dark:border-surface-700 flex justify-between flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-surface-600 dark:text-surface-400"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !formData.name || !formData.description || !formData.category}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
