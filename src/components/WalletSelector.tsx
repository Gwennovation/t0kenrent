import { useState, useEffect } from 'react'
import { getPublicKey, waitForAuthentication, isAuthenticated } from 'babbage-sdk'
import { getErrorMessage } from '@/lib/error-utils'

interface WalletSelectorProps {
  onAuthenticated: (publicKey: string, walletType: string) => void
  compact?: boolean
}

type WalletType = 'handcash' | 'metanet' | 'paymail' | null

export default function WalletSelector({ onAuthenticated, compact = false }: WalletSelectorProps) {
  const [selectedWallet, setSelectedWallet] = useState<WalletType>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPaymailInput, setShowPaymailInput] = useState(false)
  const [paymail, setPaymail] = useState('')

  useEffect(() => {
    // Check for HandCash OAuth callback
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const handcashToken = urlParams.get('handcash_token')
      const handcashHandle = urlParams.get('handcash_handle')
      
      if (handcashToken && handcashHandle) {
        sessionStorage.setItem('handcash_token', handcashToken)
        sessionStorage.setItem('handcash_handle', handcashHandle)
        const pseudoPublicKey = `hc_${handcashHandle}_${Date.now()}`
        onAuthenticated(pseudoPublicKey, 'handcash')
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
    
    // Check if already authenticated with MetaNet
    checkMetaNetAuth()
  }, [])

  async function checkMetaNetAuth() {
    try {
      const authed = await isAuthenticated()
      if (authed) {
        const pubKey = await getPublicKey({
          protocolID: [2, 'Pay MNEE'],
          keyID: '1',
          counterparty: 'self'
        })
        onAuthenticated(pubKey, 'metanet')
      }
    } catch (err) {
      console.log('Not authenticated with MetaNet')
    }
  }

  async function connectHandCash() {
    setSelectedWallet('handcash')
    setLoading(true)
    setError('')
    
    try {
      // Simulate HandCash connection for demo
      // In production, this would redirect to HandCash OAuth
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      const demoHandle = 'demo_' + Math.random().toString(36).substring(2, 6)
      const pseudoPublicKey = `hc_${demoHandle}_${Date.now()}`
      sessionStorage.setItem('handcash_handle', demoHandle)
      onAuthenticated(pseudoPublicKey, 'handcash')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function connectMetaNet() {
    setSelectedWallet('metanet')
    setLoading(true)
    setError('')
    
    try {
      // For demo, simulate the connection
      // In production with actual MetaNet wallet installed:
      // await waitForAuthentication()
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      // Generate a demo public key (in production this comes from the wallet)
      const demoPubKey = `mn_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
      onAuthenticated(demoPubKey, 'metanet')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function connectPaymail() {
    setSelectedWallet('paymail')
    setShowPaymailInput(true)
    setError('')
  }

  async function submitPaymail() {
    if (!paymail || !paymail.includes('@')) {
      setError('Please enter a valid paymail address')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const pseudoPublicKey = `pm_${paymail.replace('@', '_at_')}_${Date.now()}`
      sessionStorage.setItem('user_paymail', paymail)
      
      await new Promise(resolve => setTimeout(resolve, 800))
      onAuthenticated(pseudoPublicKey, 'paymail')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Compact mode for header
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={connectHandCash}
          disabled={loading}
          className={`p-2.5 rounded-xl transition-all duration-200 ${
            loading && selectedWallet === 'handcash'
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50'
          }`}
          title="Connect HandCash"
        >
          {loading && selectedWallet === 'handcash' ? (
            <svg className="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          )}
        </button>
        <button
          onClick={connectMetaNet}
          disabled={loading}
          className={`p-2.5 rounded-xl transition-all duration-200 ${
            loading && selectedWallet === 'metanet'
              ? 'bg-blue-500 text-white'
              : 'bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50'
          }`}
          title="Connect MetaNet"
        >
          {loading && selectedWallet === 'metanet' ? (
            <svg className="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          )}
        </button>
        <button
          onClick={connectPaymail}
          disabled={loading}
          className={`p-2.5 rounded-xl transition-all duration-200 ${
            loading && selectedWallet === 'paymail'
              ? 'bg-purple-500 text-white'
              : 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50'
          }`}
          title="Use Paymail"
        >
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    )
  }

  // Full mode for homepage
  return (
    <div className="space-y-4">
      {/* Wallet Options */}
      <div className="grid grid-cols-1 gap-3">
        {/* HandCash */}
        <button
          onClick={connectHandCash}
          disabled={loading}
          className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
            selectedWallet === 'handcash' && loading
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-surface-200 dark:border-surface-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            selectedWallet === 'handcash' && loading
              ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
              : 'bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-500 group-hover:shadow-lg group-hover:shadow-emerald-500/30'
          }`}>
            {loading && selectedWallet === 'handcash' ? (
              <svg className="w-6 h-6 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className={`w-7 h-7 transition-colors ${
                selectedWallet === 'handcash' && loading ? 'text-white' : 'text-emerald-600 dark:text-emerald-400 group-hover:text-white'
              }`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${
                selectedWallet === 'handcash' && loading
                  ? 'text-emerald-700 dark:text-emerald-300' 
                  : 'text-surface-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
              }`}>
                HandCash
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full font-medium">
                POPULAR
              </span>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Easy social payments with $handle
            </p>
          </div>
          <svg className={`w-5 h-5 transition-all ${
            selectedWallet === 'handcash' && loading
              ? 'text-emerald-500 translate-x-0 opacity-100' 
              : 'text-surface-400 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* MetaNet / Babbage */}
        <button
          onClick={connectMetaNet}
          disabled={loading}
          className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
            selectedWallet === 'metanet' && loading
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-surface-200 dark:border-surface-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            selectedWallet === 'metanet' && loading
              ? 'bg-blue-500 shadow-lg shadow-blue-500/30'
              : 'bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/30'
          }`}>
            {loading && selectedWallet === 'metanet' ? (
              <svg className="w-6 h-6 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className={`w-7 h-7 transition-colors ${
                selectedWallet === 'metanet' && loading ? 'text-white' : 'text-blue-600 dark:text-blue-400 group-hover:text-white'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            )}
          </div>
          <div className="flex-1 text-left">
            <span className={`font-semibold ${
              selectedWallet === 'metanet' && loading
                ? 'text-blue-700 dark:text-blue-300' 
                : 'text-surface-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300'
            }`}>
              MetaNet / Babbage
            </span>
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Desktop wallet with SDK integration
            </p>
          </div>
          <svg className={`w-5 h-5 transition-all ${
            selectedWallet === 'metanet' && loading
              ? 'text-blue-500 translate-x-0 opacity-100' 
              : 'text-surface-400 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Paymail / QR Code */}
        <button
          onClick={connectPaymail}
          disabled={loading}
          className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
            selectedWallet === 'paymail'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-surface-200 dark:border-surface-700 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            selectedWallet === 'paymail'
              ? 'bg-purple-500 shadow-lg shadow-purple-500/30'
              : 'bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-500 group-hover:shadow-lg group-hover:shadow-purple-500/30'
          }`}>
            <svg className={`w-7 h-7 transition-colors ${
              selectedWallet === 'paymail' ? 'text-white' : 'text-purple-600 dark:text-purple-400 group-hover:text-white'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <span className={`font-semibold ${
              selectedWallet === 'paymail' 
                ? 'text-purple-700 dark:text-purple-300' 
                : 'text-surface-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300'
            }`}>
              Paymail / QR Code
            </span>
            <p className="text-sm text-surface-600 dark:text-surface-400">
              Any BSV wallet via paymail or QR
            </p>
          </div>
          <svg className={`w-5 h-5 transition-all ${
            selectedWallet === 'paymail' 
              ? 'text-purple-500 translate-x-0 opacity-100' 
              : 'text-surface-400 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Paymail Input */}
      {showPaymailInput && selectedWallet === 'paymail' && (
        <div className="animate-slide-down space-y-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
              Enter your Paymail address
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="yourname@handcash.io"
                value={paymail}
                onChange={(e) => setPaymail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitPaymail()}
                className="flex-1 px-4 py-3 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={submitPaymail}
                disabled={loading || !paymail}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Connect'
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            Supports: HandCash, MoneyButton, RelayX, Simply Cash, and more
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-center text-surface-500 dark:text-surface-400">
        Select a wallet to connect and start using T0kenRent
      </p>
    </div>
  )
}
