import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string
      reset: (id: string) => void
      remove: (id: string) => void
    }
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('turnstile'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export interface TurnstileHandle {
  reset: () => void
}

interface Props {
  siteKey: string
  onToken: (token: string) => void
  onError: () => void
}

/** Verificación anti-bots de Cloudflare Turnstile (sin cookies publicitarias ni rastreo). */
export const Turnstile = forwardRef<TurnstileHandle, Props>(function Turnstile({ siteKey, onToken, onError }, ref) {
  const container = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const callbacks = useRef({ onToken, onError })
  callbacks.current = { onToken, onError }

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
      callbacks.current.onToken('')
    },
  }))

  useEffect(() => {
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return
        widgetId.current = window.turnstile.render(container.current, {
          sitekey: siteKey,
          action: 'registro',
          language: 'es',
          size: 'flexible',
          callback: (token: string) => callbacks.current.onToken(token),
          'expired-callback': () => callbacks.current.onToken(''),
          'error-callback': () => {
            callbacks.current.onToken('')
            callbacks.current.onError()
          },
        })
      })
      .catch(() => callbacks.current.onError())
    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
      widgetId.current = null
    }
  }, [siteKey])

  return <div ref={container} className="min-h-[65px]" />
})
