import { useState, useEffect } from 'react'

interface EscrowContract {
  escrowId: string
  assetName: string
  ownerKey: string
  renterKey: string
  totalAmount: number
  depositAmount: number
  rentalFee: number
  status: 'created' | 'funded' | 'active' | 'completed' | 'disputed' | 'expired'
  multisigScript?: string
  escrowAddress?: string
  fundingTxId?: string
  releaseTxId?: string
  createdAt: string
  signatures?: {
    ownerSigned: boolean
    renterSigned: boolean
  }
}

interface SmartContractStatusProps {
  escrowId: string
  userKey: string
  demoMode?: boolean
  onSign?: (signature: string) => void
  onClose?: () => void
}

export default function SmartContractStatus({ 
  escrowId, 
  userKey, 
  demoMode = false,
  onSign,
  onClose 
}: SmartContractStatusProps) {
  const [contract, setContract] = useState<EscrowContract | null>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadContractStatus()
  }, [escrowId])

  async function loadContractStatus() {
    setLoading(true)
    try {
      // In demo mode, simulate contract data
      if (demoMode || escrowId.startsWith('escrow_') || escrowId.startsWith('demo_')) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Generate mock contract data
        const mockContract: EscrowContract = {
          escrowId,
          assetName: 'Demo Asset',
          ownerKey: 'owner_' + Math.random().toString(36).substring(7),
          renterKey: userKey,
          totalAmount: 150.00,
          depositAmount: 100.00,
          rentalFee: 50.00,
          status: 'active',
          multisigScript: `OP_2 ${userKey.slice(0, 20)}... owner_key... OP_2 OP_CHECKMULTISIG`,
          escrowAddress: `3${escrowId.slice(0, 30)}...`,
          fundingTxId: `fund_${Date.now().toString(36)}`,
          createdAt: new Date().toISOString(),
          signatures: {
            ownerSigned: false,
            renterSigned: false
          }
        }
        setContract(mockContract)
      } else {
        // Real API call
        const response = await fetch(`/api/escrow/${escrowId}`)
        if (response.ok) {
          const data = await response.json()
          setContract(data.escrow)
        } else {
          throw new Error('Failed to load contract status')
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSign() {
    if (!contract) return
    
    setSigning(true)
    setError('')

    try {
      if (demoMode) {
        // Simulate signing
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Update local state
        setContract(prev => {
          if (!prev) return prev
          const isOwner = prev.ownerKey === userKey
          return {
            ...prev,
            signatures: {
              ownerSigned: isOwner ? true : prev.signatures?.ownerSigned || false,
              renterSigned: !isOwner ? true : prev.signatures?.renterSigned || false
            }
          }
        })
        
        const mockSignature = `sig_${Date.now().toString(36)}_${Math.random().toString(36).substring(7)}`
        onSign?.(mockSignature)
      } else {
        // Real signing via Babbage SDK
        const { createAction, createSignature } = await import('babbage-sdk')
        
        // Create signature for multisig
        const signature = await createSignature({
          data: Buffer.from(JSON.stringify({
            escrowId: contract.escrowId,
            action: 'release',
            timestamp: Date.now()
          }))
        })
        
        // Submit signature to API
        const response = await fetch('/api/escrow/release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            escrowId: contract.escrowId,
            signerKey: userKey,
            signature: signature.signature
          })
        })

        if (!response.ok) {
          throw new Error('Failed to submit signature')
        }

        const result = await response.json()
        setContract(prev => prev ? { ...prev, ...result } : null)
        onSign?.(signature.signature)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSigning(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
      case 'funded': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
      case 'active': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
      case 'completed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      case 'disputed': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      case 'expired': return 'bg-surface-200 dark:bg-surface-700 text-surface-500'
      default: return 'bg-surface-100 dark:bg-surface-800 text-surface-600'
    }
  }

  const isOwner = contract?.ownerKey === userKey
  const userSigned = isOwner ? contract?.signatures?.ownerSigned : contract?.signatures?.renterSigned
  const otherSigned = isOwner ? contract?.signatures?.renterSigned : contract?.signatures?.ownerSigned
  const bothSigned = contract?.signatures?.ownerSigned && contract?.signatures?.renterSigned

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="flex items-center justify-center py-8">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-primary-200 dark:border-primary-900 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="text-center text-surface-500 dark:text-surface-400">Loading contract status...</p>
      </div>
    )
  }

  if (error && !contract) {
    return (
      <div className="glass-card p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!contract) return null

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Smart Contract Status</h3>
              <p className="text-white/70 text-sm">2-of-2 Multisig Escrow</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Demo Badge */}
      {demoMode && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800/50 px-6 py-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">Demo Mode - Simulated Contract</span>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Contract Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-surface-500 dark:text-surface-400">Contract ID</span>
            <code className="text-sm font-mono bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
              {contract.escrowId.slice(0, 20)}...
            </code>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-surface-500 dark:text-surface-400">Status</span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(contract.status)}`}>
              {contract.status}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-surface-500 dark:text-surface-400">Asset</span>
            <span className="text-sm font-medium text-surface-900 dark:text-white">{contract.assetName}</span>
          </div>
        </div>

        {/* Amounts */}
        <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 space-y-3">
          <h4 className="font-medium text-surface-900 dark:text-white mb-3">Escrow Amounts</h4>
          <div className="flex justify-between text-sm">
            <span className="text-surface-500 dark:text-surface-400">Rental Fee</span>
            <span className="font-medium text-surface-900 dark:text-white">${contract.rentalFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-surface-500 dark:text-surface-400">Security Deposit</span>
            <span className="font-medium text-surface-900 dark:text-white">${contract.depositAmount.toFixed(2)}</span>
          </div>
          <div className="border-t border-surface-200 dark:border-surface-700 pt-3 flex justify-between">
            <span className="font-semibold text-surface-900 dark:text-white">Total Escrowed</span>
            <span className="font-bold text-primary-600 dark:text-primary-400">${contract.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Multisig Script */}
        {contract.multisigScript && (
          <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4">
            <h4 className="font-medium text-surface-900 dark:text-white mb-2">2-of-2 Multisig Script</h4>
            <code className="text-xs font-mono text-surface-600 dark:text-surface-400 break-all block bg-surface-100 dark:bg-surface-900 p-3 rounded-lg">
              {contract.multisigScript}
            </code>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
              Requires both owner and renter signatures to release funds
            </p>
          </div>
        )}

        {/* Signature Status */}
        <div className="space-y-4">
          <h4 className="font-medium text-surface-900 dark:text-white">Signature Status</h4>
          
          {/* Owner Signature */}
          <div className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                contract.signatures?.ownerSigned 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                  : 'bg-surface-200 dark:bg-surface-700'
              }`}>
                {contract.signatures?.ownerSigned ? (
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900 dark:text-white">
                  Owner {isOwner && '(You)'}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {contract.signatures?.ownerSigned ? 'Signed' : 'Pending signature'}
                </p>
              </div>
            </div>
            {isOwner && !contract.signatures?.ownerSigned && contract.status === 'active' && (
              <button
                onClick={handleSign}
                disabled={signing}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {signing ? 'Signing...' : 'Sign'}
              </button>
            )}
          </div>

          {/* Renter Signature */}
          <div className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                contract.signatures?.renterSigned 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                  : 'bg-surface-200 dark:bg-surface-700'
              }`}>
                {contract.signatures?.renterSigned ? (
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900 dark:text-white">
                  Renter {!isOwner && '(You)'}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {contract.signatures?.renterSigned ? 'Signed' : 'Pending signature'}
                </p>
              </div>
            </div>
            {!isOwner && !contract.signatures?.renterSigned && contract.status === 'active' && (
              <button
                onClick={handleSign}
                disabled={signing}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {signing ? 'Signing...' : 'Sign'}
              </button>
            )}
          </div>
        </div>

        {/* Both Signed - Success */}
        {bothSigned && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-emerald-800 dark:text-emerald-300">Escrow Release Ready</h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  Both parties have signed. Deposit will be released to the renter.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Links */}
        {(contract.fundingTxId || contract.releaseTxId) && (
          <div className="space-y-2">
            <h4 className="font-medium text-surface-900 dark:text-white">Transaction History</h4>
            {contract.fundingTxId && (
              <a
                href={`https://whatsonchain.com/tx/${contract.fundingTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors"
              >
                <span className="text-sm text-surface-600 dark:text-surface-400">Funding TX</span>
                <span className="flex items-center gap-1 text-sm font-mono text-primary-600 dark:text-primary-400">
                  {contract.fundingTxId.slice(0, 12)}...
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
              </a>
            )}
            {contract.releaseTxId && (
              <a
                href={`https://whatsonchain.com/tx/${contract.releaseTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors"
              >
                <span className="text-sm text-surface-600 dark:text-surface-400">Release TX</span>
                <span className="flex items-center gap-1 text-sm font-mono text-primary-600 dark:text-primary-400">
                  {contract.releaseTxId.slice(0, 12)}...
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
              </a>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
