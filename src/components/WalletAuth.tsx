import { useState, useEffect } from 'react'
import { getPublicKey, waitForAuthentication, isAuthenticated } from 'babbage-sdk'
import { getErrorMessage } from '@/lib/error-utils'

interface WalletAuthProps {
  onAuthenticated?: (publicKey: string) => void
}

export default function WalletAuth({ onAuthenticated }: WalletAuthProps) {
  const [authenticated, setAuthenticated] = useState(false)
  const [identityKey, setIdentityKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuthentication()
  }, [])

  async function checkAuthentication() {
    try {
      const authed = await isAuthenticated()
      if (authed) {
        await loadIdentityKey()
      }
    } catch (err) {
      console.error('Failed to check authentication:', err)
    }
  }

  async function loadIdentityKey() {
    try {
      const pubKey = await getPublicKey({
        protocolID: [2, 'Pay MNEE'],
        keyID: '1',
        counterparty: 'self'
      })
      
      setIdentityKey(pubKey)
      setAuthenticated(true)
      
      if (onAuthenticated) {
        onAuthenticated(pubKey)
      }
    } catch (err) {
      console.error('Failed to load identity key:', err)
      setError('Failed to load identity key')
    }
  }

  async function authenticateWallet() {
    setLoading(true)
    setError('')
    
    try {
      await waitForAuthentication(/* any required options */);
      setAuthenticated(true);
    } catch (error) {
      console.error('Authentication failed:', getErrorMessage(error));
      setAuthenticated(false);
    } finally {
      setLoading(false)
    }
  }

  if (authenticated) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Connected</span>
        </div>
        <div className="flex-1 text-sm text-emerald-700 dark:text-emerald-400 font-mono truncate">
          {identityKey.substring(0, 8)}...{identityKey.substring(identityKey.length - 8)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={authenticateWallet}
        disabled={loading}
        className="w-full btn-secondary flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Connect BSV Wallet</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}
      
      <p className="text-xs text-surface-500 dark:text-surface-400 text-center">
        Requires a BSV wallet with Babbage SDK support
      </p>
    </div>
  )
}
