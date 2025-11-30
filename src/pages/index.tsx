import { useState } from 'react'
import Head from 'next/head'
import WalletAuth from '@/components/WalletAuth'
import ActionChainBuilder from '@/components/ActionChainBuilder'

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false)
  const [userKey, setUserKey] = useState('')

  function handleAuthenticated(publicKey: string) {
    setUserKey(publicKey)
    setAuthenticated(true)
  }

  return (
    <>
      <Head>
        <title>Dynamic Supply Chain with MNEE Payments</title>
        <meta name="description" content="Blockchain-based supply chain management with token rent payments" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Supply Chain</h1>
                <p className="text-xs text-gray-600">with MNEE Payments</p>
              </div>
            </div>

            <div className="w-80">
              <WalletAuth onAuthenticated={handleAuthenticated} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="py-8">
          {authenticated ? (
            <ActionChainBuilder ownerKey={userKey} />
          ) : (
            <div className="max-w-2xl mx-auto px-4">
              <div className="bg-white rounded-lg shadow-lg p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome to Supply Chain Builder
                  </h2>
                  <p className="text-lg text-gray-600">
                    Please connect your BSV wallet to start creating blockchain-based supply chains with token rent payments
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left space-y-3">
                  <h3 className="font-semibold text-blue-900">Features:</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Create multi-stage supply chain action chains
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Configure rent payments with MNEE stablecoins
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Store all data on BSV blockchain overlay network
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Track payments and ownership verification
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                © 2025 Open Run Asia. Powered by BSV Blockchain.
              </p>
              <div className="flex gap-6">
                <a href="https://github.com/bsv-blockchain" className="text-sm text-gray-600 hover:text-primary-600">
                  GitHub
                </a>
                <a href="https://docs.bsvblockchain.org" className="text-sm text-gray-600 hover:text-primary-600">
                  Documentation
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
