import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize Babbage SDK
    if (typeof window !== 'undefined') {
      console.log('App initialized')
    }
  }, [])

  return <Component {...pageProps} />
}
