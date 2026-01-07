/**
 * Debug mode utilities
 * Controlled by ?debug=1 query parameter
 */

export function isDebugMode(): boolean {
  if (typeof window === "undefined") return false
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get("debug") === "1"
  } catch {
    return false
  }
}

export function debugLog(category: string, message: string, data?: any) {
  if (isDebugMode() || process.env.NODE_ENV === "development") {
    console.log(`[DEBUG:${category}]`, message, data || "")
  }
}

export function debugError(category: string, error: Error | unknown, context?: any) {
  const errorObj = error instanceof Error ? error : new Error(String(error))
  console.error(`[DEBUG:${category}]`, {
    message: errorObj.message,
    stack: errorObj.stack,
    name: errorObj.name,
    context,
  })
  
  // In production, always log errors even without debug mode
  if (process.env.NODE_ENV === "production") {
    console.error(`[PROD_ERROR:${category}]`, errorObj.message, context)
  }
}

