import { useState } from 'react'

interface AddStageModalProps {
  chainId: string
  stageIndex: number
  onClose: () => void
  onAdd: (data: { title: string; metadata: Record<string, any>; requiresPayment: boolean; rentAmount: number }) => void
  demoMode?: boolean
  loading?: boolean
}

export default function AddStageModal({ chainId, stageIndex, onClose, onAdd, demoMode = false, loading = false }: AddStageModalProps) {
  const [title, setTitle] = useState('')
  const [requiresPayment, setRequiresPayment] = useState(false)
  const [rentAmount, setRentAmount] = useState(0)
  const [metadataKey, setMetadataKey] = useState('')
  const [metadataValue, setMetadataValue] = useState('')
  const [metadata, setMetadata] = useState<Record<string, string>>({})

  // Predefined stage templates
  const stageTemplates = [
    { title: 'Item Listed', metadata: { status: 'Listed for rent' } },
    { title: 'Rental Approved', metadata: { status: 'Approved by owner' } },
    { title: 'Payment Required', metadata: { status: 'Awaiting payment' }, requiresPayment: true, amount: 50 },
    { title: 'Item Picked Up', metadata: { status: 'In possession of renter' } },
    { title: 'Item Returned', metadata: { status: 'Returned to owner' } },
    { title: 'Deposit Released', metadata: { status: 'Transaction complete' } }
  ]

  function addMetadataField() {
    if (metadataKey.trim() && metadataValue.trim()) {
      setMetadata(prev => ({ ...prev, [metadataKey]: metadataValue }))
      setMetadataKey('')
      setMetadataValue('')
    }
  }

  function removeMetadataField(key: string) {
    setMetadata(prev => {
      const { [key]: _, ...rest } = prev
      return rest
    })
  }

  function applyTemplate(template: typeof stageTemplates[0]) {
    setTitle(template.title)
    setMetadata(template.metadata)
    if ('requiresPayment' in template) {
      setRequiresPayment(true)
      setRentAmount((template as any).amount || 50)
    } else {
      setRequiresPayment(false)
      setRentAmount(0)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('Please enter a stage title')
      return
    }

    onAdd({
      title: title.trim(),
      metadata,
      requiresPayment,
      rentAmount: requiresPayment ? rentAmount : 0
    })
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-500 to-accent-700" />
          <div className="relative px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold">
                  {stageIndex + 1}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Add Stage</h2>
                  <p className="text-white/70 text-sm">Stage #{stageIndex + 1} in chain</p>
                </div>
              </div>
              <button
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Templates */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {stageTemplates.map((template, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    'requiresPayment' in template
                      ? 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                      : 'border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
                  }`}
                >
                  {template.title}
                  {'requiresPayment' in template && ' ($)'}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Stage Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Item Listed, Payment Received"
              className="input-field"
              required
            />
          </div>

          {/* Payment Toggle */}
          <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
            <div>
              <p className="font-medium text-surface-900 dark:text-white">Requires Payment</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">Enable MNEE payment for this stage</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requiresPayment}
                onChange={(e) => setRequiresPayment(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-300 dark:bg-surface-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          {/* Payment Amount */}
          {requiresPayment && (
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Payment Amount (USD)
              </label>
              <input
                type="number"
                value={rentAmount}
                onChange={(e) => setRentAmount(Number(e.target.value))}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
          )}

          {/* Metadata */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Metadata
            </label>
            
            {/* Existing metadata */}
            {Object.keys(metadata).length > 0 && (
              <div className="space-y-2 mb-3">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-surface-100 dark:bg-surface-800 rounded-lg">
                    <span className="flex-1 text-sm">
                      <span className="font-medium text-surface-700 dark:text-surface-300">{key}:</span>{' '}
                      <span className="text-surface-600 dark:text-surface-400">{value}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMetadataField(key)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new metadata */}
            <div className="flex gap-2">
              <input
                type="text"
                value={metadataKey}
                onChange={(e) => setMetadataKey(e.target.value)}
                placeholder="Key"
                className="input-field flex-1"
              />
              <input
                type="text"
                value={metadataValue}
                onChange={(e) => setMetadataValue(e.target.value)}
                placeholder="Value"
                className="input-field flex-1"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMetadataField())}
              />
              <button
                type="button"
                onClick={addMetadataField}
                className="btn-secondary px-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-xl">
            <h4 className="font-medium text-primary-900 dark:text-primary-300 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Stored on BSV Overlay
            </h4>
            <p className="text-sm text-primary-800 dark:text-primary-400">
              This stage will be recorded on the BSV overlay network with a unique transaction ID for permanent proof.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Stage
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
