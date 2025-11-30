import { useState, useEffect, useCallback } from 'react'
import ChainCard from './ChainCard'
import CreateChainModal from './CreateChainModal'
import ChainDetail from './ChainDetail'

interface Stage {
  id: string
  stageIndex: number
  title: string
  metadata: Record<string, any>
  requiresPayment: boolean
  rentAmount?: number
  txid?: string
  timestamp?: string
  status: 'pending' | 'active' | 'paid' | 'completed'
  paymentTxid?: string
  paidAt?: string
  paidBy?: string
}

interface Chain {
  chainId: string
  title: string
  description?: string
  ownerKey: string
  ownerName?: string
  stages: Stage[]
  status: 'draft' | 'active' | 'completed' | 'archived'
  totalStages: number
  completedStages: number
  totalPaymentsReceived: number
  createdAt: string
  updatedAt: string
}

interface ChainDashboardProps {
  userKey: string
  demoMode?: boolean
  walletType?: 'handcash' | 'metanet' | 'generic'
}

export default function ChainDashboard({ userKey, demoMode = false, walletType = 'generic' }: ChainDashboardProps) {
  const [chains, setChains] = useState<Chain[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all')
  const [successMessage, setSuccessMessage] = useState('')
  const [pollingEnabled, setPollingEnabled] = useState(true)

  const loadChains = useCallback(async () => {
    try {
      const response = await fetch(`/api/chains/list?ownerKey=${userKey}`)
      if (response.ok) {
        const data = await response.json()
        setChains(data.chains || [])
      }
    } catch (error) {
      console.error('Failed to load chains:', error)
    } finally {
      setLoading(false)
    }
  }, [userKey])

  useEffect(() => {
    loadChains()
  }, [loadChains])

  // Real-time polling for updates
  useEffect(() => {
    if (!pollingEnabled || !selectedChain) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/chains/${selectedChain.chainId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.chain) {
            setSelectedChain(data.chain)
            // Update in chains list too
            setChains(prev => prev.map(c => 
              c.chainId === data.chain.chainId ? data.chain : c
            ))
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [pollingEnabled, selectedChain])

  const handleCreateChain = async (chainData: { title: string; description: string }) => {
    try {
      const response = await fetch('/api/chains/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...chainData,
          ownerKey: userKey,
          ownerName: demoMode ? 'Demo User' : undefined
        })
      })

      const result = await response.json()

      if (response.ok && result.chain) {
        setChains(prev => [result.chain, ...prev])
        setShowCreateModal(false)
        setSuccessMessage(`Chain "${result.chain.title}" created successfully!`)
        setTimeout(() => setSuccessMessage(''), 5000)
        // Automatically open the new chain
        setSelectedChain(result.chain)
      } else {
        alert(result.error || 'Failed to create chain')
      }
    } catch (error) {
      console.error('Create chain error:', error)
      alert('Failed to create chain')
    }
  }

  const handleChainUpdate = (updatedChain: Chain) => {
    setSelectedChain(updatedChain)
    setChains(prev => prev.map(c => 
      c.chainId === updatedChain.chainId ? updatedChain : c
    ))
  }

  const filteredChains = chains.filter(chain => {
    if (activeTab === 'all') return true
    if (activeTab === 'active') return chain.status === 'active' || chain.status === 'draft'
    if (activeTab === 'completed') return chain.status === 'completed'
    return true
  })

  if (selectedChain) {
    return (
      <ChainDetail
        chain={selectedChain}
        userKey={userKey}
        demoMode={demoMode}
        walletType={walletType}
        onBack={() => setSelectedChain(null)}
        onUpdate={handleChainUpdate}
      />
    )
  }

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

      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-2">
              Supply Chains
            </h1>
            <p className="text-surface-600 dark:text-surface-400 text-lg">
              Track rental lifecycles on the BSV blockchain
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Chain
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-slide-up animation-delay-100">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{chains.length}</p>
          <p className="text-sm text-surface-600 dark:text-surface-400">Total Chains</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {chains.filter(c => c.status === 'active').length}
          </p>
          <p className="text-sm text-surface-600 dark:text-surface-400">Active</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {chains.reduce((sum, c) => sum + c.totalStages, 0)}
          </p>
          <p className="text-sm text-surface-600 dark:text-surface-400">Total Stages</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-surface-900 dark:text-white">
            ${chains.reduce((sum, c) => sum + c.totalPaymentsReceived, 0).toFixed(0)}
          </p>
          <p className="text-sm text-surface-600 dark:text-surface-400">Payments Received</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 animate-slide-up animation-delay-150">
        <div className="tab-list w-fit">
          {[
            { id: 'all', label: 'All Chains', count: chains.length },
            { id: 'active', label: 'Active', count: chains.filter(c => c.status === 'active' || c.status === 'draft').length },
            { id: 'completed', label: 'Completed', count: chains.filter(c => c.status === 'completed').length }
          ].map(tab => (
            <button
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

      {/* Polling Toggle */}
      <div className="flex items-center justify-end mb-4">
        <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 cursor-pointer">
          <input
            type="checkbox"
            checked={pollingEnabled}
            onChange={(e) => setPollingEnabled(e.target.checked)}
            className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
          />
          Real-time updates (3s)
        </label>
      </div>

      {/* Chain List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 dark:border-primary-900 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-surface-600 dark:text-surface-400">Loading chains...</p>
        </div>
      ) : filteredChains.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChains.map((chain, index) => (
            <div 
              key={chain.chainId}
              className="animate-slide-up"
              style={{ animationDelay: `${Math.min(index, 5) * 50 + 100}ms` }}
            >
              <ChainCard
                chain={chain}
                onClick={() => setSelectedChain(chain)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state animate-slide-up animation-delay-200">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-700 flex items-center justify-center">
            <svg className="w-12 h-12 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
            No chains yet
          </h3>
          <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
            Create your first supply chain to track rental lifecycles on BSV
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Create Your First Chain
          </button>
        </div>
      )}

      {/* Create Chain Modal */}
      {showCreateModal && (
        <CreateChainModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateChain}
          demoMode={demoMode}
        />
      )}
    </div>
  )
}
