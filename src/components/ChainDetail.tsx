import { useState } from 'react'
import AddStageModal from './AddStageModal'
import PaymentModal from './PaymentModal'

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
  stages: Stage[]
  status: 'draft' | 'active' | 'completed' | 'archived'
  totalStages: number
  completedStages: number
  totalPaymentsReceived: number
  createdAt: string
  updatedAt: string
}

interface ChainDetailProps {
  chain: Chain
  userKey: string
  demoMode?: boolean
  walletType?: 'handcash' | 'metanet' | 'generic'
  onBack: () => void
  onUpdate: (chain: Chain) => void
}

export default function ChainDetail({ chain, userKey, demoMode = false, walletType = 'generic', onBack, onUpdate }: ChainDetailProps) {
  const [showAddStage, setShowAddStage] = useState(false)
  const [payingStage, setPayingStage] = useState<Stage | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAddStage = async (stageData: { title: string; metadata: Record<string, any>; requiresPayment: boolean; rentAmount: number }) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/chains/${chain.chainId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stageData)
      })

      const result = await response.json()

      if (response.ok && result.chain) {
        onUpdate(result.chain)
        setShowAddStage(false)
      } else {
        alert(result.error || 'Failed to add stage')
      }
    } catch (error) {
      console.error('Add stage error:', error)
      alert('Failed to add stage')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (paymentData: { txid?: string; paidBy: string }) => {
    if (!payingStage) return

    setLoading(true)
    try {
      const response = await fetch(`/api/chains/${chain.chainId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: payingStage.id,
          paymentTxid: paymentData.txid,
          paidBy: paymentData.paidBy,
          walletType
        })
      })

      const result = await response.json()

      if (response.ok && result.chain) {
        onUpdate(result.chain)
        setPayingStage(null)
      } else {
        alert(result.error || 'Payment failed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const getStageStatusConfig = (status: Stage['status']) => {
    const configs = {
      pending: {
        bg: 'bg-surface-100 dark:bg-surface-800',
        text: 'text-surface-600 dark:text-surface-400',
        icon: '○',
        label: 'Pending'
      },
      active: {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-400',
        icon: '◐',
        label: 'Active'
      },
      paid: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        icon: '●',
        label: 'Paid'
      },
      completed: {
        bg: 'bg-primary-100 dark:bg-primary-900/30',
        text: 'text-primary-700 dark:text-primary-400',
        icon: '✓',
        label: 'Complete'
      }
    }
    return configs[status]
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Chains
      </button>

      {/* Chain Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white mb-2">
              {chain.title}
            </h1>
            {chain.description && (
              <p className="text-surface-600 dark:text-surface-400">{chain.description}</p>
            )}
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            chain.status === 'active' 
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
              : chain.status === 'completed'
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
          }`}>
            {chain.status.charAt(0).toUpperCase() + chain.status.slice(1)}
          </span>
        </div>

        {/* Chain Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{chain.totalStages}</p>
            <p className="text-sm text-surface-500 dark:text-surface-400">Total Stages</p>
          </div>
          <div className="text-center p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{chain.completedStages}</p>
            <p className="text-sm text-surface-500 dark:text-surface-400">Completed</p>
          </div>
          <div className="text-center p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">${chain.totalPaymentsReceived}</p>
            <p className="text-sm text-surface-500 dark:text-surface-400">Payments</p>
          </div>
          <div className="text-center p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
            <p className="text-2xl font-bold text-surface-900 dark:text-white">
              {chain.totalStages > 0 ? Math.round((chain.completedStages / chain.totalStages) * 100) : 0}%
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-400">Progress</p>
          </div>
        </div>

        {/* Chain ID */}
        <div className="mt-4 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Chain ID</p>
          <p className="text-sm font-mono text-surface-700 dark:text-surface-300 break-all">{chain.chainId}</p>
        </div>
      </div>

      {/* Stages Timeline */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">Stages</h2>
          <button
            onClick={() => setShowAddStage(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Stage
          </button>
        </div>

        {chain.stages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-surface-600 dark:text-surface-400 mb-4">No stages yet</p>
            <button
              onClick={() => setShowAddStage(true)}
              className="btn-secondary text-sm"
            >
              Add First Stage
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {chain.stages.map((stage, index) => {
              const statusConfig = getStageStatusConfig(stage.status)
              
              return (
                <div key={stage.id} className="relative">
                  {/* Timeline connector */}
                  {index < chain.stages.length - 1 && (
                    <div className="absolute left-6 top-14 w-0.5 h-[calc(100%-1rem)] bg-surface-200 dark:bg-surface-700" />
                  )}

                  <div className={`flex gap-4 p-4 rounded-xl border-2 transition-all ${
                    stage.requiresPayment && stage.status === 'active'
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10'
                      : 'border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/30'
                  }`}>
                    {/* Stage Number */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                      {stage.status === 'completed' || stage.status === 'paid' ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        stage.stageIndex + 1
                      )}
                    </div>

                    {/* Stage Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-surface-900 dark:text-white">{stage.title}</h3>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        {stage.requiresPayment && stage.status === 'active' && (
                          <button
                            onClick={() => setPayingStage(stage)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Pay ${stage.rentAmount}
                          </button>
                        )}
                      </div>

                      {/* Metadata */}
                      {Object.keys(stage.metadata).length > 0 && (
                        <div className="mb-2 p-2 bg-surface-100 dark:bg-surface-800 rounded-lg">
                          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Metadata</p>
                          <div className="text-sm text-surface-700 dark:text-surface-300 space-y-0.5">
                            {Object.entries(stage.metadata).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Payment Info */}
                      {stage.requiresPayment && (
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-surface-600 dark:text-surface-400">
                            Amount: <span className="font-medium text-surface-900 dark:text-white">${stage.rentAmount}</span>
                          </span>
                          {stage.paymentTxid && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Paid: {stage.paymentTxid.slice(0, 12)}...
                            </span>
                          )}
                        </div>
                      )}

                      {/* Overlay TXID */}
                      {stage.txid && (
                        <div className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                          <span className="font-medium">Overlay TX:</span>{' '}
                          <span className="font-mono">{stage.txid.slice(0, 20)}...</span>
                        </div>
                      )}

                      {/* Timestamp */}
                      {stage.timestamp && (
                        <div className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                          {new Date(stage.timestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Stage Modal */}
      {showAddStage && (
        <AddStageModal
          chainId={chain.chainId}
          stageIndex={chain.stages.length}
          onClose={() => setShowAddStage(false)}
          onAdd={handleAddStage}
          demoMode={demoMode}
          loading={loading}
        />
      )}

      {/* Payment Modal */}
      {payingStage && (
        <PaymentModal
          stage={payingStage}
          chainId={chain.chainId}
          walletType={walletType}
          demoMode={demoMode}
          onClose={() => setPayingStage(null)}
          onPay={handlePayment}
          loading={loading}
        />
      )}
    </div>
  )
}
