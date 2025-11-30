import { useState } from 'react'
import { createAction } from 'babbage-sdk'
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
    coordinates?: [number, number]
  }
  accessCode?: string
  ownerContact?: any
}

interface EscrowModalProps {
  asset: Asset
  userKey: string
  rentalDetails: RentalDetails
  onClose: () => void
  onSuccess: () => void
}

export default function EscrowModal({ asset, userKey, rentalDetails, onClose, onSuccess }: EscrowModalProps) {
  const [step, setStep] = useState<'configure' | 'creating' | 'funding' | 'success' | 'error'>('configure')
  const [error, setError] = useState('')
  const [escrowId, setEscrowId] = useState('')
  const [escrowAddress, setEscrowAddress] = useState('')
  
  // Rental configuration
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rentalDays, setRentalDays] = useState(1)

  // Calculate costs
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

    setStep('creating')
    setError('')

    try {
      // Step 1: Create escrow contract on server
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

      // Step 2: Fund the escrow with BSV transaction
      const fundResult = await createAction({
        description: `Escrow deposit for ${asset.name} rental`,
        outputs: [
          {
            satoshis: Math.ceil(totalAmount * 100), // Convert USD to satoshis (simplified)
            script: escrowData.escrowScript,
            basket: 'Rental Escrows'
          }
        ]
      })

      // Step 3: Confirm escrow funding
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

  // Get min date (tomorrow)
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Create Escrow</h2>
                <p className="text-green-200 text-sm">Secure your rental deposit</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'configure' && (
            <div className="space-y-6">
              {/* Asset Summary */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                  📷
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                  <p className="text-sm text-gray-600">${asset.rentalRatePerDay}/day</p>
                </div>
              </div>

              {/* Pickup Location */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Pickup Location</h4>
                <p className="text-sm text-blue-800">{rentalDetails.pickupLocation.address}</p>
                {rentalDetails.accessCode && (
                  <p className="text-sm text-blue-800 mt-1">
                    <strong>Access Code:</strong> {rentalDetails.accessCode}
                  </p>
                )}
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={minDateStr}
                    onChange={(e) => updateDates(e.target.value, endDate)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || minDateStr}
                    onChange={(e) => updateDates(startDate, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3">
                  <h4 className="font-medium text-gray-900">Cost Breakdown</h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Rental Fee ({rentalDays} days x ${asset.rentalRatePerDay})
                    </span>
                    <span className="font-medium text-gray-900">${rentalFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Security Deposit (refundable)</span>
                    <span className="font-medium text-gray-900">${depositAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900">Total to Escrow</span>
                    <span className="font-bold text-green-600">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Escrow Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">How Escrow Works:</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-700">
                      <li>Funds locked in 2-of-2 multisig smart contract</li>
                      <li>Both parties must co-sign to release</li>
                      <li>Deposit returned upon successful completion</li>
                      <li>Dispute resolution available via arbitrator</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                onClick={handleCreateEscrow}
                disabled={!startDate || !endDate}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Create Escrow & Fund ${totalAmount.toFixed(2)}
              </button>
            </div>
          )}

          {step === 'creating' && (
            <div className="text-center py-8">
              <div className="animate-spin w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Escrow</h3>
              <p className="text-gray-600">Generating smart contract...</p>
            </div>
          )}

          {step === 'funding' && (
            <div className="text-center py-8">
              <div className="animate-pulse w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Funding Escrow</h3>
              <p className="text-gray-600 mb-4">Please confirm the transaction in your wallet...</p>
              {escrowAddress && (
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Escrow Address</p>
                  <p className="text-sm font-mono text-gray-700 truncate">{escrowAddress}</p>
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Rental Confirmed!</h3>
              <p className="text-gray-600 mb-4">
                Your escrow has been created and funded. The asset is now reserved for you.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 text-left mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Rental Details</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Pickup:</strong> {rentalDetails.pickupLocation.address}</p>
                  <p><strong>Dates:</strong> {startDate} to {endDate}</p>
                  <p><strong>Escrow ID:</strong> <span className="font-mono">{escrowId.slice(0, 16)}...</span></p>
                </div>
              </div>

              <button
                onClick={onSuccess}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Escrow Failed</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => setStep('configure')}
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
