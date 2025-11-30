import { useState, useEffect } from 'react'
import Head from 'next/head'
import WalletAuth from '@/components/WalletAuth'
import RentalMarketplace from '@/components/RentalMarketplace'

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false)
  const [userKey, setUserKey] = useState('')
  const [demoMode, setDemoMode] = useState(false)
  const [showMarketplace, setShowMarketplace] = useState(false)

  // Check for demo mode on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('demo') === 'true') {
      enableDemoMode()
    }
  }, [])

  function handleAuthenticated(publicKey: string) {
    setUserKey(publicKey)
    setAuthenticated(true)
    setShowMarketplace(true)
  }

  function enableDemoMode() {
    // Use the dev identity for demo
    setUserKey('04813250da3d3f1b3ee46f0c9062813bee38e54fcd66e7cb944ae7445dda3a536653a8612d47e44b54368afda1b8685e1aec0063f4d943300bfc8133bf1571d18e')
    setDemoMode(true)
    setShowMarketplace(true)
  }

  return (
    <>
      <Head>
        <title>T0kenRent - Decentralized Rental Tokenization Platform</title>
        <meta name="description" content="Tokenize and rent everyday assets on the BSV blockchain with HTTP 402 payment gating and smart contract escrows" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">T0kenRent</h1>
                <p className="text-xs text-gray-600">Decentralized Rental Platform • ChibiTech</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {demoMode && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  Demo Mode
                </span>
              )}
              <div className="w-80">
                {demoMode ? (
                  <div className="flex items-center gap-3 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
                    <span className="text-sm font-medium text-yellow-800">Demo Mode Active</span>
                    <button 
                      onClick={() => { setDemoMode(false); setShowMarketplace(false); }}
                      className="ml-auto text-xs text-yellow-600 hover:text-yellow-800"
                    >
                      Exit
                    </button>
                  </div>
                ) : (
                  <WalletAuth onAuthenticated={handleAuthenticated} />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="py-8">
          {showMarketplace ? (
            <RentalMarketplace userKey={userKey} />
          ) : (
            <div className="max-w-4xl mx-auto px-4">
              {/* Hero Section */}
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center space-y-8">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Welcome to T0kenRent
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    The decentralized platform for tokenizing and renting everyday assets.
                    Powered by BSV blockchain with HTTP 402 payment gating.
                  </p>
                </div>

                {/* Demo Mode Button */}
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={enableDemoMode}
                    className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
                  >
                    Try Demo Mode (No Wallet Required)
                  </button>
                  <p className="text-sm text-gray-500">
                    Or connect your BSV wallet above for full functionality
                  </p>
                </div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-left">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Tokenize Assets</h3>
                    <p className="text-sm text-gray-600">
                      Mint BRC-76 compliant tokens representing your rentable items with on-chain metadata.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-left">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Secure Escrow</h3>
                    <p className="text-sm text-gray-600">
                      Smart contract escrows protect security deposits with 2-of-2 multisig on BSV.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-left">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">HTTP 402 Payments</h3>
                    <p className="text-sm text-gray-600">
                      Micropayments gate access to rental details, creating seamless pay-per-view interactions.
                    </p>
                  </div>
                </div>

                {/* How It Works */}
                <div className="bg-gray-50 rounded-xl p-8 mt-8 text-left">
                  <h3 className="font-bold text-xl text-gray-900 mb-6 text-center">How T0kenRent Works</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">List Your Asset</h4>
                        <p className="text-sm text-gray-600">Tokenize your item (camera, tools, bikes) as a BRC-76 token with rental terms.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">HTTP 402 Unlock</h4>
                        <p className="text-sm text-gray-600">Renters pay a tiny micropayment to unlock detailed rental information and access codes.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Escrow Deposit</h4>
                        <p className="text-sm text-gray-600">Security deposit is locked in a smart contract escrow until the rental completes.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Complete & Release</h4>
                        <p className="text-sm text-gray-600">Both parties co-sign to release the escrow. Deposit returns to renter, minus rental fee.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet Options */}
                <div className="bg-blue-50 rounded-xl p-6 mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Supported Wallets</h4>
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    <a href="https://projectbabbage.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      MetaNet Client (Recommended)
                    </a>
                    <span className="px-4 py-2 bg-white rounded-lg shadow-sm text-gray-500">
                      BSV Desktop via Bridge
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Have a BSV Desktop wallet? Use our <a href="https://github.com/Gwennovation/t0kenrent/blob/main/docs/wallet-integration.md" className="text-primary-600 hover:underline">wallet bridge</a> to connect!
                  </p>
                </div>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <div className="text-3xl font-bold text-primary-600">~0%</div>
                  <div className="text-sm text-gray-600 mt-1">Transaction Fees</div>
                </div>
                <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <div className="text-3xl font-bold text-primary-600">100%</div>
                  <div className="text-sm text-gray-600 mt-1">On-Chain Security</div>
                </div>
                <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <div className="text-3xl font-bold text-primary-600">Global</div>
                  <div className="text-sm text-gray-600 mt-1">Accessibility</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">
                  2025 ChibiTech. Built for BSV Hackathon.
                </p>
                <span className="text-gray-300">|</span>
                <p className="text-sm text-gray-500">
                  Powered by BSV Blockchain
                </p>
              </div>
              <div className="flex gap-6">
                <a href="https://github.com/Gwennovation/t0kenrent" className="text-sm text-gray-600 hover:text-primary-600">
                  GitHub
                </a>
                <a href="/docs" className="text-sm text-gray-600 hover:text-primary-600">
                  Documentation
                </a>
                <a href="https://docs.bsvblockchain.org" className="text-sm text-gray-600 hover:text-primary-600">
                  BSV Docs
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
