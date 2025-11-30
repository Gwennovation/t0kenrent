import { useState } from 'react'

interface Category {
  id: string
  name: string
}

interface CreateAssetModalProps {
  onClose: () => void
  onCreate: (assetData: any) => void
  categories: Category[]
}

export default function CreateAssetModal({ onClose, onCreate, categories }: CreateAssetModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    imageUrl: '',
    rentalRatePerDay: '',
    depositAmount: '',
    currency: 'USD',
    location: {
      city: '',
      state: '',
      address: ''
    },
    accessCode: '',
    specialInstructions: '',
    unlockFee: '0.0001', // Default HTTP 402 micropayment
    condition: 'excellent',
    accessories: [] as string[]
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

  async function handleSubmit() {
    setLoading(true)
    try {
      await onCreate({
        ...formData,
        rentalRatePerDay: parseFloat(formData.rentalRatePerDay),
        depositAmount: parseFloat(formData.depositAmount),
        unlockFee: parseFloat(formData.unlockFee)
      })
    } catch (error) {
      console.error('Failed to create asset:', error)
    } finally {
      setLoading(false)
    }
  }

  const isStep1Valid = formData.name && formData.description && formData.category
  const isStep2Valid = formData.rentalRatePerDay && formData.depositAmount
  const isStep3Valid = formData.location.city && formData.location.state && formData.location.address

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">List New Asset</h2>
              <p className="text-primary-200 text-sm">Create a BRC-76 token for your rentable item</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-primary-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  step >= s
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 4 && (
                  <div className={`w-16 md:w-24 h-1 mx-2 ${
                    step > s ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Basic Info</span>
            <span>Pricing</span>
            <span>Location</span>
            <span>Review</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="e.g., Canon EOS R5 Camera"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Describe your item, its features, and condition..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateFormData('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => updateFormData('imageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => updateFormData('condition', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Pricing */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Rental Rate *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.rentalRatePerDay}
                      onChange={(e) => updateFormData('rentalRatePerDay', e.target.value)}
                      placeholder="50.00"
                      min="1"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Deposit *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.depositAmount}
                      onChange={(e) => updateFormData('depositAmount', e.target.value)}
                      placeholder="500.00"
                      min="0"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTTP 402 Unlock Fee (BSV)
                </label>
                <input
                  type="number"
                  value={formData.unlockFee}
                  onChange={(e) => updateFormData('unlockFee', e.target.value)}
                  placeholder="0.0001"
                  step="0.0001"
                  min="0.0001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Micropayment renters pay to view detailed rental info (location, access codes)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Pricing Tips:</p>
                    <ul className="list-disc list-inside mt-1 text-blue-700">
                      <li>Set deposit at ~10x daily rate for valuable items</li>
                      <li>HTTP 402 fee prevents spam inquiries</li>
                      <li>Competitive pricing attracts more renters</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.location.city}
                    onChange={(e) => updateLocation('city', e.target.value)}
                    placeholder="San Francisco"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.location.state}
                    onChange={(e) => updateLocation('state', e.target.value)}
                    placeholder="CA"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Address * (shown after HTTP 402 payment)
                </label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) => updateLocation('address', e.target.value)}
                  placeholder="123 Market St, Suite 100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Code (shown after HTTP 402 payment)
                </label>
                <input
                  type="text"
                  value={formData.accessCode}
                  onChange={(e) => updateFormData('accessCode', e.target.value)}
                  placeholder="e.g., CAMERA2024 or Apt #4B buzzer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={formData.specialInstructions}
                  onChange={(e) => updateFormData('specialInstructions', e.target.value)}
                  placeholder="e.g., Equipment is in the blue case. Return with battery charged."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Included Accessories
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newAccessory}
                    onChange={(e) => setNewAccessory(e.target.value)}
                    placeholder="e.g., Battery, Charger, Memory Card"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    onKeyPress={(e) => e.key === 'Enter' && addAccessory()}
                  />
                  <button
                    onClick={addAccessory}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                  >
                    Add
                  </button>
                </div>
                {formData.accessories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.accessories.map((acc, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-2"
                      >
                        {acc}
                        <button
                          onClick={() => removeAccessory(i)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-lg text-gray-900">{formData.name}</h3>
                <p className="text-gray-600">{formData.description}</p>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium text-gray-900 capitalize">{formData.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Condition</p>
                    <p className="font-medium text-gray-900 capitalize">{formData.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Daily Rate</p>
                    <p className="font-medium text-gray-900">${formData.rentalRatePerDay}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Deposit</p>
                    <p className="font-medium text-gray-900">${formData.depositAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">HTTP 402 Fee</p>
                    <p className="font-medium text-gray-900">{formData.unlockFee} BSV</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{formData.location.city}, {formData.location.state}</p>
                  </div>
                </div>

                {formData.accessories.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Accessories</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.accessories.map((acc, i) => (
                        <span key={i} className="px-3 py-1 bg-white rounded-full text-sm border">
                          {acc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Ready to List!</p>
                    <p className="text-green-700">
                      A BRC-76 compliant token will be minted on the BSV blockchain representing your asset.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !isStep1Valid) ||
                (step === 2 && !isStep2Valid) ||
                (step === 3 && !isStep3Valid)
              }
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Minting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mint Token & List
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
