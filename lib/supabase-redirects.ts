/**
 * Supabase redirect URL management
 * Ensures all allowed redirect URLs are configured
 */

const ALLOWED_REDIRECT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://v0-whispr-tau.vercel.app",
  // Add custom domains here
]

export function getAllowedRedirectUrl(path: string = "/discover"): string {
  if (typeof window === "undefined") {
    // Server-side: use env var or default
    return process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `https://v0-whispr-tau.vercel.app${path}`
  }

  const origin = window.location.origin
  const redirectUrl = `${origin}${path}`

  // Warn in debug mode if origin is not in allowed list
  if (process.env.NODE_ENV === "development") {
    const isAllowed = ALLOWED_REDIRECT_ORIGINS.some((allowed) => origin.startsWith(allowed))
    if (!isAllowed) {
      console.warn(
        `[SUPABASE_REDIRECT] Current origin ${origin} is not in allowed list. ` +
        `Make sure to add it to Supabase dashboard redirect URLs.`
      )
    }
  }

  return redirectUrl
}

export function getAuthCallbackUrl(): string {
  return getAllowedRedirectUrl("/auth/callback")
}



