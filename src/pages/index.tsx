import { useState, useEffect } from 'react'
import Head from 'next/head'
import WalletSelector from '@/components/WalletSelector'
import RentalMarketplace from '@/components/RentalMarketplace'
import RentalDashboard from '@/components/RentalDashboard'
import { ThemeToggle } from '@/context/ThemeContext'

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false)
  const [userKey, setUserKey] = useState('')
  const [userHandle, setUserHandle] = useState('')
  const [walletType, setWalletType] = useState<'handcash' | 'metanet' | 'paymail' | 'demo'>('demo')
  const [demoMode, setDemoMode] = useState(false)
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [activeView, setActiveView] = useState<'marketplace' | 'dashboard'>('marketplace')
  const [isLoaded, setIsLoaded] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoaded(true)
    
    // Check for demo mode in URL
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('demo') === 'true') {
      enableDemoMode()
    }
    
    // Check for HandCash callback
    const authToken = urlParams.get('authToken')
    if (authToken) {
      handleHandCashCallback(authToken)
    }
  }, [])

  async function handleHandCashCallback(authToken: string) {
    console.log('🔐 Starting HandCash authentication...')
    // Show loading state
    setIsAuthenticating(true)
    setAuthError(null)
    
    // Clean URL immediately to prevent re-triggering on refresh
    const url = new URL(window.location.href)
    url.searchParams.delete('authToken')
    window.history.replaceState({}, '', url.pathname + url.search)
    
    try {
      console.log('📡 Calling /api/auth/handcash...')
      const response = await fetch('/api/auth/handcash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken })
      })
      
      const data = await response.json()
      console.log('📥 Auth response:', response.status, data)
      
      if (response.ok && data.success) {
        console.log('✅ Authentication successful!')
        handleAuthenticated(data.publicKey, data.handle, 'handcash', data.balance)
      } else {
        // Handle API error response
        const errorMessage = data.error || 'Authentication failed. Please try again.'
        console.error('❌ HandCash auth failed:', errorMessage)
        setAuthError(errorMessage)
      }
    } catch (error: any) {
      console.error('❌ HandCash callback error:', error)
      setAuthError(error.message || 'Network error during authentication. Please check your connection and try again.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  function handleAuthenticated(publicKey: string, handle: string, wallet: string = 'demo', balance?: number) {
    console.log('🎉 Setting authenticated state:', { publicKey, handle, wallet, balance })
    setUserKey(publicKey)
    setUserHandle(handle || publicKey.slice(0, 10))
    setWalletType(wallet as 'handcash' | 'metanet' | 'paymail' | 'demo')
    setAuthenticated(true)
    setShowMarketplace(true)
    
    // Only set demo mode if explicitly using demo wallet
    const isDemo = wallet === 'demo'
    setDemoMode(isDemo)
    
    // Set balance - only use random balance for demo mode
    if (isDemo) {
      setWalletBalance(Math.random() * 10 + 0.5) // Random demo balance 0.5-10.5 BSV
    } else if (balance !== undefined) {
      setWalletBalance(balance)
    } else {
      // Real wallet without balance info yet - will be fetched later
      setWalletBalance(null)
    }
    
    console.log('✅ Marketplace should now be visible, showMarketplace=true')
  }

  function enableDemoMode() {
    const demoKey = 'demo_user_' + Date.now().toString(36)
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
    setAuthenticated(false)
    setDemoMode(false)
    setShowMarketplace(false)
    setWalletBalance(null)
    setAuthError(null)
  }

  return (
    <>
      <Head>
        <title>T0kenRent - Decentralized Rental Platform on BSV</title>
        <meta name="description" content="Rent everyday items from people near you with secure BSV payments, smart contract escrow, and on-chain proof of rentals." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`min-h-screen transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary-500/10 via-transparent to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-accent-500/10 via-transparent to-transparent rounded-full blur-3xl animate-float animation-delay-300" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse-slow" />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-surface-900/80 border-b border-surface-200/50 dark:border-surface-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              {/* Logo */}
              <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { setShowMarketplace(false); setDemoMode(false); setActiveView('marketplace'); }}>
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-xl group-hover:shadow-primary-500/30 transition-all duration-300 group-hover:scale-105 p-2">
                    <img 
                      src="/t0kenrent-logo.png" 
                      alt="T0kenRent Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-surface-900 animate-pulse" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-surface-900 to-surface-600 dark:from-white dark:to-surface-400 bg-clip-text text-transparent">
                    T0kenRent
                  </h1>
                  <p className="text-xs text-surface-500 dark:text-surface-400 -mt-0.5">
                    Decentralized Rentals on BSV
                  </p>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Demo Badge */}
                {demoMode && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Demo Mode</span>
                  </div>
                )}

                {/* Wallet Status */}
                <div className="w-auto">
                  {showMarketplace ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${
                          demoMode 
                            ? 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {demoMode ? 'DEMO' : walletType === 'handcash' ? 'HC' : walletType === 'metanet' ? 'MN' : 'PM'}
                        </span>
                        <span className="hidden sm:inline text-xs font-medium text-emerald-700 dark:text-emerald-400 truncate max-w-[120px]">
                          {demoMode ? 'Demo User' : userHandle || `${userKey.slice(0, 6)}...${userKey.slice(-4)}`}
                        </span>
                        {walletBalance !== null && (
                          <span className="hidden md:inline text-xs font-bold text-primary-600 dark:text-primary-400 ml-1">
                            {walletBalance.toFixed(4)} BSV
                          </span>
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={disconnectWallet}
                        className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-surface-600 dark:text-surface-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Disconnect"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="hidden sm:flex items-center gap-2">
                      <WalletSelector onAuthenticated={handleAuthenticated} compact />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Authentication Loading Overlay */}
        {isAuthenticating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="glass-card p-8 text-center max-w-sm mx-4 animate-slide-up">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                Authenticating with HandCash
              </h3>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Please wait while we verify your wallet...
              </p>
            </div>
          </div>
        )}

        {/* Authentication Error Alert */}
        {authError && !isAuthenticating && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] max-w-md mx-4 animate-slide-down">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                    Authentication Failed
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {authError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthError(null)}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/50 transition-colors"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuthError(null)}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null)
                    // Redirect to HandCash auth again
                    const handcashAuthUrl = `https://app.handcash.io/#/authorizeApp?appId=${process.env.NEXT_PUBLIC_HANDCASH_APP_ID || ''}`
                    window.location.href = handcashAuthUrl
                  }}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="relative">
          {showMarketplace ? (
            <div className="animate-fade-in">
              {/* View Toggle */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="flex items-center justify-center gap-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit mx-auto">
                  <button
                    type="button"
                    onClick={() => setActiveView('marketplace')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      activeView === 'marketplace'
                        ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Marketplace
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('dashboard')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      activeView === 'dashboard'
                        ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
              {/* Hero Section */}
              <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-24">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-full mb-6 animate-slide-down">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                  </span>
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                    Built on BSV Blockchain
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-slide-up">
                  <span className="bg-gradient-to-r from-surface-900 via-surface-700 to-surface-900 dark:from-white dark:via-surface-300 dark:to-white bg-clip-text text-transparent">
                    Rent Anything,
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 bg-clip-text text-transparent">
                    Trust the Chain
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-surface-600 dark:text-surface-400 mb-10 max-w-2xl mx-auto animate-slide-up animation-delay-100">
                  Peer-to-peer rentals with HTTP 402 micropayments, smart contract escrow, 
                  and on-chain proof of every transaction.
                </p>

                {/* Wallet Connection Options */}
                <div className="max-w-md mx-auto mb-8 animate-slide-up animation-delay-200">
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Connect Your BSV Wallet
                    </h3>
                    <WalletSelector onAuthenticated={handleAuthenticated} />
                  </div>
                </div>

                {/* Demo Mode Button */}
                <div className="flex flex-col items-center gap-3 animate-slide-up animation-delay-300">
                  <div className="flex items-center gap-4">
                    <div className="h-px w-16 bg-surface-300 dark:bg-surface-700" />
                    <span className="text-sm text-surface-500 dark:text-surface-400">or</span>
                    <div className="h-px w-16 bg-surface-300 dark:bg-surface-700" />
                  </div>
                  <button
                    type="button"
                    onClick={enableDemoMode}
                    className="btn-secondary text-base px-6 py-3 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Try Demo Mode
                  </button>
                  <p className="text-sm text-surface-500 dark:text-surface-500">
                    Explore the full experience without connecting a wallet
                  </p>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 sm:mb-24">
                {[
                  {
                    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                    title: 'Smart Contract Escrow',
                    description: '2-of-2 multisig escrow protects both parties. Funds released only when both agree.',
                    color: 'primary'
                  },
                  {
                    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
                    title: 'HTTP 402 Payments',
                    description: 'Pay tiny micropayments to unlock rental details. Near-zero fees on BSV.',
                    color: 'accent'
                  },
                  {
                    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
                    title: '1Sat Ordinal Tokens',
                    description: 'Link your assets to 1Sat ordinals for on-chain proof of ownership.',
                    color: 'primary'
                  },
                  {
                    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
                    title: 'On-Chain Logging',
                    description: 'Every transaction logged on BSV. Immutable rental history and receipts.',
                    color: 'accent'
                  }
                ].map((feature, i) => (
                  <div key={i} className="feature-card animate-slide-up" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
                    <div className={`icon-wrapper ${feature.color === 'accent' ? 'bg-accent-100 dark:bg-accent-900/30' : ''}`}>
                      <svg className={`w-7 h-7 ${feature.color === 'accent' ? 'text-accent-500' : 'text-primary-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* How It Works */}
              <div className="glass-card p-8 sm:p-12 mb-16 sm:mb-24 animate-slide-up animation-delay-400">
                <div className="text-center mb-10">
                  <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white mb-3">
                    How It Works
                  </h2>
                  <p className="text-surface-600 dark:text-surface-400">
                    Four steps to trustless peer-to-peer rentals
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { step: '01', title: 'Connect Wallet', desc: 'Sign in with HandCash, Relysia, or any BSV wallet.' },
                    { step: '02', title: 'Pay to Unlock', desc: 'HTTP 402 micropayment reveals pickup location and contact.' },
                    { step: '03', title: 'Fund Escrow', desc: 'Deposit + rental fee locked in 2-of-2 multisig contract.' },
                    { step: '04', title: 'Complete & Release', desc: 'Both parties sign to release funds. On-chain proof created.' },
                  ].map((item, i) => (
                    <div key={i} className="relative">
                      <div className="text-6xl font-bold text-primary-500/10 dark:text-primary-500/20 mb-2">
                        {item.step}
                      </div>
                      <h4 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                        {item.title}
                      </h4>
                      <p className="text-sm text-surface-600 dark:text-surface-400">
                        {item.desc}
                      </p>
                      {i < 3 && (
                        <div className="hidden lg:block absolute top-8 -right-4 text-surface-300 dark:text-surface-600">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-24">
                {[
                  { value: '~$0.001', label: 'Unlock Fee', color: 'primary' },
                  { value: '2-of-2', label: 'Multisig Escrow', color: 'accent' },
                  { value: '100%', label: 'On-Chain', color: 'primary' },
                  { value: 'Global', label: 'P2P Rentals', color: 'accent' },
                ].map((stat, i) => (
                  <div 
                    key={i} 
                    className="glass-card p-6 sm:p-8 text-center animate-slide-up"
                    style={{ animationDelay: `${(i + 5) * 100}ms` }}
                  >
                    <div className={`text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r ${
                      stat.color === 'primary' 
                        ? 'from-primary-500 to-primary-600' 
                        : 'from-accent-500 to-accent-600'
                    } bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Section */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 to-accent-600 p-8 sm:p-12 text-center animate-slide-up animation-delay-500">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTJoLTJ2Mmgyem0tNiAwaC0ydjJoMnYtMnptMCA2aC0ydjRoMnYtNHptLTYtNmgtMnYyaDJ2LTJ6bTAgNmgtMnY0aDJ2LTR6bTEyLTEydi0ySDI0djJoMTJ6bTAgMTJ2LTJIMjR2MmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
                <div className="relative">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                    Ready to rent trustlessly?
                  </h2>
                  <p className="text-white/80 mb-8 max-w-xl mx-auto">
                    List your items, rent what you need, all secured by BSV blockchain technology.
                  </p>
                  <button
                    type="button"
                    onClick={enableDemoMode}
                    className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    Launch Demo
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-surface-200 dark:border-surface-800 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white dark:bg-surface-800 rounded-lg flex items-center justify-center shadow-md p-1.5">
                  <img 
                    src="/wallets/relysia.svg" 
                    alt="Relysia Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    T0kenRent
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Decentralized Rentals on BSV
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <a 
                  href="https://github.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-surface-600 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <div className="flex items-center gap-4">
                  <a 
                    href="https://bsvblockchain.org" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                  >
                    Powered by BSV
                  </a>
                  <div className="h-4 w-px bg-surface-300 dark:bg-surface-700" />
                  <a 
                    href="https://www.genspark.ai" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors group"
                  >
                    <span>Built with</span>
                    <img 
                      src="/gradient-logo.png" 
                      alt="GenSpark" 
                      className="h-5 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
