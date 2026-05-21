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
        body: JSON.stringify({ authToken }),
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
        className="p-2 rounded-xl bg-surface-800 border border-surface-700 hover:border-surface-600 hover:bg-surface-700 transition-colors disabled:opacity-50"
        title="Connect HandCash"
      >
        {loading ? (
          <svg className="w-6 h-6 text-primary-500 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <Image src="/wallets/HandCash Logo.png" alt="HandCash" width={24} height={24} className="rounded" />
        )}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={connectHandCash}
        disabled={loading}
        className="group w-full flex items-center gap-3 p-3.5 rounded-xl border border-surface-700 hover:border-surface-600 bg-surface-900/50 hover:bg-surface-800/50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-10 h-10 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center shrink-0 overflow-hidden">
          {loading ? (
            <svg className="w-5 h-5 text-primary-500 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <Image src="/wallets/HandCash Logo.png" alt="HandCash" width={36} height={36} className="rounded-md" />
          )}
        </div>
        <div className="flex-1 text-left">
          <span className="block text-sm font-medium text-surface-200 group-hover:text-white transition-colors">
            {loading ? 'Redirecting…' : 'Continue with HandCash'}
          </span>
          <span className="text-xs text-surface-500">
            {loading ? 'Opening HandCash…' : 'Sign in with your $handle'}
          </span>
        </div>
        {!loading && (
          <svg className="w-4 h-4 text-surface-600 group-hover:text-surface-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-900/50 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
