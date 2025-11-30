import { useState } from 'react'
import { getErrorMessage } from '@/lib/error-utils'

interface Asset {
  id: string
  tokenId: string
  name: string
  rentalRatePerDay: number
  depositAmount: number
  ownerKey: string
}

interface RentalDetails {
  pickupLocation: {
    address: string
    coordinates?: { lat: number; lng: number }
  }
  accessCode?: string
  ownerContact?: any
  specialInstructions?: string
}

interface EscrowModalProps {
  asset: Asset
  userKey: string
  rentalDetails: RentalDetails
  demoMode?: boolean
  onClose: () => void
  onSuccess: (rental?: any) => void
}

export default function EscrowModal({ asset, userKey, rentalDetails, demoMode = false, onClose, onSuccess }: EscrowModalProps) {
  const [step, setStep] = useState<'configure' | 'creating' | 'funding' | 'success' | 'error'>('configure')
  const [error, setError] = useState('')
  const [escrowId, setEscrowId] = useState('')
  const [escrowAddress, setEscrowAddress] = useState('')
  
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rentalDays, setRentalDays] = useState(1)

  const rentalFee = asset.rentalRatePerDay * rentalDays
  const depositAmount = asset.depositAmount
  const totalAmount = rentalFee + depositAmount

  function updateDates(start: string, end: string) {
    setStartDate(start)
    setEndDate(end)
    
    if (start && end) {
      const days = Math.ceil(
        (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
      )
      setRentalDays(Math.max(1, days))
    }
  }

  async function handleCreateEscrow() {
    if (!startDate || !endDate) {
      setError('Please select rental dates')
      return
    }

    if (demoMode) {
      handleDemoEscrow()
      return
    }

    setStep('creating')
    setError('')

    try {
      const { createAction } = await import('babbage-sdk')

      const response = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalTokenId: asset.tokenId,
          renterKey: userKey,
          ownerKey: asset.ownerKey,
          rentalPeriod: {
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString()
          },
          depositAmount: depositAmount,
          rentalFee: rentalFee
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create escrow contract')
      }

      const escrowData = await response.json()
      
      setEscrowId(escrowData.escrowId)
      setEscrowAddress(escrowData.escrowAddress)
      setStep('funding')

      const fundResult = await createAction({
        description: `Escrow deposit for ${asset.name} rental`,
        outputs: [
          {
            satoshis: Math.ceil(totalAmount * 100),
            script: escrowData.escrowScript,
            basket: 'Rental Escrows'
          }
        ]
      })

      const confirmResponse = await fetch('/api/escrow/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId: escrowData.escrowId,
          fundingTxid: fundResult.txid
        })
      })

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm escrow funding')
      }

      setStep('success')

    } catch (err) {
      console.error('Escrow creation error:', err)
      setError(getErrorMessage(err))
      setStep('error')
    }
  }

  async function handleDemoEscrow() {
    setStep('creating')
    
    try {
      // Create actual rental in demo mode too
      const response = await fetch('/api/rentals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: asset.id,
          renterKey: userKey,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          rentalDays,
          rentalFee,
          depositAmount,
          totalAmount
        })
      })

      const result = await response.json()
      
      if (response.ok && result.rental) {
        setEscrowId(result.rental.escrowId)
        setEscrowAddress('Demo_' + result.rental.id.slice(0, 10))
        setStep('funding')
        
        setTimeout(() => {
          setStep('success')
          // Pass the rental back to parent
          setTimeout(() => onSuccess(result.rental), 500)
        }, 1000)
      } else {
        throw new Error(result.error || 'Failed to create rental')
      }
    } catch (err) {
      console.error('Demo rental error:', err)
      // Fallback to simulated demo
      const demoEscrowId = 'demo_escrow_' + Date.now().toString(36)
      setEscrowId(demoEscrowId)
      setEscrowAddress('Demo_' + demoEscrowId.slice(0, 10))
      setStep('funding')
      
      setTimeout(() => {
        setStep('success')
      }, 1000)
    }
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aC0ydi00aDJ2NHptMC02di0yaC0ydjJoMnptLTYgMGgtMnYyaDJ2LTJ6bTAgNmgtMnY0aDJ2LTR6bS02LTZoLTJ2Mmgydi0yem0wIDZoLTJ2NGgydi00em0xMi0xMnYtMkgyNHYyaDEyem0wIDEydi0ySDI0djJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
          <div className="relative px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Confirm Rental</h2>
                  <p className="text-emerald-200 text-sm">
                    {demoMode ? 'Demo Mode - Simulated' : 'Review and confirm your rental'}
                  </p>
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
              <span className="text-sm font-medium">Demo Mode: No real payment will be made</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {step === 'configure' && (
            <div className="space-y-6">
              {/* Asset Summary */}
              <div className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200/50 dark:border-surface-700/50">
                <div className="w-14 h-14 bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-700 dark:to-surface-600 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-surface-500 dark:text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">{asset.name}</h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400">${asset.rentalRatePerDay}/day</p>
                </div>
              </div>

              {/* Pickup Location */}
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-xl">
                <h4 className="font-medium text-primary-900 dark:text-primary-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Pickup Location
                </h4>
                <p className="text-sm text-primary-800 dark:text-primary-400">{rentalDetails.pickupLocation.address}</p>
                {rentalDetails.accessCode && (
                  <p className="text-sm text-primary-800 dark:text-primary-400 mt-1">
                    <span className="font-medium">Access Code:</span> {rentalDetails.accessCode}
                  </p>
                )}
                {rentalDetails.specialInstructions && (
                  <p className="text-sm text-primary-700 dark:text-primary-500 mt-2 italic">
                    {rentalDetails.specialInstructions}
                  </p>
                )}
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={minDateStr}
                    onChange={(e) => updateDates(e.target.value, endDate)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || minDateStr}
                    onChange={(e) => updateDates(startDate, e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
                <div className="bg-surface-50 dark:bg-surface-800/50 px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                  <h4 className="font-medium text-surface-900 dark:text-white">Cost Breakdown</h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-600 dark:text-surface-400">
                      Rental Fee ({rentalDays} days x ${asset.rentalRatePerDay})
                    </span>
                    <span className="font-medium text-surface-900 dark:text-white">${rentalFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-600 dark:text-surface-400">Security Deposit (refundable)</span>
                    <span className="font-medium text-surface-900 dark:text-white">${depositAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-surface-200 dark:border-surface-700 pt-3 flex justify-between">
                    <span className="font-semibold text-surface-900 dark:text-white">Total to Escrow</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {demoMode ? '(Simulated) ' : ''}${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Escrow Info */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-amber-800 dark:text-amber-300">
                    <p className="font-medium mb-1.5">How It Works:</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-400">
                      <li>Your deposit is held securely during the rental</li>
                      <li>Both you and the owner confirm when done</li>
                      <li>Deposit returned automatically after completion</li>
                      <li>Support available if any issues arise</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              <button
                onClick={handleCreateEscrow}
                disabled={!startDate || !endDate}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-surface-300 disabled:to-surface-300 dark:disabled:from-surface-700 dark:disabled:to-surface-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:shadow-none hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {demoMode ? 'Simulate Rental' : `Confirm & Pay $${totalAmount.toFixed(2)}`}
              </button>
            </div>
          )}

          {step === 'creating' && (
            <div className="text-center py-8">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-emerald-200 dark:border-emerald-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                {demoMode ? 'Processing...' : 'Setting Up Rental'}
              </h3>
              <p className="text-surface-600 dark:text-surface-400">
                {demoMode ? 'Processing your rental...' : 'Securing your deposit...'}
              </p>
            </div>
          )}

          {step === 'funding' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                {demoMode ? 'Processing...' : 'Completing Payment'}
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-6">
                {demoMode ? 'Almost done...' : 'Please confirm the payment in your wallet...'}
              </p>
              {escrowAddress && (
                <div className="bg-surface-100 dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                  <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Rental ID {demoMode && '(Demo)'}</p>
                  <p className="text-sm font-mono text-surface-700 dark:text-surface-300 truncate">{escrowAddress}</p>
                </div>
              )}
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
                {demoMode ? 'Demo Rental Complete!' : 'Rental Confirmed!'}
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-6">
                {demoMode 
                  ? 'This is a simulated rental for demo purposes.'
                  : 'Your rental is confirmed! The item is now reserved for you.'
                }
              </p>
              
              <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 text-left mb-6 border border-surface-200/50 dark:border-surface-700/50">
                <h4 className="font-medium text-surface-900 dark:text-white mb-3">Rental Details</h4>
                <div className="space-y-2 text-sm">
                  <p className="flex items-start gap-2 text-surface-700 dark:text-surface-300">
                    <svg className="w-4 h-4 text-surface-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span><span className="font-medium">Pickup:</span> {rentalDetails.pickupLocation.address}</span>
                  </p>
                  <p className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                    <svg className="w-4 h-4 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span><span className="font-medium">Dates:</span> {startDate} to {endDate}</span>
                  </p>
                  <p className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                    <svg className="w-4 h-4 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="truncate"><span className="font-medium">Confirmation:</span> <span className="font-mono">{escrowId.slice(0, 20)}...</span></span>
                  </p>
                  {rentalDetails.accessCode && (
                    <p className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                      <svg className="w-4 h-4 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span><span className="font-medium">Access Code:</span> {rentalDetails.accessCode}</span>
                    </p>
                  )}
                </div>
              </div>

              {demoMode && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
                  This was a simulated rental for demo purposes.
                </p>
              )}

              <button
                onClick={onSuccess}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5"
              >
                Done
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">Escrow Failed</h3>
              <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
              <button
                onClick={() => setStep('configure')}
                className="btn-secondary"
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
