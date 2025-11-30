import { useState, useEffect } from 'react'
import Head from 'next/head'
import WalletAuth from '@/components/WalletAuth'
import RentalMarketplace from '@/components/RentalMarketplace'
import ChainDashboard from '@/components/ChainDashboard'
import { ThemeToggle } from '@/context/ThemeContext'

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false)
  const [userKey, setUserKey] = useState('')
  const [demoMode, setDemoMode] = useState(false)
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [activeView, setActiveView] = useState<'marketplace' | 'chains'>('marketplace')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('demo') === 'true') {
      enableDemoMode()
    }
    if (urlParams.get('view') === 'chains') {
      setActiveView('chains')
    }
  }, [])

  function handleAuthenticated(publicKey: string) {
    setUserKey(publicKey)
    setAuthenticated(true)
    setShowMarketplace(true)
  }

  function enableDemoMode() {
    setUserKey('04813250da3d3f1b3ee46f0c9062813bee38e54fcd66e7cb944ae7445dda3a536653a8612d47e44b54368afda1b8685e1aec0063f4d943300bfc8133bf1571d18e')
    setDemoMode(true)
    setShowMarketplace(true)
  }

  return (
    <>
      <Head>
        <title>T0kenRent - Decentralized Rental Platform</title>
        <meta name="description" content="Rent everyday items from people near you with secure payments and protected deposits" />
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
              <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { setShowMarketplace(false); setDemoMode(false); }}>
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-xl group-hover:shadow-primary-500/30 transition-all duration-300 group-hover:scale-105">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-surface-900 animate-pulse" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-surface-900 to-surface-600 dark:from-white dark:to-surface-400 bg-clip-text text-transparent">
                    T0kenRent
                  </h1>
                  <p className="text-xs text-surface-500 dark:text-surface-400 -mt-0.5">
                    Decentralized Rentals
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

                {/* Wallet / Demo Status */}
                <div className="w-auto sm:w-80">
                  {demoMode ? (
                    <button 
                      onClick={() => { setDemoMode(false); setShowMarketplace(false); }}
                      className="btn-ghost text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="hidden sm:inline">Exit Demo</span>
                    </button>
                  ) : !showMarketplace ? (
                    <div className="hidden sm:block">
                      <WalletAuth onAuthenticated={handleAuthenticated} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 truncate max-w-[100px] sm:max-w-[200px]">
                        {userKey.slice(0, 8)}...{userKey.slice(-6)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative">
          {showMarketplace ? (
            <div className="animate-fade-in">
              {/* View Toggle */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="flex items-center justify-center gap-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit mx-auto">
                  <button
                    onClick={() => setActiveView('marketplace')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeView === 'marketplace'
                        ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                    }`}
                  >
                    Marketplace
                  </button>
                  <button
                    onClick={() => setActiveView('chains')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeView === 'chains'
                        ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                    }`}
                  >
                    Supply Chains
                  </button>
                </div>
              </div>
              
              {activeView === 'marketplace' ? (
                <RentalMarketplace userKey={userKey} demoMode={demoMode} />
              ) : (
                <ChainDashboard userKey={userKey} demoMode={demoMode} />
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
                    BSV Hackathon 2025 - Team ChibiTech
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-slide-up">
                  <span className="bg-gradient-to-r from-surface-900 via-surface-700 to-surface-900 dark:from-white dark:via-surface-300 dark:to-white bg-clip-text text-transparent">
                    Rent Anything,
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 bg-clip-text text-transparent">
                    Trust No One
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-surface-600 dark:text-surface-400 mb-10 max-w-2xl mx-auto animate-slide-up animation-delay-100">
                  The peer-to-peer platform for renting everyday items. 
                  Protected payments, secure deposits, no middleman fees.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-200">
                  <button
                    onClick={enableDemoMode}
                    className="w-full sm:w-auto btn-primary text-lg px-8 py-4 flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Try Demo Mode
                  </button>
                  <div className="hidden sm:block">
                    <WalletAuth onAuthenticated={handleAuthenticated} />
                  </div>
                </div>

                <p className="text-sm text-surface-500 dark:text-surface-500 mt-4 animate-slide-up animation-delay-300">
                  No wallet? No problem. Try demo mode to explore the full experience.
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 sm:mb-24">
                {/* Card 1 */}
                <div className="feature-card animate-slide-up animation-delay-100">
                  <div className="icon-wrapper">
                    <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                    List Anything
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400">
                    Turn your unused items into income. List cameras, tools, sports gear, and more.
                  </p>
                </div>

                {/* Card 2 */}
                <div className="feature-card animate-slide-up animation-delay-200">
                  <div className="icon-wrapper">
                    <svg className="w-7 h-7 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                    Protected Deposits
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400">
                    Security deposits held safely until both renter and owner confirm the rental went smoothly.
                  </p>
                </div>

                {/* Card 3 */}
                <div className="feature-card animate-slide-up animation-delay-300 sm:col-span-2 lg:col-span-1">
                  <div className="icon-wrapper">
                    <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                    Instant Access
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400">
                    Pay a small fee to unlock contact details and pickup info. No subscriptions needed.
                  </p>
                </div>
              </div>

              {/* How It Works */}
              <div className="glass-card p-8 sm:p-12 mb-16 sm:mb-24 animate-slide-up animation-delay-400">
                <div className="text-center mb-10">
                  <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white mb-3">
                    How It Works
                  </h2>
                  <p className="text-surface-600 dark:text-surface-400">
                    Four simple steps to trustless rentals
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { step: '01', title: 'List Your Item', desc: 'Add photos, set your price, and describe your item in minutes.' },
                    { step: '02', title: 'Browse & Unlock', desc: 'Renters pay a small fee to see pickup location and contact info.' },
                    { step: '03', title: 'Secure Deposit', desc: 'Security deposit is held safely until the rental is complete.' },
                    { step: '04', title: 'Complete & Review', desc: 'Return the item, get your deposit back, and leave a review.' },
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
              <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-16 sm:mb-24">
                {[
                  { value: '~0%', label: 'Platform Fees', color: 'primary' },
                  { value: '100%', label: 'Secure Payments', color: 'accent' },
                  { value: 'Global', label: 'Rent Anywhere', color: 'primary' },
                ].map((stat, i) => (
                  <div 
                    key={i} 
                    className={`glass-card p-6 sm:p-8 text-center animate-slide-up`}
                    style={{ animationDelay: `${(i + 5) * 100}ms` }}
                  >
                    <div className={`text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r ${
                      stat.color === 'primary' 
                        ? 'from-primary-500 to-primary-600' 
                        : 'from-accent-500 to-accent-600'
                    } bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-surface-600 dark:text-surface-400">
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
                    Ready to get started?
                  </h2>
                  <p className="text-white/80 mb-8 max-w-xl mx-auto">
                    Start earning from your unused items or find exactly what you need. Quick, easy, and secure.
                  </p>
                  <button
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
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    T0kenRent
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Team ChibiTech - BSV Hackathon 2025
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <a 
                  href="https://github.com/Gwennovation/t0kenrent" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-surface-600 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a 
                  href="https://bsvblockchain.org" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
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
