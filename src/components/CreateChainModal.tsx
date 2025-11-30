import { useState } from 'react'

interface CreateChainModalProps {
  onClose: () => void
  onCreate: (data: { title: string; description: string }) => void
  demoMode?: boolean
}

export default function CreateChainModal({ onClose, onCreate, demoMode = false }: CreateChainModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  // Demo quick-fill options
  const demoTemplates = [
    {
      title: 'Camera Rental Chain',
      description: 'Track the rental lifecycle of professional camera equipment'
    },
    {
      title: 'Power Tool Lending',
      description: 'Manage tool lending from listing to return'
    },
    {
      title: 'Event Equipment Rental',
      description: 'Track projector and audio equipment rentals'
    }
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('Please enter a chain title')
      return
    }

    setCreating(true)
    try {
      await onCreate({ title: title.trim(), description: description.trim() })
    } finally {
      setCreating(false)
    }
  }

  function fillTemplate(template: typeof demoTemplates[0]) {
    setTitle(template.title)
    setDescription(template.description)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-lg animate-scale-in">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-600" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aC0ydi00aDJ2NHptMC02di0yaC0ydjJoMnptLTYgMGgtMnYyaDJ2LTJ6bTAgNmgtMnY0aDJ2LTR6bS02LTZoLTJ2Mmgydi0yem0wIDZoLTJ2NGgydi00em0xMi0xMnYtMkgyNHYyaDEyem0wIDEydi0ySDI0djJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
          <div className="relative px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Create Supply Chain</h2>
                  <p className="text-white/70 text-sm">Track rental lifecycle on BSV</p>
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

        {/* Demo Mode Banner */}
        {demoMode && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800/50 px-6 py-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Demo Mode: Chain stored locally</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Demo Templates */}
          {demoMode && (
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Quick Fill Templates
              </label>
              <div className="grid grid-cols-1 gap-2">
                {demoTemplates.map((template, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => fillTemplate(template)}
                    className="text-left px-4 py-3 bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl transition-colors"
                  >
                    <p className="font-medium text-surface-900 dark:text-white text-sm">{template.title}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Chain Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Camera Equipment Rental"
              className="input-field"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the rental chain purpose..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          {/* Info */}
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-xl">
            <h4 className="font-medium text-primary-900 dark:text-primary-300 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What happens next?
            </h4>
            <ul className="text-sm text-primary-800 dark:text-primary-400 space-y-1 list-disc list-inside">
              <li>Chain ID will be auto-generated</li>
              <li>You can add stages to track the rental lifecycle</li>
              <li>Each stage can be stored on the BSV overlay network</li>
              <li>Payment stages can collect MNEE via wallet</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Chain
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
