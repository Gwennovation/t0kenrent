import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getErrorMessage } from '@/lib/error-utils'
import { getHandCashAuthUrl } from '@/lib/handcash-client'

type WalletConnectionType = 'handcash' | 'metanet' | 'paymail' | 'demo'


interface WalletSelectorProps {
  onAuthenticated: (publicKey: string, handle: string, walletType: WalletConnectionType, balance?: number) => void
  compact?: boolean
}

export default function WalletSelector({ onAuthenticated, compact = false }: WalletSelectorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const urlParams = new URLSearchParams(window.location.search)
    const authToken = urlParams.get('authToken')
    if (authToken) {
      window.history.replaceState({}, '', window.location.pathname)
      handleHandCashCallback(authToken)
    }
  }, [])

  async function handleHandCashCallback(authToken: string) {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/handcash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        sessionStorage.setItem('handcash_token', data.accessToken)
        sessionStorage.setItem('handcash_handle', data.handle)
        onAuthenticated(data.publicKey, data.handle, 'handcash', data.balance)
      } else {
        setError(data.error || 'Authentication failed. Please try again.')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function connectHandCash() {
    setLoading(true)
    setError('')
    try {
      const authUrl = getHandCashAuthUrl()
      if (!authUrl || authUrl.includes('appId=&')) {
        throw new Error('HandCash App ID not configured.')
      }
      window.location.href = authUrl
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={connectHandCash}
        disabled={loading}
        className="p-2 rounded-xl transition-all duration-200 bg-white/80 dark:bg-surface-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-surface-200 dark:border-surface-700 hover:border-emerald-400"
        title="Connect HandCash"
      >
        {loading ? (
          <svg className="w-7 h-7 text-emerald-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <Image src="/wallets/HandCash Logo.png" alt="HandCash" width={28} height={28} className="rounded-lg" />
        )}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={connectHandCash}
        disabled={loading}
        className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-surface-200 dark:border-surface-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-300"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white dark:bg-surface-800 overflow-hidden group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-all">
          {loading ? (
            <svg className="w-6 h-6 text-emerald-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <Image src="/wallets/HandCash Logo.png" alt="HandCash" width={40} height={40} className="rounded-lg" />
          )}
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-surface-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
              {loading ? 'Connecting...' : 'Connect with HandCash'}
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full font-medium">
              RECOMMENDED
            </span>
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Sign in with your $handle — fast and secure
          </p>
        </div>
        <svg className="w-5 h-5 text-surface-400 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <p className="text-xs text-center text-surface-500 dark:text-surface-400">
        Your keys stay in your wallet — we never see your private keys.
      </p>
    </div>
  )
}
