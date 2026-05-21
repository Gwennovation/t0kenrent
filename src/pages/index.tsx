import { useState, useEffect } from 'react'
import Head from 'next/head'
import WalletSelector from '@/components/WalletSelector'
import RentalMarketplace from '@/components/RentalMarketplace'
import RentalDashboard from '@/components/RentalDashboard'
import { ThemeToggle } from '@/context/ThemeContext'

const WALLET_SESSION_KEYS = {
  type: 't0kenrent_wallet_type',
  key: 't0kenrent_wallet_key',
  handle: 't0kenrent_wallet_handle',
  balance: 't0kenrent_wallet_balance',
} as const

const BRAND_POINTS = [
  'Pay ~$0.001 to unlock pickup details',
  'Deposit held in 2-of-2 multisig escrow',
  'Both sign to release — immutable on-chain proof',
] as const

export default function Home() {
  const [userKey, setUserKey] = useState('')
  const [userHandle, setUserHandle] = useState('')
  const [walletType, setWalletType] = useState<'handcash' | 'demo'>('demo')
  const [demoMode, setDemoMode] = useState(false)
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [activeView, setActiveView] = useState<'marketplace' | 'dashboard'>('marketplace')
  const [isLoaded, setIsLoaded] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const hasRealWallet = walletType !== 'demo'
  const handcashAuthUrl = `https://app.handcash.io/#/authorizeApp?appId=${process.env.NEXT_PUBLIC_HANDCASH_APP_ID || ''}`

  function restoreWalletSession() {
    if (typeof window === 'undefined') return false

    const storedWalletType = sessionStorage.getItem(WALLET_SESSION_KEYS.type) as 'handcash' | 'metanet' | 'paymail' | 'demo' | null
    const storedPublicKey = sessionStorage.getItem(WALLET_SESSION_KEYS.key)

    if (!storedWalletType || storedWalletType === 'demo' || !storedPublicKey) return false

    const storedHandle = sessionStorage.getItem(WALLET_SESSION_KEYS.handle) || storedPublicKey.slice(0, 10)
    const storedBalanceRaw = sessionStorage.getItem(WALLET_SESSION_KEYS.balance)
    const parsedBalance = storedBalanceRaw ? Number(storedBalanceRaw) : undefined

    handleAuthenticated(
      storedPublicKey,
      storedHandle,
      storedWalletType,
      parsedBalance !== undefined && !Number.isNaN(parsedBalance) ? parsedBalance : undefined,
    )

    return true
  }

  useEffect(() => {
    setIsLoaded(true)

    if (typeof window === 'undefined') return

    const currentUrl = new URL(window.location.href)
    const urlParams = currentUrl.searchParams
    const authToken = urlParams.get('authToken')

    if (authToken) {
      handleHandCashCallback(authToken)
      return
    }

    const sessionRestored = restoreWalletSession()
    if (sessionRestored) {
      if (urlParams.get('demo') === 'true') {
        urlParams.delete('demo')
        const searchString = urlParams.toString()
        window.history.replaceState({}, '', `${currentUrl.pathname}${searchString ? `?${searchString}` : ''}`)
      }
      return
    }

    if (urlParams.get('demo') === 'true') {
      enableDemoMode()
    }
  }, [])

  async function handleHandCashCallback(authToken: string) {
    setIsAuthenticating(true)
    setAuthError(null)

    const url = new URL(window.location.href)
    url.searchParams.delete('authToken')
    window.history.replaceState({}, '', url.pathname + url.search)

    try {
      const response = await fetch('/api/auth/handcash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        handleAuthenticated(data.publicKey, data.handle, 'handcash', data.balance)
      } else {
        setAuthError(data.error || 'Authentication failed. Please try again.')
      }
    } catch (error: any) {
      setAuthError(error.message || 'Network error. Check your connection and try again.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  function handleAuthenticated(publicKey: string, handle: string, wallet: string = 'demo', balance?: number) {
    setUserKey(publicKey)
    setUserHandle(handle || publicKey.slice(0, 10))
    setWalletType(wallet as 'handcash' | 'demo')
    setShowMarketplace(true)

    const isDemo = wallet === 'demo'
    setDemoMode(isDemo)

    if (isDemo) {
      setWalletBalance(Math.random() * 10 + 0.5)
    } else if (balance !== undefined) {
      setWalletBalance(balance)
    } else {
      setWalletBalance(null)
    }
  }

  function enableDemoMode() {
    if (walletType !== 'demo') {
      setShowMarketplace(true)
      setDemoMode(false)
      return
    }

    const demoKey = `demo_user_${Date.now().toString(36)}`
    setUserKey(demoKey)
    setUserHandle('Demo User')
    setWalletType('demo')
    setDemoMode(true)
    setShowMarketplace(true)
    setWalletBalance(Math.random() * 10 + 0.5)
  }

  function disconnectWallet() {
    setUserKey('')
    setUserHandle('')
    setWalletType('demo')
    setDemoMode(false)
    setShowMarketplace(false)
    setWalletBalance(null)
    setAuthError(null)

    if (typeof window !== 'undefined') {
      Object.values(WALLET_SESSION_KEYS).forEach((key) => sessionStorage.removeItem(key))
      sessionStorage.removeItem('handcash_token')
      sessionStorage.removeItem('handcash_handle')
      sessionStorage.removeItem('user_paymail')
    }
  }

  return (
    <>
      <Head>
        <title>T0kenRent — Peer-to-peer rentals on BSV</title>
        <meta name="description" content="Rent everyday items peer-to-peer. BSV escrow protects every deposit. No middleman, no platform fees." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`min-h-screen transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>

        {/* HandCash callback overlay */}
        {isAuthenticating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass-card p-8 max-w-xs mx-4 text-center animate-scale-in">
              <svg className="animate-spin w-10 h-10 text-primary-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm font-semibold text-white mb-1">Verifying with HandCash</p>
              <p className="text-xs text-surface-400">Confirming your wallet details…</p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-surface-800/60 bg-surface-950/80 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">

              <button
                type="button"
                onClick={() => {
                  if (!hasRealWallet) setShowMarketplace(false)
                  setDemoMode(false)
                  setActiveView('marketplace')
                }}
                className="flex items-center gap-2.5 group"
              >
                <img
                  src="/wallets/t0kenrent logo.png"
                  alt="T0kenRent"
                  className="w-8 h-8 object-contain"
                />
                <span className="text-base font-semibold text-white tracking-tight group-hover:text-surface-200 transition-colors">
                  T0kenRent
                </span>
              </button>

              <div className="flex items-center gap-2">
                <ThemeToggle />

                {showMarketplace && (
                  <>
                    <div className="flex items-center gap-2 h-9 px-3 bg-surface-900 border border-surface-800 rounded-xl">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${demoMode ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                      {demoMode && (
                        <span className="text-[10px] font-semibold text-amber-400 tracking-wide">DEMO</span>
                      )}
                      <span className="text-sm text-surface-300 truncate max-w-[100px]">
                        {demoMode ? 'Demo mode' : userHandle || `${userKey.slice(0, 6)}…`}
                      </span>
                      {walletBalance !== null && (
                        <span className="hidden sm:inline font-mono-financial text-xs text-primary-400 ml-1">
                          {walletBalance.toFixed(4)} BSV
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={disconnectWallet}
                      className="p-2 rounded-xl text-surface-500 hover:text-surface-200 hover:bg-surface-800 border border-transparent hover:border-surface-700 transition-colors"
                      title="Disconnect wallet"
                      aria-label="Disconnect wallet"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* Main */}
        <main>
          {showMarketplace ? (

            <div className="animate-fade-in">
              {/* View toggle */}
              <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6 pb-2">
                <div className="inline-flex p-1 bg-surface-900 border border-surface-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveView('marketplace')}
                    className={`px-5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
                      activeView === 'marketplace'
                        ? 'bg-surface-800 text-white'
                        : 'text-surface-500 hover:text-surface-300'
                    }`}
                  >
                    Marketplace
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('dashboard')}
                    className={`px-5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
                      activeView === 'dashboard'
                        ? 'bg-surface-800 text-white'
                        : 'text-surface-500 hover:text-surface-300'
                    }`}
                  >
                    Dashboard
                  </button>
                </div>
              </div>

              {activeView === 'marketplace' ? (
                <RentalMarketplace userKey={userKey} demoMode={demoMode} walletType={walletType} />
              ) : (
                <RentalDashboard userKey={userKey} demoMode={demoMode} walletType={walletType} walletBalance={walletBalance} />
              )}
            </div>

          ) : (

            /* Two-zone landing */
            <div className="min-h-[calc(100vh-65px)] flex items-center">
              <div className="w-full max-w-6xl mx-auto px-6 lg:px-8 py-16">
                <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-20 items-center">

                  {/* Left: Brand copy */}
                  <div className="animate-slide-up">
                    <div className="inline-flex items-center gap-2 mb-8">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-mono text-surface-500 tracking-widest uppercase">
                        Testnet active · BSV
                      </span>
                    </div>

                    <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                      <span className="text-white">Rent anything.</span>
                      <br />
                      <span className="text-primary-400">No middleman.</span>
                    </h1>

                    <p className="text-lg text-surface-400 mb-10 max-w-lg leading-relaxed">
                      Peer-to-peer rentals secured by BSV blockchain escrow.
                      Listers and renters transact directly, no platform taking a cut.
                    </p>

                    <ul className="space-y-3.5 mb-10">
                      {BRAND_POINTS.map((point) => (
                        <li key={point} className="flex items-start gap-3">
                          <span className="mt-0.5 font-mono text-sm text-primary-600 select-none shrink-0" aria-hidden>—</span>
                          <span className="text-sm text-surface-300 leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="text-xs text-surface-600">
                      No account required. No platform fees. Your keys stay in your wallet.
                    </p>
                  </div>

                  {/* Right: Wallet connect card */}
                  <div className="animate-slide-up" style={{ animationDelay: '80ms' }}>
                    <div className="glass-card p-6">
                      <div className="mb-5">
                        <h2 className="text-sm font-semibold text-white">Connect to get started</h2>
                        <p className="text-xs text-surface-500 mt-0.5">Sign in with your BSV wallet</p>
                      </div>

                      {authError && !isAuthenticating && (
                        <div className="mb-4 p-3 bg-red-950/60 border border-red-900/50 rounded-lg">
                          <p className="text-xs text-red-400 mb-2">{authError}</p>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setAuthError(null)}
                              className="text-xs text-surface-500 hover:text-surface-300 transition-colors"
                            >
                              Dismiss
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAuthError(null)
                                window.location.href = handcashAuthUrl
                              }}
                              className="text-xs text-primary-500 hover:text-primary-400 font-medium transition-colors"
                            >
                              Try again
                            </button>
                          </div>
                        </div>
                      )}

                      <WalletSelector onAuthenticated={handleAuthenticated} />

                      {!hasRealWallet && (
                        <>
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-surface-800" />
                            <span className="text-xs text-surface-600">or</span>
                            <div className="flex-1 h-px bg-surface-800" />
                          </div>

                          <button
                            type="button"
                            onClick={enableDemoMode}
                            className="w-full py-2.5 px-4 text-sm font-medium text-surface-400 hover:text-surface-200 border border-surface-800 hover:border-surface-700 rounded-xl transition-colors duration-150"
                          >
                            Try demo mode
                          </button>
                        </>
                      )}

                      {hasRealWallet && (
                        <button
                          type="button"
                          onClick={() => { setShowMarketplace(true); setActiveView('marketplace') }}
                          className="mt-4 w-full btn-primary"
                        >
                          Open Marketplace
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                      <span className="text-xs text-surface-600">Testnet · no real funds required</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-surface-800 mt-auto">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <img src="/t0kenrent logo.png" alt="T0kenRent" className="w-6 h-6 object-contain" />
                <span className="text-sm text-surface-500">T0kenRent</span>
              </div>
              <div className="flex items-center gap-5">
                <a
                  href="https://github.com/Gwennovation/t0kenrent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-surface-600 hover:text-surface-400 transition-colors"
                  aria-label="GitHub repository"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a
                  href="https://bsvblockchain.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-surface-600 hover:text-surface-400 transition-colors"
                >
                  Powered by BSV
                </a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
