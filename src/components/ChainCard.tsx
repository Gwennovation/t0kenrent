interface Stage {
  id: string
  stageIndex: number
  title: string
  status: 'pending' | 'active' | 'paid' | 'completed'
  requiresPayment: boolean
  rentAmount?: number
  txid?: string
}

interface Chain {
  chainId: string
  title: string
  description?: string
  stages: Stage[]
  status: 'draft' | 'active' | 'completed' | 'archived'
  totalStages: number
  completedStages: number
  totalPaymentsReceived: number
  createdAt: string
  updatedAt: string
}

interface ChainCardProps {
  chain: Chain
  onClick: () => void
}

export default function ChainCard({ chain, onClick }: ChainCardProps) {
  const statusConfig = {
    draft: {
      bg: 'bg-surface-100 dark:bg-surface-800',
      text: 'text-surface-600 dark:text-surface-400',
      border: 'border-surface-200 dark:border-surface-700',
      label: 'Draft'
    },
    active: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      label: 'Active'
    },
    completed: {
      bg: 'bg-primary-100 dark:bg-primary-900/30',
      text: 'text-primary-700 dark:text-primary-400',
      border: 'border-primary-200 dark:border-primary-800',
      label: 'Completed'
    },
    archived: {
      bg: 'bg-surface-100 dark:bg-surface-800',
      text: 'text-surface-500 dark:text-surface-500',
      border: 'border-surface-200 dark:border-surface-700',
      label: 'Archived'
    }
  }

  const status = statusConfig[chain.status]
  const completionPercentage = chain.totalStages > 0 
    ? Math.round((chain.completedStages / chain.totalStages) * 100) 
    : 0

  const pendingPayments = chain.stages.filter(s => s.requiresPayment && s.status === 'active').length

  return (
    <div 
      onClick={onClick}
      className="glass-card-hover p-5 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {chain.title}
          </h3>
          {chain.description && (
            <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-1 mt-0.5">
              {chain.description}
            </p>
          )}
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}>
          {status.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-surface-600 dark:text-surface-400">Progress</span>
          <span className="font-medium text-surface-900 dark:text-white">
            {chain.completedStages}/{chain.totalStages} stages
          </span>
        </div>
        <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
          <p className="text-lg font-bold text-surface-900 dark:text-white">{chain.totalStages}</p>
          <p className="text-xs text-surface-500 dark:text-surface-400">Stages</p>
        </div>
        <div className="text-center p-2 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{completionPercentage}%</p>
          <p className="text-xs text-surface-500 dark:text-surface-400">Complete</p>
        </div>
        <div className="text-center p-2 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
          <p className="text-lg font-bold text-primary-600 dark:text-primary-400">${chain.totalPaymentsReceived}</p>
          <p className="text-xs text-surface-500 dark:text-surface-400">Received</p>
        </div>
      </div>

      {/* Pending Payments Alert */}
      {pendingPayments > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
            {pendingPayments} payment{pendingPayments > 1 ? 's' : ''} pending
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-200/50 dark:border-surface-700/50">
        <span className="text-xs text-surface-500 dark:text-surface-400">
          ID: {chain.chainId.slice(0, 15)}...
        </span>
        <span className="text-xs text-surface-500 dark:text-surface-400">
          {new Date(chain.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}
