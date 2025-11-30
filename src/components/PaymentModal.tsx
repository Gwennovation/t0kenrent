import { useState } from 'react'

interface Stage {
  id: string
  title: string
  rentAmount?: number
  status: string
}

interface PaymentModalProps {
  stage: Stage
  chainId: string
  walletType: 'handcash' | 'metanet' | 'paymail' | 'demo'
  demoMode?: boolean
  onClose: () => void
  onPay: (data: { txid?: string; paidBy: string }) => void
  loading?: boolean
}

export default function PaymentModal({ stage, chainId, walletType, demoMode = false, onClose, onPay, loading = false }: PaymentModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<'handcash' | 'metanet' | 'paymail' | 'demo'>(walletType === 'demo' ? 'handcash' : walletType)
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState<'select' | 'processing' | 'success'>('select')
  const [txid, setTxid] = useState('')

  const wallets = [
    {
      id: 'handcash' as const,
      name: 'HandCash',
      description: 'Pay with HandCash wallet',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      id: 'metanet' as const,
      name: 'MetaNet (Babbage)',
      description: 'Pay with MetaNet wallet',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'paymail' as const,
      name: 'Paymail / QR Code',
      description: 'Pay via paymail or scan QR',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600'
    }
  ]

  async function handlePayment() {
    setProcessing(true)
    setStep('processing')

    try {
      if (demoMode) {
        // Simulate payment in demo mode
        await new Promise(resolve => setTimeout(resolve, 1500))
        const mockTxid = `demo_pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
        setTxid(mockTxid)
        setStep('success')
        
        // Auto-complete after showing success
        setTimeout(() => {
          onPay({ txid: mockTxid, paidBy: 'demo_user' })
        }, 1000)
        return
      }

      // Real payment flow based on wallet type
      let paymentTxid = ''
      
      if (selectedWallet === 'handcash') {
        // HandCash payment flow
        // In production, this would use the HandCash Connect API
        paymentTxid = await simulateHandCashPayment(stage.rentAmount || 0)
      } else if (selectedWallet === 'metanet') {
        // MetaNet/Babbage payment flow
        paymentTxid = await simulateMetaNetPayment(stage.rentAmount || 0)
      } else {
        // Generic QR code payment
        paymentTxid = await simulateGenericPayment(stage.rentAmount || 0)
      }

      setTxid(paymentTxid)
      setStep('success')
      
      setTimeout(() => {
        onPay({ txid: paymentTxid, paidBy: selectedWallet })
      }, 1000)

    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
      setStep('select')
    } finally {
      setProcessing(false)
    }
  }

  // Simulated payment functions (replace with real implementations)
  async function simulateHandCashPayment(amount: number): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return `hc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }

  async function simulateMetaNetPayment(amount: number): Promise<string> {
    // In production, use babbage-sdk createAction
    await new Promise(resolve => setTimeout(resolve, 2000))
    return `mn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }

  async function simulateGenericPayment(amount: number): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return `qr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !processing && onClose()}>
      <div className="modal-content max-w-md animate-scale-in">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700" />
          <div className="relative px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Pay for Stage</h2>
                  <p className="text-white/70 text-sm">{stage.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={processing}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
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
              <span className="text-sm font-medium">Demo Mode: Payment simulated</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {step === 'select' && (
            <>
              {/* Amount */}
              <div className="text-center mb-6 p-6 bg-surface-50 dark:bg-surface-800/50 rounded-2xl">
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">Amount Due</p>
                <p className="text-4xl font-bold text-surface-900 dark:text-white">
                  ${stage.rentAmount?.toFixed(2)}
                </p>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  ~{((stage.rentAmount || 0) / 50).toFixed(6)} BSV
                </p>
              </div>

              {/* Wallet Selection */}
              <div className="space-y-3 mb-6">
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Select Payment Method</p>
                {wallets.map(wallet => (
                  <button
                    key={wallet.id}
                    onClick={() => setSelectedWallet(wallet.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      selectedWallet === wallet.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${wallet.color} flex items-center justify-center text-white`}>
                      {wallet.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-surface-900 dark:text-white">{wallet.name}</p>
                      <p className="text-sm text-surface-500 dark:text-surface-400">{wallet.description}</p>
                    </div>
                    {selectedWallet === wallet.id && (
                      <svg className="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={loading || processing}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Pay ${stage.rentAmount?.toFixed(2)}
              </button>
            </>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-emerald-200 dark:border-emerald-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                Processing Payment
              </h3>
              <p className="text-surface-600 dark:text-surface-400">
                {demoMode ? 'Simulating payment...' : `Connecting to ${wallets.find(w => w.id === selectedWallet)?.name}...`}
              </p>
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
                Payment Successful!
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                ${stage.rentAmount?.toFixed(2)} paid via {wallets.find(w => w.id === selectedWallet)?.name}
              </p>
              <div className="p-3 bg-surface-100 dark:bg-surface-800 rounded-xl">
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Transaction ID</p>
                <p className="text-sm font-mono text-surface-700 dark:text-surface-300 break-all">{txid}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
