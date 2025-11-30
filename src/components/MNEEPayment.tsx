import { useState } from 'react'
import { rentService } from '@/lib/rentService'

interface MNEEPaymentProps {
  recipientKey: string
  amount: number
  description: string
  chainId: string
  stageId: string
  onSuccess: (txid: string) => void
  onError?: (error: string) => void
}

export default function MNEEPayment({
  recipientKey,
  amount,
  description,
  chainId,
  stageId,
  onSuccess,
  onError
}: MNEEPaymentProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePayment() {
    setLoading(true)
    setError('')

    try {
      // Process rent payment
      const payment = await rentService.processRentPayment(
        recipientKey,
        amount,
        description,
        chainId,
        stageId
      )

      // Call success callback
      onSuccess(payment.txid)
    } catch (err: any) {
      const errorMsg = err.message || 'Payment failed'
      setError(errorMsg)
      
      if (onError) {
        onError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Rent Payment</h3>
        <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
          {amount} MNEE
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Amount:</span>
          <span className="font-medium text-gray-900">{amount} MNEE</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Description:</span>
          <span className="font-medium text-gray-900">{description}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Recipient:</span>
          <span className="font-mono text-xs text-gray-700">
            {recipientKey.substring(0, 12)}...
          </span>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Payment...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Pay Rent
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Payment will be recorded on the BSV blockchain
      </p>
    </div>
  )
}
