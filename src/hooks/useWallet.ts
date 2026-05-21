/**
 * useWallet — encapsulates all wallet/auth state for the app shell.
 * Extracted from index.tsx to keep the page component clean.
 */
import { useState, useEffect } from 'react'

const SESSION_KEYS = {
  type:    't0kenrent_wallet_type',
  key:     't0kenrent_wallet_key',
  handle:  't0kenrent_wallet_handle',
  balance: 't0kenrent_wallet_balance',
} as const

export interface WalletState {
  userKey: string
  userHandle: string
  walletType: 'handcash' | 'demo'
  walletBalance: number | null
  demoMode: boolean
  isAuthenticated: boolean
  hasRealWallet: boolean
  isAuthenticating: boolean
  authError: string | null
  isReady: boolean
}

export interface WalletActions {
  handleAuthenticated: (key: string, handle: string, wallet?: string, balance?: number) => void
  handleHandCashCallback: (authToken: string) => Promise<void>
  enableDemoMode: () => void
  disconnectWallet: () => void
  clearError: () => void
}

export function useWallet(): WalletState & WalletActions {
  const [userKey, setUserKey]             = useState('')
  const [userHandle, setUserHandle]       = useState('')
  const [walletType, setWalletType]       = useState<'handcash' | 'demo'>('demo')
  const [demoMode, setDemoMode]           = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError]         = useState<string | null>(null)
  const [isReady, setIsReady]             = useState(false)

  function handleAuthenticated(key: string, handle: string, wallet = 'demo', balance?: number) {
    setUserKey(key)
    setUserHandle(handle || key.slice(0, 10))
    setWalletType(wallet as 'handcash' | 'demo')
    const isDemo = wallet === 'demo'
    setDemoMode(isDemo)
    setWalletBalance(isDemo ? +(Math.random() * 10 + 0.5).toFixed(4) : balance ?? null)

    // Persist display-only data in sessionStorage (no tokens)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEYS.type,   wallet)
      sessionStorage.setItem(SESSION_KEYS.key,    key)
      sessionStorage.setItem(SESSION_KEYS.handle, handle)
      if (balance !== undefined) sessionStorage.setItem(SESSION_KEYS.balance, String(balance))
    }
  }

  function restoreSession(): boolean {
    if (typeof window === 'undefined') return false
    const type   = sessionStorage.getItem(SESSION_KEYS.type) as 'handcash' | 'demo' | null
    const key    = sessionStorage.getItem(SESSION_KEYS.key)
    if (!type || type === 'demo' || !key) return false
    const handle  = sessionStorage.getItem(SESSION_KEYS.handle) || key.slice(0, 10)
    const balance = sessionStorage.getItem(SESSION_KEYS.balance)
    handleAuthenticated(key, handle, type, balance ? Number(balance) : undefined)
    return true
  }

  async function handleHandCashCallback(authToken: string) {
    setIsAuthenticating(true)
    setAuthError(null)
    try {
      const res = await fetch('/api/auth/handcash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken }),
        credentials: 'include', // send/receive HTTP-only cookies
      })
      const data = await res.json()
      if (res.ok && data.success) {
        // publicKey is no longer returned — use handle as the identifier
        handleAuthenticated(data.handle, data.displayName || data.handle, 'handcash', data.balance)
      } else {
        setAuthError(data.error || 'Authentication failed. Please try again.')
      }
    } catch {
      setAuthError('Network error. Check your connection and try again.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  function enableDemoMode() {
    if (walletType !== 'demo') {
      setDemoMode(false)
      return
    }
    const demoKey = `demo_user_${Date.now().toString(36)}`
    handleAuthenticated(demoKey, 'Demo User', 'demo')
  }

  async function disconnectWallet() {
    // Clear server-side session cookie
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch { /* silent — cookie will expire naturally */ }

    setUserKey('')
    setUserHandle('')
    setWalletType('demo')
    setDemoMode(false)
    setWalletBalance(null)
    setAuthError(null)

    if (typeof window !== 'undefined') {
      Object.values(SESSION_KEYS).forEach(k => sessionStorage.removeItem(k))
      sessionStorage.removeItem('handcash_token')
      sessionStorage.removeItem('handcash_handle')
      sessionStorage.removeItem('user_paymail')
    }
  }

  // Bootstrap: handle auth callback or restore session
  useEffect(() => {
    if (typeof window === 'undefined') { setIsReady(true); return }
    const url    = new URL(window.location.href)
    const token  = url.searchParams.get('authToken')
    if (token) {
      url.searchParams.delete('authToken')
      window.history.replaceState({}, '', url.pathname + url.search)
      handleHandCashCallback(token).finally(() => setIsReady(true))
      return
    }
    restoreSession()
    if (url.searchParams.get('demo') === 'true') enableDemoMode()
    setIsReady(true)
  }, [])

  return {
    userKey, userHandle, walletType, walletBalance, demoMode,
    isAuthenticated: userKey !== '',
    hasRealWallet: walletType !== 'demo',
    isAuthenticating, authError, isReady,
    handleAuthenticated, handleHandCashCallback, enableDemoMode, disconnectWallet,
    clearError: () => setAuthError(null),
  }
}
