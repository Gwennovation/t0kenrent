import { useEffect, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
  children: ReactNode
}

export default function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Only render on the client side and after component mounts
  if (!mounted || typeof document === 'undefined') {
    return null
  }

  // Create portal to document.body to escape any stacking context
  return createPortal(
    <>{children}</>,
    document.body
  )
}
