import { useState } from 'react'
import { getErrorMessage } from '@/lib/error-utils'

interface Asset {
  id: string
  tokenId: string
  name: string
  unlockFee: number
  ownerKey: string
}

interface HTTP402ModalProps {
  asset: Asset
  userKey: string
  demoMode?: boolean
  onClose: () => void
  onSuccess: (details: any) => void
}

export default function HTTP402Modal({ asset, userKey, demoMode = false, onClose, onSuccess }: HTTP402ModalProps) {
  const [step, setStep] = useState<'info' | 'paying' | 'verifying' | 'success' | 'error'>('info')
  const [error, setError] = useState('')
  const [txid, setTxid] = useState('')

  async function handlePayment() {
    if (demoMode) {
      // Demo mode - simulate payment without real transaction
      handleDemoPayment()
      return
    }

    setStep('paying')
    setError('')

    try {
      // Dynamic import for babbage-sdk (only when not in demo mode)
      const { createAction } = await import('babbage-sdk')

      // Step 1: Initiate HTTP 402 payment request
      const initResponse = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: asset.tokenId,
          resourceType: 'rental_details'
        })
      })

      if (initResponse.status !== 402) {
        throw new Error('Unexpected response from payment initiation')
      }

      const paymentDetails = await initResponse.json()

      // Step 2: Create BSV micropayment transaction
      const result = await createAction({
        description: `HTTP 402 payment to unlock ${asset.name} rental details`,
        outputs: [
          {
            satoshis: Math.ceil(asset.unlockFee * 100000000), // Convert BSV to satoshis
            script: paymentDetails.payment.script || await createPaymentScript(asset.ownerKey),
            basket: 'HTTP 402 Payments'
          }
        ]
      })

      setTxid(result.txid)
      setStep('verifying')

      // Step 3: Submit payment for verification
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentReference: paymentDetails.payment.reference,
          transactionId: result.txid,
          amount: asset.unlockFee,
          resourceId: asset.tokenId
        })
      })

      if (!verifyResponse.ok) {
        throw new Error('Payment verification failed')
      }

      const verifyResult = await verifyResponse.json()

      if (verifyResult.status !== 'verified') {
        throw new Error(verifyResult.message || 'Payment not verified')
      }

      setStep('success')

      // Return the unlocked rental details
      onSuccess(verifyResult.rentalDetails)

    } catch (err) {
      console.error('HTTP 402 payment error:', err)
      setError(getErrorMessage(err))
      setStep('error')
    }
  }

  function handleDemoPayment() {
    // Simulate the payment flow in demo mode
    setStep('paying')
    
    // Simulate processing time
    setTimeout(() => {
      setTxid('demo_tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(7))
      setStep('verifying')
      
      // Simulate verification time
      setTimeout(() => {
        setStep('success')
        
        // Return mock rental details
        const mockRentalDetails = {
          pickupLocation: {
            address: '123 Demo Street, San Francisco, CA 94102',
            coordinates: { lat: 37.7749, lng: -122.4194 }
          },
          accessCode: 'DEMO-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
          ownerContact: {
            name: 'Demo Owner',
            phone: '(555) 123-4567',
            email: 'demo@t0kenrent.com'
          },
          specialInstructions: 'This is a demo - no real rental has been created. In production, this would contain actual pickup instructions.'
        }
        
        onSuccess(mockRentalDetails)
      }, 1000)
    }, 1500)
  }

  async function createPaymentScript(recipientKey: string): Promise<string> {
    // Create a simple P2PKH script for the payment
    const { P2PKH } = await import('@bsv/sdk')
    const p2pkh = new P2PKH()
    return (p2pkh as any).lock?.(recipientKey)?.toHex() || ''
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">HTTP 402 Payment</h2>
                <p className="text-purple-200 text-sm">
                  {demoMode ? 'Demo Mode - Simulated' : 'Pay to unlock rental details'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Demo Mode Banner */}
        {demoMode && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Demo Mode: No real payment will be made</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {step === 'info' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Unlock {asset.name}
                </h3>
                <p className="text-gray-600">
                  {demoMode 
                    ? 'Click below to simulate the HTTP 402 payment flow and view rental details.'
                    : 'Pay a small micropayment to access detailed rental information including pickup location and access codes.'
                  }
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Asset</span>
                  <span className="font-medium text-gray-900">{asset.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unlock Fee</span>
                  <span className="font-bold text-purple-600">
                    {demoMode ? '(Simulated) ' : ''}{asset.unlockFee} BSV
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Approx. USD</span>
                  <span className="text-gray-500">${(asset.unlockFee * 50).toFixed(4)}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">What you'll get:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Exact pickup location & address</li>
                      <li>Access codes or key information</li>
                      <li>Owner contact details</li>
                      <li>Special instructions</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {demoMode ? 'Simulate Payment' : `Pay ${asset.unlockFee} BSV`}
              </button>
            </div>
          )}

          {step === 'paying' && (
            <div className="text-center py-8">
              <div className="animate-spin w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {demoMode ? 'Simulating Payment' : 'Processing Payment'}
              </h3>
              <p className="text-gray-600">
                {demoMode ? 'Simulating BSV transaction...' : 'Creating BSV transaction...'}
              </p>
            </div>
          )}

          {step === 'verifying' && (
            <div className="text-center py-8">
              <div className="animate-pulse w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verifying Payment</h3>
              <p className="text-gray-600 mb-4">
                {demoMode ? 'Simulating verification...' : 'Confirming transaction on BSV network...'}
              </p>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500">Transaction ID {demoMode && '(Demo)'}</p>
                <p className="text-sm font-mono text-gray-700 truncate">{txid}</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {demoMode ? 'Demo Payment Complete!' : 'Payment Successful!'}
              </h3>
              <p className="text-gray-600 mb-4">Rental details have been unlocked.</p>
              {!demoMode && (
                <a
                  href={`https://whatsonchain.com/tx/${txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  View transaction on WhatsOnChain
                </a>
              )}
              {demoMode && (
                <p className="text-sm text-yellow-600">
                  This was a simulated payment for demo purposes.
                </p>
              )}
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => setStep('info')}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
