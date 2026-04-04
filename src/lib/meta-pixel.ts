// src/lib/meta-pixel.ts
// Safe wrapper around window.fbq — handles SSR and unloaded pixel gracefully

declare global {
  interface Window {
    fbq: (
      method: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void
    _fbq: unknown
  }
}

export const fbq = (
  eventName: string,
  params?: Record<string, unknown>
): void => {
  if (typeof window === 'undefined') return
  if (typeof window.fbq !== 'function') return
  if (params) {
    window.fbq('track', eventName, params)
  } else {
    window.fbq('track', eventName)
  }
}