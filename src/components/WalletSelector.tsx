import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getPublicKey, waitForAuthentication, isAuthenticated } from 'babbage-sdk'
import { getErrorMessage } from '@/lib/error-utils'
import { getHandCashAuthUrl } from '@/lib/handcash'

// Wallet logo paths
const WALLET_LOGOS = {
  handcash: '/wallets/handcash.svg',
  metanet: '/wallets/metanet.svg',
  relysia: '/wallets/relysia.svg'
}

interface WalletSelectorProps {
  onAuthenticated: (publicKey: string, handle: string, walletType: string, balance?: number) => void
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
      const authToken = urlParams.get('authToken')
      
      if (authToken) {
        handleHandCashCallback(authToken)
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
    
    // Check if already authenticated with MetaNet
    checkMetaNetAuth()
  }, [])

  async function handleHandCashCallback(authToken: string) {
    setLoading(true)
    setSelectedWallet('handcash')
    try {
      // Exchange auth token for access token and get profile via API
      const response = await fetch('/api/auth/handcash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Store the access token for future API calls
        sessionStorage.setItem('handcash_token', data.accessToken)
        sessionStorage.setItem('handcash_handle', data.handle)
        onAuthenticated(data.publicKey, data.handle, 'handcash', data.balance)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to authenticate with HandCash')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function checkMetaNetAuth() {
    try {
      const authed = await isAuthenticated()
      if (authed) {
        const pubKey = await getPublicKey({
          protocolID: [2, 'T0kenRent'],
          keyID: '1',
          counterparty: 'self'
        })
        // For MetaNet, we use the public key as the handle
        onAuthenticated(pubKey, pubKey.slice(0, 12), 'metanet')
      }
    } catch (err) {
      // Not authenticated with MetaNet - this is expected
      console.log('MetaNet wallet not detected or not authenticated')
    }
  }

  async function connectHandCash() {
    setSelectedWallet('handcash')
    setLoading(true)
    setError('')
    
    try {
      // Generate the HandCash authorization URL with redirect
      const authUrl = getHandCashAuthUrl()
      
      if (!authUrl || authUrl.includes('appId=&')) {
        throw new Error('HandCash App ID not configured. Please set NEXT_PUBLIC_HANDCASH_APP_ID in your environment.')
      }
      
      // Redirect to HandCash for authentication
      window.location.href = authUrl
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  async function connectMetaNet() {
    setSelectedWallet('metanet')
    setLoading(true)
    setError('')
    
    try {
      // Check if MetaNet/Babbage wallet is available
      const authed = await isAuthenticated()
      
      if (!authed) {
        // Wait for user to authenticate with their wallet
        await waitForAuthentication()
      }
      
      // Get the user's public key
      const pubKey = await getPublicKey({
        protocolID: [2, 'T0kenRent'],
        keyID: '1',
        counterparty: 'self'
      })
      
      onAuthenticated(pubKey, pubKey.slice(0, 12), 'metanet')
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      if (errorMsg.includes('No wallet') || errorMsg.includes('not available') || errorMsg.includes('undefined')) {
        setError('MetaNet/Babbage wallet not detected. Please install a compatible wallet extension.')
      } else {
        setError(errorMsg)
      }
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
      // Resolve the paymail to get the public key
      const response = await fetch(`/api/auth/paymail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymail })
      })
      
      if (response.ok) {
        const data = await response.json()
        sessionStorage.setItem('user_paymail', paymail)
        onAuthenticated(data.publicKey, paymail, 'paymail')
      } else {
        // If paymail resolution fails, we still allow connection with paymail as identifier
        // This enables QR code payment flows
        const pseudoPublicKey = `pm_${paymail.replace('@', '_at_')}_${Date.now()}`
        sessionStorage.setItem('user_paymail', paymail)
        onAuthenticated(pseudoPublicKey, paymail, 'paymail')
      }
    } catch (err) {
      // Fallback - allow paymail connection for QR payments
      const pseudoPublicKey = `pm_${paymail.replace('@', '_at_')}_${Date.now()}`
      sessionStorage.setItem('user_paymail', paymail)
      onAuthenticated(pseudoPublicKey, paymail, 'paymail')
    } finally {
      setLoading(false)
    }
  }

  // Compact mode for header
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={connectHandCash}
          disabled={loading}
          className={`p-2 rounded-xl transition-all duration-200 ${
            loading && selectedWallet === 'handcash'
              ? 'bg-emerald-500/20 ring-2 ring-emerald-500'
              : 'bg-white/80 dark:bg-surface-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-surface-200 dark:border-surface-700 hover:border-emerald-400'
          }`}
          title="Connect HandCash"
        >
          {loading && selectedWallet === 'handcash' ? (
            <svg className="w-7 h-7 text-emerald-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <Image src={WALLET_LOGOS.handcash} alt="HandCash" width={28} height={28} className="rounded-lg" />
          )}
        </button>
        <button
          type="button"
          onClick={connectMetaNet}
          disabled={loading}
          className={`p-2 rounded-xl transition-all duration-200 ${
            loading && selectedWallet === 'metanet'
              ? 'bg-blue-500/20 ring-2 ring-blue-500'
              : 'bg-white/80 dark:bg-surface-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-surface-200 dark:border-surface-700 hover:border-blue-400'
          }`}
          title="Connect MetaNet"
        >
          {loading && selectedWallet === 'metanet' ? (
            <svg className="w-7 h-7 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <Image src={WALLET_LOGOS.metanet} alt="MetaNet" width={28} height={28} className="rounded-lg" />
          )}
        </button>
        <button
          type="button"
          onClick={connectPaymail}
          disabled={loading}
          className={`p-2 rounded-xl transition-all duration-200 ${
            loading && selectedWallet === 'paymail'
              ? 'bg-purple-500/20 ring-2 ring-purple-500'
              : 'bg-white/80 dark:bg-surface-800/80 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-surface-200 dark:border-surface-700 hover:border-purple-400'
          }`}
          title="Use Relysia/Paymail"
        >
          {loading && selectedWallet === 'paymail' ? (
            <svg className="w-7 h-7 text-purple-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <Image src={WALLET_LOGOS.relysia} alt="Relysia" width={28} height={28} className="rounded-lg" />
          )}
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
          type="button"
          onClick={connectHandCash}
          disabled={loading}
          className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
            selectedWallet === 'handcash' && loading
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-surface-200 dark:border-surface-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all overflow-hidden ${
            selectedWallet === 'handcash' && loading
              ? 'bg-emerald-500/20 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500'
              : 'bg-white dark:bg-surface-800 group-hover:shadow-lg group-hover:shadow-emerald-500/30'
          }`}>
            {loading && selectedWallet === 'handcash' ? (
              <svg className="w-6 h-6 text-emerald-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Image src={WALLET_LOGOS.handcash} alt="HandCash" width={40} height={40} className="rounded-lg" />
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
          type="button"
          onClick={connectMetaNet}
          disabled={loading}
          className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
            selectedWallet === 'metanet' && loading
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-surface-200 dark:border-surface-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all overflow-hidden ${
            selectedWallet === 'metanet' && loading
              ? 'bg-blue-500/20 shadow-lg shadow-blue-500/30 ring-2 ring-blue-500'
              : 'bg-white dark:bg-surface-800 group-hover:shadow-lg group-hover:shadow-blue-500/30'
          }`}>
            {loading && selectedWallet === 'metanet' ? (
              <svg className="w-6 h-6 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Image src={WALLET_LOGOS.metanet} alt="MetaNet" width={40} height={40} className="rounded-lg" />
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
          type="button"
          onClick={connectPaymail}
          disabled={loading}
          className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
            selectedWallet === 'paymail'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-surface-200 dark:border-surface-700 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all overflow-hidden ${
            selectedWallet === 'paymail'
              ? 'bg-purple-500/20 shadow-lg shadow-purple-500/30 ring-2 ring-purple-500'
              : 'bg-white dark:bg-surface-800 group-hover:shadow-lg group-hover:shadow-purple-500/30'
          }`}>
            {loading && selectedWallet === 'paymail' ? (
              <svg className="w-6 h-6 text-purple-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Image src={WALLET_LOGOS.relysia} alt="Relysia" width={40} height={40} className="rounded-lg" />
            )}
          </div>
          <div className="flex-1 text-left">
            <span className={`font-semibold ${
              selectedWallet === 'paymail' 
                ? 'text-purple-700 dark:text-purple-300' 
                : 'text-surface-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300'
            }`}>
              Relysia / Paymail
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
                type="button"
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
        Connect your BSV wallet to start using T0kenRent
      </p>
    </div>
  )
}
