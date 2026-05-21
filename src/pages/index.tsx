import { useState, useEffect } from 'react'
import Head from 'next/head'
import WalletSelector from '@/components/WalletSelector'
import RentalMarketplace from '@/components/RentalMarketplace'
import RentalDashboard from '@/components/RentalDashboard'
import { ThemeToggle } from '@/context/ThemeContext'
import { useWallet } from '@/hooks/useWallet'

const BRAND_POINTS = [
  'Pay ~$0.001 to unlock pickup details',
  'Deposit held in 2-of-2 multisig escrow',
  'Both sign to release — immutable on-chain proof',
] as const

export default function Home() {
  const wallet = useWallet()
  const [activeView, setActiveView] = useState<'marketplace' | 'dashboard'>('marketplace')
  const [authNotice, setAuthNotice] = useState<'required' | 'forbidden' | null>(null)

  // Pick up ?auth= notice from admin middleware redirect
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const auth = params.get('auth')
    if (auth === 'required' || auth === 'forbidden') {
      setAuthNotice(auth)
      params.delete('auth')
      const qs = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
    }
  }, [])

  const isAuthenticated = wallet.isAuthenticated

  return (
    <>
      <Head>
        <title>T0kenRent — Peer-to-peer rentals on BSV</title>
        <meta name="description" content="Rent everyday items peer-to-peer. BSV escrow protects every deposit. No middleman, no platform fees." />
        <link rel="icon" href="/favicon.png" type="image/png" />
      </Head>

      <div className={`min-h-screen flex flex-col transition-opacity duration-500 ${wallet.isReady ? 'opacity-100' : 'opacity-0'}`}>

        {/* HandCash callback overlay */}
        {wallet.isAuthenticating && (
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16 gap-4">

              {/* Logo */}
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) return
                  setActiveView('marketplace')
                }}
                className="flex items-center gap-2.5 shrink-0"
              >
                <img src="/t0kenrent-logo.png" alt="T0kenRent" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
                <span className="text-sm sm:text-base font-semibold text-white tracking-tight">
                  T0kenRent
                </span>
              </button>

              {/* Nav tabs — shown when authenticated */}
              {isAuthenticated && (
                <nav className="hidden sm:flex items-center gap-1 p-1 bg-surface-900/80 border border-surface-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveView('marketplace')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
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
                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
                      activeView === 'dashboard'
                        ? 'bg-surface-800 text-white'
                        : 'text-surface-500 hover:text-surface-300'
                    }`}
                  >
                    Dashboard
                  </button>
                </nav>
              )}

              {/* Right: theme toggle + wallet status */}
              <div className="flex items-center gap-2 shrink-0">
                <ThemeToggle />

                {isAuthenticated && (
                  <>
                    <div className="flex items-center gap-2 h-9 px-3 bg-surface-900 border border-surface-800 rounded-xl">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${wallet.demoMode ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                      {wallet.demoMode && (
                        <span className="text-[10px] font-semibold text-amber-400 tracking-wide">DEMO</span>
                      )}
                      <span className="hidden xs:inline text-sm text-surface-300 truncate max-w-[80px] sm:max-w-[120px]">
                        {wallet.demoMode ? 'Demo mode' : wallet.userHandle || `${wallet.userKey.slice(0, 6)}…`}
                      </span>
                      {wallet.walletBalance !== null && (
                        <span className="hidden sm:inline font-mono-financial text-xs text-primary-400 ml-1">
                          {wallet.walletBalance.toFixed(4)} BSV
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={wallet.disconnectWallet}
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

            {/* Mobile view tabs — shown when authenticated on small screens */}
            {isAuthenticated && (
              <div className="sm:hidden flex gap-1 pb-2 -mt-1">
                <button
                  type="button"
                  onClick={() => setActiveView('marketplace')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 ${
                    activeView === 'marketplace'
                      ? 'bg-surface-800 text-white'
                      : 'text-surface-500'
                  }`}
                >
                  Marketplace
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('dashboard')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 ${
                    activeView === 'dashboard'
                      ? 'bg-surface-800 text-white'
                      : 'text-surface-500'
                  }`}
                >
                  Dashboard
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Auth redirect notice */}
        {authNotice && (
          <div className="bg-amber-950/60 border-b border-amber-900/50 px-4 py-2.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <p className="text-xs text-amber-300">
                {authNotice === 'forbidden'
                  ? 'Admin access required. Your account does not have admin privileges.'
                  : 'Please sign in to access that page.'}
              </p>
              <button
                type="button"
                onClick={() => setAuthNotice(null)}
                className="text-amber-500 hover:text-amber-300 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Main */}
        <main className="flex-1">
          {isAuthenticated ? (

            <div className="animate-fade-in">
              {activeView === 'marketplace' ? (
                <RentalMarketplace
                  userKey={wallet.userKey}
                  demoMode={wallet.demoMode}
                  walletType={wallet.walletType}
                />
              ) : (
                <RentalDashboard
                  userKey={wallet.userKey}
                  demoMode={wallet.demoMode}
                  walletType={wallet.walletType}
                  walletBalance={wallet.walletBalance}
                />
              )}
            </div>

          ) : (

            /* Landing */
            <div className="flex items-center min-h-[calc(100vh-65px)]">
              <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="grid lg:grid-cols-[1fr_400px] gap-10 lg:gap-20 items-center">

                  {/* Left: Brand copy */}
                  <div className="animate-slide-up">
                    <div className="inline-flex items-center gap-2 mb-8">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-mono text-surface-500 tracking-widest uppercase">
                        Testnet active · BSV
                      </span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                      <span className="text-white">Rent anything.</span>
                      <br />
                      <span className="text-primary-400">No middleman.</span>
                    </h1>

                    <p className="text-base sm:text-lg text-surface-400 mb-8 sm:mb-10 max-w-lg leading-relaxed">
                      Peer-to-peer rentals secured by BSV blockchain escrow.
                      Listers and renters transact directly, no platform taking a cut.
                    </p>

                    <ul className="space-y-3.5 mb-8 sm:mb-10">
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

                  {/* Right: Connect card */}
                  <div className="animate-slide-up stagger-2">
                    <div className="glass-card p-5 sm:p-6">
                      <div className="mb-5">
                        <h2 className="text-sm font-semibold text-white">Connect to get started</h2>
                        <p className="text-xs text-surface-500 mt-0.5">Sign in with your BSV wallet</p>
                      </div>

                      {wallet.authError && !wallet.isAuthenticating && (
                        <div className="mb-4 p-3 bg-red-950/60 border border-red-900/50 rounded-xl">
                          <p className="text-xs text-red-400 mb-2">{wallet.authError}</p>
                          <button
                            type="button"
                            onClick={wallet.clearError}
                            className="text-xs text-surface-500 hover:text-surface-300 transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}

                      <WalletSelector onAuthenticated={wallet.handleAuthenticated} />

                      {!wallet.hasRealWallet && (
                        <>
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-surface-800" />
                            <span className="text-xs text-surface-600">or</span>
                            <div className="flex-1 h-px bg-surface-800" />
                          </div>
                          <button
                            type="button"
                            onClick={wallet.enableDemoMode}
                            className="w-full py-2.5 px-4 text-sm font-medium text-surface-400 hover:text-surface-200 border border-surface-800 hover:border-surface-700 rounded-xl transition-colors duration-150"
                          >
                            Try demo mode
                          </button>
                        </>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <img src="/t0kenrent-logo.png" alt="T0kenRent" className="w-6 h-6 object-contain" />
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
