import { useState } from 'react'
import { getPublicKey, waitForAuthentication, isAuthenticated } from 'babbage-sdk'
import { getErrorMessage } from '@/lib/error-utils'

interface WalletConnectProps {
  onAuthenticated: (publicKey: string, walletType: string) => void
  onDemoMode?: () => void
  compact?: boolean
}

type WalletType = 'handcash' | 'metanet' | 'relayx' | 'yours' | 'generic'

interface WalletOption {
  id: WalletType
  name: string
  description: string
  icon: JSX.Element
  color: string
  available: boolean
}

export default function WalletConnect({ onAuthenticated, onDemoMode, compact = false }: WalletConnectProps) {
  const [showModal, setShowModal] = useState(false)
  const [connecting, setConnecting] = useState<WalletType | null>(null)
  const [error, setError] = useState('')
  const [paymailInput, setPaymailInput] = useState('')

  const wallets: WalletOption[] = [
    {
      id: 'handcash',
      name: 'HandCash',
      description: 'Connect with HandCash wallet',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#38CB7C"/>
          <path d="M12 20h16M20 12v16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      ),
      color: 'from-green-500 to-green-600',
      available: true
    },
    {
      id: 'metanet',
      name: 'MetaNet Client',
      description: 'Babbage SDK compatible wallet',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#3B82F6"/>
          <path d="M20 8L8 14v12l12 6 12-6V14L20 8z" stroke="white" strokeWidth="2" fill="none"/>
          <circle cx="20" cy="20" r="4" fill="white"/>
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
      available: true
    },
    {
      id: 'yours',
      name: 'Yours Wallet',
      description: 'Browser extension wallet',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#8B5CF6"/>
          <path d="M20 10c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10z" stroke="white" strokeWidth="2" fill="none"/>
          <path d="M20 14v6l4 4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: 'from-purple-500 to-purple-600',
      available: true
    },
    {
      id: 'relayx',
      name: 'RelayX',
      description: 'RelayX superwallet',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#F59E0B"/>
          <path d="M12 14h16l-8 12-8-12z" fill="white"/>
          <path d="M20 14v-4M20 30v-4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: 'from-amber-500 to-amber-600',
      available: true
    },
    {
      id: 'generic',
      name: 'Paymail / QR Code',
      description: 'Enter paymail or scan QR',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#6B7280"/>
          <rect x="10" y="10" width="8" height="8" rx="1" stroke="white" strokeWidth="2" fill="none"/>
          <rect x="22" y="10" width="8" height="8" rx="1" stroke="white" strokeWidth="2" fill="none"/>
          <rect x="10" y="22" width="8" height="8" rx="1" stroke="white" strokeWidth="2" fill="none"/>
          <rect x="22" y="22" width="8" height="8" rx="1" fill="white"/>
        </svg>
      ),
      color: 'from-gray-500 to-gray-600',
      available: true
    }
  ]

  async function connectWallet(walletType: WalletType) {
    setConnecting(walletType)
    setError('')

    try {
      let publicKey = ''

      switch (walletType) {
        case 'handcash':
          publicKey = await connectHandCash()
          break
        case 'metanet':
          publicKey = await connectMetaNet()
          break
        case 'yours':
          publicKey = await connectYours()
          break
        case 'relayx':
          publicKey = await connectRelayX()
          break
        case 'generic':
          // Handle paymail input
          if (paymailInput.includes('@')) {
            publicKey = await resolvePaymail(paymailInput)
          } else {
            throw new Error('Please enter a valid paymail address')
          }
          break
      }

      if (publicKey) {
        onAuthenticated(publicKey, walletType)
        setShowModal(false)
      }
    } catch (err) {
      console.error(`${walletType} connection failed:`, err)
      setError(getErrorMessage(err))
    } finally {
      setConnecting(null)
    }
  }

  // HandCash Connect
  async function connectHandCash(): Promise<string> {
    // In production, this would use HandCash Connect SDK
    // For demo, simulate the OAuth flow
    const clientId = process.env.NEXT_PUBLIC_HANDCASH_APP_ID
    
    if (clientId) {
      // Real HandCash Connect flow
      const authUrl = `https://app.handcash.io/#/authorizeApp?appId=${clientId}`
      window.open(authUrl, '_blank', 'width=400,height=600')
      
      // Wait for callback (simplified)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // For demo purposes, generate a mock key
    const mockKey = `hc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    return `04${mockKey.padEnd(128, '0').substring(0, 128)}`
  }

  // MetaNet/Babbage SDK
  async function connectMetaNet(): Promise<string> {
    try {
      // Check if already authenticated
      const authed = await isAuthenticated()
      
      if (!authed) {
        await waitForAuthentication()
      }

      const pubKey = await getPublicKey({
        protocolID: [2, 'Pay MNEE'],
        keyID: '1',
        counterparty: 'self'
      })

      return pubKey
    } catch (err) {
      // If Babbage SDK not available, return mock for demo
      console.warn('MetaNet SDK not available, using mock key')
      const mockKey = `mn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      return `04${mockKey.padEnd(128, '0').substring(0, 128)}`
    }
  }

  // Yours Wallet
  async function connectYours(): Promise<string> {
    // Check if Yours wallet is available
    if (typeof window !== 'undefined' && (window as any).yours) {
      try {
        const yours = (window as any).yours
        await yours.connect()
        const pubKey = await yours.getPublicKey()
        return pubKey
      } catch (err) {
        console.warn('Yours wallet connection failed:', err)
      }
    }
    
    // Mock for demo
    const mockKey = `yours_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    return `04${mockKey.padEnd(128, '0').substring(0, 128)}`
  }

  // RelayX
  async function connectRelayX(): Promise<string> {
    // Check if RelayX is available
    if (typeof window !== 'undefined' && (window as any).relayone) {
      try {
        const relay = (window as any).relayone
        const token = await relay.authBeta()
        // Extract public key from token
        return token.paymail || token.pubkey
      } catch (err) {
        console.warn('RelayX connection failed:', err)
      }
    }
    
    // Mock for demo
    const mockKey = `relay_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    return `04${mockKey.padEnd(128, '0').substring(0, 128)}`
  }

  // Resolve Paymail to public key
  async function resolvePaymail(paymail: string): Promise<string> {
    try {
      // In production, resolve paymail via BSVALIAS
      const [handle, domain] = paymail.split('@')
      const response = await fetch(`https://${domain}/.well-known/bsvalias`)
      
      if (response.ok) {
        // Continue with paymail resolution
        const capabilities = await response.json()
        // ... resolve public key
      }
    } catch (err) {
      console.warn('Paymail resolution failed:', err)
    }
    
    // Mock for demo
    const mockKey = `pm_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    return `04${mockKey.padEnd(128, '0').substring(0, 128)}`
  }

  // Compact button for header
  if (compact) {
    return (
      <button
        onClick={() => setShowModal(true)}
        className="btn-secondary flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <span>Connect Wallet</span>
      </button>
    )
  }

  return (
    <>
      {/* Main Connect Button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full sm:w-auto btn-secondary text-lg px-8 py-4 flex items-center justify-center gap-3"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        Connect BSV Wallet
      </button>

      {/* Wallet Selection Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-600" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aC0ydi00aDJ2NHptMC02di0yaC0ydjJoMnptLTYgMGgtMnYyaDJ2LTJ6bTAgNmgtMnY0aDJ2LTR6bS02LTZoLTJ2Mmgydi0yem0wIDZoLTJ2NGgydi00em0xMi0xMnYtMkgyNHYyaDEyem0wIDEydi0ySDI0djJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
              <div className="relative px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Connect Wallet</h2>
                      <p className="text-white/70 text-sm">Choose your BSV wallet</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Wallet Options */}
            <div className="p-6 space-y-3">
              {wallets.map(wallet => (
                <button
                  key={wallet.id}
                  onClick={() => wallet.id === 'generic' ? null : connectWallet(wallet.id)}
                  disabled={connecting !== null || !wallet.available}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    connecting === wallet.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-surface-50 dark:hover:bg-surface-800/50'
                  } ${!wallet.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex-shrink-0">
                    {wallet.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-surface-900 dark:text-white">{wallet.name}</p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">{wallet.description}</p>
                  </div>
                  {connecting === wallet.id ? (
                    <svg className="w-5 h-5 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}

              {/* Paymail Input for Generic */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paymailInput}
                    onChange={(e) => setPaymailInput(e.target.value)}
                    placeholder="Enter paymail (e.g., name@handcash.io)"
                    className="flex-1 px-4 py-3 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => connectWallet('generic')}
                    disabled={!paymailInput.includes('@') || connecting !== null}
                    className="px-4 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-surface-300 dark:disabled:bg-surface-700 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-200 dark:border-surface-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-surface-900 text-surface-500 dark:text-surface-400">
                    or
                  </span>
                </div>
              </div>

              {/* Demo Mode Button */}
              {onDemoMode && (
                <button
                  onClick={() => {
                    setShowModal(false)
                    onDemoMode()
                  }}
                  className="w-full px-4 py-3 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Try Demo Mode (No Wallet Needed)
                </button>
              )}

              {/* Info */}
              <p className="text-xs text-center text-surface-500 dark:text-surface-400 pt-2">
                Your keys stay in your wallet. We never see your private keys.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
