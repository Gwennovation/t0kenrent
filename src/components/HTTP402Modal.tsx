import { useState } from 'react'
import { getErrorMessage } from '@/lib/error-utils'
import { getWhatsonchainExplorerBase } from '@/lib/bsv-network'
import Portal from './Portal'

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
  walletType?: 'handcash' | 'metanet' | 'paymail' | 'demo'
  onClose: () => void
  onSuccess: (details: any) => void
}

// Simulated BSV price for conversion display
const BSV_PRICE_USD = 50
const WOC_EXPLORER_BASE = getWhatsonchainExplorerBase()

export default function HTTP402Modal({ asset, userKey, demoMode = false, walletType = 'demo', onClose, onSuccess }: HTTP402ModalProps) {
  const [step, setStep] = useState<'info' | 'wallet_prompt' | 'paying' | 'verifying' | 'success' | 'error'>('info')
  const [error, setError] = useState('')
  const [txid, setTxid] = useState('')
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const isDemoExperience = demoMode || walletType === 'demo'

  async function handlePayment() {
    if (isDemoExperience) {
      handleDemoPayment()
      return
    }

    setStep('paying')
    setError('')

    try {
      // Initialize payment request
      const initResponse = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: asset.tokenId,
          resourceType: 'rental_details',
          userKey,
          walletType
        })
      })

      if (initResponse.status !== 402) {
        throw new Error('Unexpected response from payment initiation')
      }

      const paymentInfo = await initResponse.json()
      let txid = ''

      // Handle payment based on wallet type
      if (walletType === 'handcash') {
        // HandCash payment via API
        const handcashToken = sessionStorage.getItem('handcash_token')
        if (!handcashToken) {
          throw new Error('HandCash session expired. Please reconnect your wallet.')
        }

        const payResponse = await fetch('/api/payment/handcash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: handcashToken,
            amount: asset.unlockFee,
            destination: asset.ownerKey,
            description: `T0kenRent: ${asset.name.substring(0, 12)}`,
            paymentReference: paymentInfo.payment.reference
          })
        })

        if (!payResponse.ok) {
          const err = await payResponse.json()
          throw new Error(err.error || 'HandCash payment failed')
        }

        const payResult = await payResponse.json()
        txid = payResult.transactionId

      } else if (walletType === 'metanet') {
        // MetaNet/Babbage payment via SDK
        const { createAction } = await import('babbage-sdk')

        const result = await createAction({
          description: `T0kenRent unlock: ${asset.name.substring(0, 8)}`,
          outputs: [
            {
              satoshis: Math.ceil(asset.unlockFee * 100000000),
              script: paymentInfo.payment.script || await createPaymentScript(asset.ownerKey),
              basket: 'HTTP 402 Payments'
            }
          ]
        })
        txid = result.txid

      } else if (walletType === 'paymail') {
        // Paymail - show QR code or redirect to wallet
        // For now, use the generic payment flow
        throw new Error('Please scan the QR code with your BSV wallet to complete payment')
      } else {
        throw new Error('Unknown wallet type')
      }

      setTxid(txid)
      setStep('verifying')

      // Verify payment
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentReference: paymentInfo.payment.reference,
          transactionId: txid,
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
      onSuccess(verifyResult.rentalDetails)

    } catch (err) {
      console.error('HTTP 402 payment error:', err)
      setError(getErrorMessage(err))
      setStep('error')
    }
  }

  function handleDemoPayment() {
    // First show wallet prompt simulation
    setStep('wallet_prompt')
    
    // Set payment details for display
    setPaymentDetails({
      amount: asset.unlockFee,
      amountUSD: (asset.unlockFee * BSV_PRICE_USD).toFixed(4),
      recipient: asset.ownerKey.slice(0, 10) + '...' + asset.ownerKey.slice(-6),
      description: `T0kenRent: ${asset.name.substring(0, 12)}`
    })
    
    // Simulate wallet approval delay
    setTimeout(() => {
      setStep('paying')
      
      setTimeout(() => {
        const mockTxid = 'demo_tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(7)
        setTxid(mockTxid)
        setStep('verifying')
        
        setTimeout(() => {
          setStep('success')
          
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
            specialInstructions: 'This is a demo - no real rental has been created. In production, this would contain actual pickup instructions.',
            paymentTxId: mockTxid,
            paidAt: new Date().toISOString()
          }
          
          onSuccess(mockRentalDetails)
        }, 1200)
      }, 1500)
    }, 1000)
  }

  async function createPaymentScript(recipientKey: string): Promise<string> {
    const { P2PKH } = await import('@bsv/sdk')
    const p2pkh = new P2PKH()
    return (p2pkh as any).lock?.(recipientKey)?.toHex() || ''
  }

  return (
    <Portal>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-content max-w-md">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-500 to-accent-700 dark:from-accent-600 dark:to-accent-800" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aC0ydi00aDJ2NHptMC02di0yaC0ydjJoMnptLTYgMGgtMnYyaDJ2LTJ6bTAgNmgtMnY0aDJ2LTR6bS02LTZoLTJ2Mmgydi0yem0wIDZoLTJ2NGgydi00em0xMi0xMnYtMkgyNHYyaDEyem0wIDEydi0ySDI0djJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
          <div className="relative px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">HTTP 402 Payment</h2>
                  <p className="text-accent-200 text-sm">
                    {isDemoExperience ? 'Demo Mode - Simulated' : 'Pay to unlock rental details'}
                  </p>
                </div>
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

        {/* Demo Mode Banner */}
        {isDemoExperience && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800/50 px-6 py-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
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
              {/* Demo Mode Banner */}
              {isDemoExperience && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        🎭 Demo Mode - Simulated Payment
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        This payment will be <strong>simulated for testing</strong>. No real BSV transaction will occur. 
                        The flow demonstrates HTTP 402 micropayments without requiring actual funds.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent-100 to-accent-200 dark:from-accent-900/50 dark:to-accent-800/50 rounded-2xl mb-4">
                  <svg className="w-8 h-8 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                  Unlock {asset.name}
                </h3>
                <p className="text-surface-600 dark:text-surface-400">
                  {isDemoExperience
                    ? 'Click below to simulate the HTTP 402 payment flow and view rental details.'
                    : 'Pay a small micropayment to access detailed rental information including pickup location and access codes.'
                  }
                </p>
              </div>

              <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 space-y-3 border border-surface-200/50 dark:border-surface-700/50">
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">Asset</span>
                  <span className="font-medium text-surface-900 dark:text-white">{asset.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">Unlock Fee</span>
                  <span className="font-bold text-accent-600 dark:text-accent-400">
                    {isDemoExperience ? '(Simulated) ' : ''}{asset.unlockFee} BSV
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500 dark:text-surface-500">Approx. USD</span>
                  <span className="text-surface-500 dark:text-surface-500">~${(asset.unlockFee * 50).toFixed(4)}</span>
                </div>
              </div>

              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-primary-800 dark:text-primary-300">
                    <p className="font-medium mb-1.5">What you'll get:</p>
                    <ul className="list-disc list-inside space-y-1 text-primary-700 dark:text-primary-400">
                      <li>Exact pickup location & address</li>
                      <li>Access codes or key information</li>
                      <li>Owner contact details</li>
                      <li>Special instructions</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePayment}
                className={`w-full flex items-center justify-center gap-2 ${
                  isDemoExperience
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25'
                    : 'btn-accent'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {isDemoExperience
                  ? '🎭 Simulate Payment (Demo)' 
                  : `Pay with ${walletType === 'handcash' ? 'HandCash' : walletType === 'metanet' ? 'MetaNet' : 'Paymail'}`
                }
              </button>

              {/* Wallet indicator */}
              {!isDemoExperience && (
                <p className="text-xs text-center text-surface-500 dark:text-surface-400 mt-2">
                  Using: <span className="font-medium">{walletType === 'handcash' ? 'HandCash' : walletType === 'metanet' ? 'MetaNet/Babbage' : 'Paymail/QR'}</span>
                </p>
              )}
            </div>
          )}

          {/* Wallet Prompt Step */}
          {step === 'wallet_prompt' && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                <svg className="w-10 h-10 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                402 Payment Required
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-6">
                Waiting for wallet approval...
              </p>
              
              {paymentDetails && (
                <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 text-left space-y-3 border border-surface-200/50 dark:border-surface-700/50">
                  <div className="flex justify-between">
                    <span className="text-sm text-surface-500 dark:text-surface-400">Amount</span>
                    <span className="text-sm font-semibold text-surface-900 dark:text-white">
                      {paymentDetails.amount} BSV (~${paymentDetails.amountUSD})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-surface-500 dark:text-surface-400">To</span>
                    <span className="text-sm font-mono text-surface-700 dark:text-surface-300">
                      {paymentDetails.recipient}
                    </span>
                  </div>
                  <div className="border-t border-surface-200 dark:border-surface-700 pt-3">
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {paymentDetails.description}
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-4 flex items-center justify-center gap-1">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isDemoExperience ? 'Simulating wallet popup...' : 'Check your wallet...'}
              </p>
            </div>
          )}

          {step === 'paying' && (
            <div className="text-center py-8">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-accent-200 dark:border-accent-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                {isDemoExperience ? 'Simulating Payment' : 'Broadcasting Transaction'}
              </h3>
              <p className="text-surface-600 dark:text-surface-400">
                {isDemoExperience ? 'Processing...' : 'Sending payment to BSV network...'}
              </p>
            </div>
          )}

          {step === 'verifying' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-accent-100 to-accent-200 dark:from-accent-900/50 dark:to-accent-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                <svg className="w-10 h-10 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">Verifying Payment</h3>
              <p className="text-surface-600 dark:text-surface-400 mb-6">
                {isDemoExperience ? 'Verifying...' : 'Verifying your payment...'}
              </p>
              <div className="bg-surface-100 dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Transaction ID {isDemoExperience && '(Demo)'}</p>
                <p className="text-sm font-mono text-surface-700 dark:text-surface-300 truncate">{txid}</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                {isDemoExperience ? '🎭 Demo Payment Complete!' : 'Payment Verified On-Chain!'}
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {isDemoExperience 
                  ? 'Payment simulated successfully. Rental details have been unlocked.'
                  : 'Rental details have been unlocked.'
                }
              </p>
              
              {isDemoExperience && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <strong>Demo Mode:</strong> No real transaction occurred. This demonstrates the HTTP 402 payment flow.
                  </p>
                </div>
              )}
              
              {/* Transaction Details */}
              <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 text-left mb-4 border border-surface-200/50 dark:border-surface-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Transaction Confirmed</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500 dark:text-surface-400">Amount Paid</span>
                    <span className="font-medium text-surface-900 dark:text-white">{asset.unlockFee} BSV</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500 dark:text-surface-400">Status</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Confirmed</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                  <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Transaction ID {isDemoExperience && '(Demo)'}</p>
                  <p className="text-xs font-mono text-surface-700 dark:text-surface-300 break-all">{txid}</p>
                </div>
              </div>
              
              <a
                href={`${WOC_EXPLORER_BASE}/tx/${txid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on WhatsOnChain (Blockchain Explorer)
              </a>
              
              {isDemoExperience && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                  Demo mode: This was a simulated payment for demonstration.
                </p>
              )}
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">Payment Failed</h3>
              <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
              <button
                type="button"
                onClick={() => setStep('info')}
                className="btn-secondary"
              >
                Try Again
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </Portal>
  )
}
