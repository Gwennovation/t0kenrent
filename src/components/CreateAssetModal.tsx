import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
  icon?: string
}

interface CreateAssetModalProps {
  onClose: () => void
  onCreate: (assetData: any) => void
  categories: Category[]
  demoMode?: boolean
  ownerKey?: string
}

// Demo sample data for quick fill
const demoSamples = [
  {
    name: 'Canon EOS R5 Camera Kit',
    description: 'Professional mirrorless camera with 45MP sensor. Includes 24-70mm lens, battery grip, and carrying case. Perfect for events and professional shoots.',
    category: 'photography',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
    rentalRatePerDay: '75',
    depositAmount: '500',
    city: 'San Francisco',
    state: 'CA',
    address: '123 Market Street, Suite 400',
    accessCode: 'CAM-2024',
    specialInstructions: 'Please return with battery fully charged. Handle with care.',
    accessories: ['24-70mm Lens', 'Battery Grip', 'Extra Battery', '128GB SD Card', 'Carrying Case']
  },
  {
    name: 'DJI Mavic 3 Pro Drone',
    description: 'Professional drone with Hasselblad camera. 4/3 CMOS sensor, 46-min flight time. FAA registered and ready to fly.',
    category: 'electronics',
    imageUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800',
    rentalRatePerDay: '95',
    depositAmount: '800',
    city: 'Los Angeles',
    state: 'CA',
    address: '456 Sunset Blvd',
    accessCode: 'DRONE-456',
    specialInstructions: 'Must have Part 107 certification to operate. Return with props intact.',
    accessories: ['3 Batteries', 'ND Filters', 'Carrying Case', 'Remote Controller']
  },
  {
    name: 'Milwaukee Power Tool Set',
    description: 'Complete 18V cordless tool set. Includes drill, impact driver, circular saw, and reciprocating saw. All M18 FUEL series.',
    category: 'tools',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800',
    rentalRatePerDay: '45',
    depositAmount: '350',
    city: 'Austin',
    state: 'TX',
    address: '789 Congress Ave',
    accessCode: 'TOOLS-789',
    specialInstructions: 'Tools should be wiped clean before return. Report any damage immediately.',
    accessories: ['4 Batteries', 'Charger', 'Bit Set', 'Tool Bag']
  }
]

