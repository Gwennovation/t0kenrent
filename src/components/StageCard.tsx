import { useState } from 'react'
import MNEEPayment from './MNEEPayment'

interface Stage {
  id: string
  title: string
  imageUrl?: string
  metadata: Record<string, any>
  requiresPayment?: boolean
  rentAmount?: number
  ownerKey?: string
  duration?: number
  expiresAt?: Date
  payment?: {
    txid: string
    amount: number
    status: string
    timestamp: Date
  }
  transactionId?: string
}

interface StageCardProps {
  stage: Stage
  chainId: string
  stageIndex: number
  onPaymentComplete: (stageId: string, txid: string) => void
}

export default function StageCard({
  stage,
  chainId,
  stageIndex,
  onPaymentComplete
}: StageCardProps) {
  const [showPayment, setShowPayment] = useState(false)
  const [paid, setPaid] = useState(!!stage.payment && stage.payment.status === 'verified')

  function handlePaymentSuccess(txid: string) {
    setPaid(true)
    setShowPayment(false)
    onPaymentComplete(stage.id, txid)
  }

  function getDaysUntilExpiration(): number | null {
    if (!stage.expiresAt) return null
    
    const now = new Date()
    const expires = new Date(stage.expiresAt)
    const diff = expires.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const daysLeft = getDaysUntilExpiration()
  const isExpired = daysLeft !== null && daysLeft < 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Stage Image */}
      {stage.imageUrl && (
        <div className="h-48 bg-gray-100 relative">
          <img
            src={stage.imageUrl}
            alt={stage.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
            Stage {stageIndex + 1}
          </div>
        </div>
      )}

      {/* Stage Content */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {stage.title}
          </h3>
          
          {stage.transactionId && (
            <a
              href={`https://whatsonchain.com/tx/${stage.transactionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:text-primary-700 font-mono"
            >
              TX: {stage.transactionId.substring(0, 16)}...
            </a>
          )}
        </div>

        {/* Metadata */}
        {Object.keys(stage.metadata).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Details:</h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              {Object.entries(stage.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">{key}:</span>
                  <span className="text-gray-900">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rent Information */}
        {stage.requiresPayment && (
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Rent Required:</span>
                <p className="text-2xl font-bold text-primary-600">{stage.rentAmount} MNEE</p>
              </div>
              
              {daysLeft !== null && !isExpired && (
                <div className="text-right">
                  <span className="text-xs text-gray-600">Expires in:</span>
                  <p className="text-lg font-semibold text-gray-900">{daysLeft} days</p>
                </div>
              )}
            </div>

            {isExpired && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-700 font-medium">⚠️ Rent Expired</p>
              </div>
            )}

            {/* Payment Status */}
            {paid ? (
              <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-800">Rent Paid</span>
                {stage.payment && (
                  <a
                    href={`https://whatsonchain.com/tx/${stage.payment.txid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs text-green-700 hover:text-green-800 underline"
                  >
                    View TX
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {!showPayment ? (
                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Pay Rent
                  </button>
                ) : (
                  <div className="space-y-2">
                    <MNEEPayment
                      recipientKey={stage.ownerKey!}
                      amount={stage.rentAmount!}
                      description={`Rent for ${stage.title}`}
                      chainId={chainId}
                      stageId={stage.id}
                      onSuccess={handlePaymentSuccess}
                    />
                    <button
                      onClick={() => setShowPayment(false)}
                      className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* No Rent Required */}
        {!stage.requiresPayment && (
          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700">✓ No payment required for this stage</p>
          </div>
        )}
      </div>
    </div>
  )
}
