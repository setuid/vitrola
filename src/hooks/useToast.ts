import { useState, useCallback } from 'react'

type ToastVariant = 'default' | 'success' | 'destructive'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

let listeners: ((toasts: Toast[]) => void)[] = []
let toastQueue: Toast[] = []

function dispatch(toasts: Toast[]) {
  toastQueue = toasts
  listeners.forEach((l) => l(toasts))
}

export function toast({
  title,
  description,
  variant = 'default',
}: {
  title: string
  description?: string
  variant?: ToastVariant
}) {
  const id = Math.random().toString(36).slice(2)
  dispatch([...toastQueue, { id, title, description, variant }])
  setTimeout(() => {
    dispatch(toastQueue.filter((t) => t.id !== id))
  }, 4000)
}

export function useToastState() {
  const [toasts, setToasts] = useState<Toast[]>(toastQueue)

  const subscribe = useCallback(() => {
    const listener = (t: Toast[]) => setToasts([...t])
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  useState(subscribe)

  const dismiss = (id: string) => dispatch(toastQueue.filter((t) => t.id !== id))

  return { toasts, dismiss }
}