export default function CreateAssetModal({ onClose, onCreate, categories, demoMode = false, ownerKey = '' }: CreateAssetModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showDemoOptions, setShowDemoOptions] = useState(demoMode)
  
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
    unlockFee: '0.0001',
    condition: 'excellent',
    accessories: [] as string[]
  })

  function fillDemoData(sampleIndex: number) {
    const sample = demoSamples[sampleIndex]
    setFormData({
      name: sample.name,
      description: sample.description,
      category: sample.category,
      imageUrl: sample.imageUrl,
      rentalRatePerDay: sample.rentalRatePerDay,
      depositAmount: sample.depositAmount,
      currency: 'USD',
      location: {
        city: sample.city,
        state: sample.state,
        address: sample.address
      },
      accessCode: sample.accessCode,
      specialInstructions: sample.specialInstructions,
      unlockFee: '0.0001',
      condition: 'excellent',
      accessories: sample.accessories
    })
    setShowDemoOptions(false)
    setStep(4) // Jump to review
  }

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

  const steps = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Pricing' },
    { num: 3, label: 'Location' },
    { num: 4, label: 'Review' }
  ]

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-scale-in border border-surface-200/50 dark:border-surface-700/50">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aC0ydi00aDJ2NHptMC02di0yaC0ydjJoMnptLTYgMGgtMnYyaDJ2LTJ6bTAgNmgtMnY0aDJ2LTR6bS02LTZoLTJ2Mmgydi0yem0wIDZoLTJ2NGgydi00em0xMi0xMnYtMkgyNHYyaDEyem0wIDEydi0ySDI0djJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
          <div className="relative px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">List New Asset</h2>
                <p className="text-primary-200 text-sm">Add your item to the marketplace</p>
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

        {/* Demo Quick Fill Options */}
        {showDemoOptions && demoMode && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50 px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Demo Mode: Quick Fill</span>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
              Select a sample listing to auto-fill the form and see the full experience:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {demoSamples.map((sample, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => fillDemoData(i)}
                  className="text-left p-3 bg-white dark:bg-surface-800 rounded-lg border border-amber-200 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
                >
                  <p className="font-medium text-sm text-surface-900 dark:text-white truncate">{sample.name}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">${sample.rentalRatePerDay}/day</p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowDemoOptions(false)}
              className="mt-3 text-sm text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200"
            >
              Or fill manually
            </button>
          </div>
        )}

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  step >= s.num
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
                }`}>
                  {step > s.num ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-12 sm:w-20 lg:w-24 h-1 mx-2 rounded-full transition-all duration-300 ${
                    step > s.num ? 'bg-primary-500' : 'bg-surface-200 dark:bg-surface-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs font-medium">
            {steps.map(s => (
              <span key={s.num} className={`${step >= s.num ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 dark:text-surface-400'}`}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Asset Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="e.g., Canon EOS R5 Camera"
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
                  placeholder="Describe your item, its features, and condition..."
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
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => updateFormData('imageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="input-field"
                />
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

          {/* Step 2: Pricing */}
          {step === 2 && (
            <div className="space-y-5">
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
                      placeholder="50.00"
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
                      placeholder="500.00"
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
                  placeholder="0.0001"
                  step="0.0001"
                  min="0.0001"
                  className="input-field"
                />
                <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                  Small fee renters pay to see your contact info and pickup location
                </p>
              </div>

              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-primary-800 dark:text-primary-300">
                    <p className="font-medium mb-1.5">Pricing Tips:</p>
                    <ul className="list-disc list-inside space-y-1 text-primary-700 dark:text-primary-400">
                      <li>Set deposit at ~10x daily rate for valuable items</li>
                      <li>Unlock fee filters out casual browsers</li>
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
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location.city}
                    onChange={(e) => updateLocation('city', e.target.value)}
                    placeholder="San Francisco"
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
                    placeholder="CA"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Pickup Address <span className="text-red-500">*</span>
                  <span className="text-xs text-surface-500 ml-1">(shown after unlock fee is paid)</span>
                </label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) => updateLocation('address', e.target.value)}
                  placeholder="123 Market St, Suite 100"
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
                  placeholder="e.g., CAMERA2024 or Apt #4B buzzer"
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
                  placeholder="e.g., Equipment is in the blue case. Return with battery charged."
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
                    placeholder="e.g., Battery, Charger, Memory Card"
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

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-6 space-y-4 border border-surface-200/50 dark:border-surface-700/50">
                <h3 className="font-semibold text-xl text-surface-900 dark:text-white">{formData.name}</h3>
                <p className="text-surface-600 dark:text-surface-400">{formData.description}</p>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Category</p>
                    <p className="font-medium text-surface-900 dark:text-white capitalize">{formData.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Condition</p>
                    <p className="font-medium text-surface-900 dark:text-white capitalize">{formData.condition}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Daily Rate</p>
                    <p className="font-medium text-primary-600 dark:text-primary-400">${formData.rentalRatePerDay}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Deposit</p>
                    <p className="font-medium text-surface-900 dark:text-white">${formData.depositAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Unlock Fee</p>
                    <p className="font-medium text-accent-600 dark:text-accent-400">{formData.unlockFee} BSV</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Location</p>
                    <p className="font-medium text-surface-900 dark:text-white">{formData.location.city}, {formData.location.state}</p>
                  </div>
                </div>

                {formData.accessories.length > 0 && (
                  <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-2">Accessories</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.accessories.map((acc, i) => (
                        <span key={i} className="px-3 py-1 bg-white dark:bg-surface-700 rounded-full text-sm text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-600">
                          {acc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Owner Wallet Info - Auto-filled */}
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary-800 dark:text-primary-300 mb-1">Owner Wallet (Auto-filled)</p>
                    <p className="font-mono text-xs text-primary-700 dark:text-primary-400 break-all">
                      {ownerKey || 'Not connected'}
                    </p>
                    <p className="text-xs text-primary-600 dark:text-primary-500 mt-1">
                      Rental payments will be sent to this address
                    </p>
                  </div>
                </div>
              </div>

              {/* Tokenization Info */}
              <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-accent-600 dark:text-accent-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div className="text-sm text-accent-800 dark:text-accent-300">
                    <p className="font-medium mb-1.5">Asset Tokenization (BRC-76)</p>
                    <ul className="list-disc list-inside space-y-1 text-accent-700 dark:text-accent-400 text-xs">
                      <li>A unique token ID will be generated for this asset</li>
                      <li>Token metadata stored on BSV blockchain</li>
                      <li>Ownership verifiable on-chain</li>
                      <li>HTTP 402 payment gating for rental details</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-emerald-800 dark:text-emerald-300">
                    <p className="font-medium mb-1">Ready to List!</p>
                    <p className="text-emerald-700 dark:text-emerald-400">
                      Your item will be tokenized and listed on the marketplace.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-200 dark:border-surface-700 flex justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="btn-ghost text-surface-600 dark:text-surface-400"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-surface-600 dark:text-surface-400"
            >
              Cancel
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !isStep1Valid) ||
                (step === 2 && !isStep2Valid) ||
                (step === 3 && !isStep3Valid)
              }
              className="btn-primary"
            >
              Continue
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-surface-300 disabled:to-surface-300 dark:disabled:from-surface-700 dark:disabled:to-surface-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg shadow-emerald-500/25 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Listing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Listing
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
