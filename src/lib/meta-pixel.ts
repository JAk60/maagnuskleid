// src/lib/meta-pixel.ts

declare global {
  interface Window {
    fbq: (
      method: string,
      eventName: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void
    _fbq: unknown
  }
}

export const fbq = (
  eventName: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
): void => {
  if (typeof window === "undefined") return
  if (typeof window.fbq !== "function") return

  // Block parameterless auto-Purchase (fired by FB's purchase detection)
  if (eventName === "Purchase" && !params) {
    console.warn("Blocked auto Purchase event")
    return
  }

  if (params && options) {
    window.fbq("track", eventName, params, options)
  } else if (params) {
    window.fbq("track", eventName, params)
  } else {
    window.fbq("track", eventName)
  }
}