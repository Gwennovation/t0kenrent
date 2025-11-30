import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { ThemeProvider } from '@/context/ThemeContext'

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent flash of unstyled content
  if (!mounted) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900" />
    )
  }

  return (
    <ThemeProvider defaultTheme="system">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
      </Head>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
