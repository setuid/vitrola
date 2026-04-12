import { useEffect, useRef, useState } from 'react'

interface Options {
  onRefresh: () => void | Promise<void>
  enabled?: boolean
  threshold?: number
}

/**
 * Pull-to-refresh gesture hook for mobile.
 * Only activates when the window is scrolled to the top.
 * Applies a 0.5 resistance factor to the pull distance for natural feel.
 */
export function usePullToRefresh({ onRefresh, enabled = true, threshold = 80 }: Options) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Latest-ref pattern so event handlers always see current state
  // without having to re-attach listeners on every state change.
  const stateRef = useRef({ pullDistance, isRefreshing, onRefresh })
  stateRef.current = { pullDistance, isRefreshing, onRefresh }

  useEffect(() => {
    if (!enabled) return

    let startY: number | null = null

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || stateRef.current.isRefreshing) return
      startY = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (startY === null || stateRef.current.isRefreshing) return
      const currentY = e.touches[0].clientY
      const delta = currentY - startY

      if (delta > 0 && window.scrollY === 0) {
        // Apply resistance so the pull feels elastic.
        const distance = Math.min(delta * 0.5, threshold * 1.6)
        setPullDistance(distance)
        // Prevent native overscroll / browser pull-to-refresh only while pulling down.
        if (e.cancelable) e.preventDefault()
      } else if (delta < 0) {
        startY = null
        setPullDistance(0)
      }
    }

    const onTouchEnd = async () => {
      const shouldRefresh = stateRef.current.pullDistance >= threshold
      setPullDistance(0)
      startY = null

      if (shouldRefresh) {
        setIsRefreshing(true)
        try {
          await stateRef.current.onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [enabled, threshold])

  return { pullDistance, isRefreshing, threshold }
}
