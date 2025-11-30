import { useEffect, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
  children: ReactNode
}

export default function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false)
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Try to find the modal-root, fallback to creating one
    let root = document.getElementById('modal-root')
    if (!root) {
      root = document.createElement('div')
      root.id = 'modal-root'
      root.style.position = 'fixed'
      root.style.top = '0'
      root.style.left = '0'
      root.style.width = '100%'
      root.style.height = '100%'
      root.style.pointerEvents = 'none'
      root.style.zIndex = '99999'
      document.body.appendChild(root)
    }
    setPortalRoot(root)
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Only render on the client side and after component mounts
  if (!mounted || !portalRoot) {
    return null
  }

  // Create portal to modal-root to escape any stacking context
  return createPortal(
    <div style={{ pointerEvents: 'auto' }}>{children}</div>,
    portalRoot
  )
}
