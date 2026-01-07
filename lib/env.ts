/**
 * Safe environment variable access with fallbacks
 * Supports multiple env var name formats for migration compatibility
 */

/**
 * Gets an environment variable with optional fallback names
 * @param primary - Primary env var name
 * @param fallbacks - Optional fallback env var names to try
 * @returns The env var value or empty string if not found
 */
export function getEnv(primary: string, ...fallbacks: string[]): string {
  // Try primary first
  if (typeof process !== "undefined" && process.env[primary]) {
    return process.env[primary]
  }

  // Try fallbacks
  for (const fallback of fallbacks) {
    if (typeof process !== "undefined" && process.env[fallback]) {
      return process.env[fallback]
    }
  }

  return ""
}

/**
 * Requires an environment variable (server-side only)
 * Throws a clear error if missing, but only in API routes (not during client render)
 * @param name - Environment variable name
 * @param fallbacks - Optional fallback names
 * @returns The env var value
 * @throws Error if variable is missing (server-side only)
 */
export function requireEnv(name: string, ...fallbacks: string[]): string {
  const value = getEnv(name, ...fallbacks)
  
  // Only throw on server-side (API routes)
  if (!value && typeof window === "undefined") {
    const allNames = [name, ...fallbacks].join(" or ")
    throw new Error(
      `Missing required environment variable: ${allNames}. ` +
      `Please set this in your Vercel project settings.`
    )
  }
  
  return value
}

// Stripe price IDs with fallback support
export const ENV_STRIPE_PRICES = {
  PRIVATE_MOMENT: getEnv(
    "STRIPE_PRICE_PRIVATE_MOMENT",
    "PRICE_ID_MOMENT_PRIVATE",
    "STRIPE_PRICE_ID_PRIVATE_MOMENT"
  ),
  INTIMATE_MOMENT: getEnv(
    "STRIPE_PRICE_INTIMATE_MOMENT",
    "PRICE_ID_MOMENT_INTIMATE",
    "STRIPE_PRICE_ID_INTIMATE_MOMENT"
  ),
  EXCLUSIVE_MOMENT: getEnv(
    "STRIPE_PRICE_EXCLUSIVE_MOMENT",
    "PRICE_ID_MOMENT_EXCLUSIVE",
    "STRIPE_PRICE_ID_EXCLUSIVE_MOMENT"
  ),
  PRIVATE_PHOTO: getEnv(
    "STRIPE_PRICE_PRIVATE_PHOTO",
    "PRICE_ID_PRIVATE_PHOTO",
    "STRIPE_PRICE_ID_PRIVATE_PHOTO"
  ),
  WHISPR_PLUS_MONTHLY: getEnv(
    "STRIPE_PRICE_WHISPR_PLUS_MONTHLY",
    "PRICE_ID_WHISPR_PLUS",
    "PRICE_ID_PLUS",
    "STRIPE_PRICE_ID_WHISPR_PLUS"
  ),
}

// Supabase (required, but safe access)
export const ENV_SUPABASE = {
  URL: typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_SUPABASE_URL || "") : "",
  ANON_KEY: typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "") : "",
  SERVICE_ROLE_KEY: typeof process !== "undefined" ? (process.env.SUPABASE_SERVICE_ROLE_KEY || "") : "",
}

// Stripe (server-side only)
export const ENV_STRIPE = {
  SECRET_KEY: typeof process !== "undefined" ? (process.env.STRIPE_SECRET_KEY || "") : "",
  WEBHOOK_SECRET: typeof process !== "undefined" ? (process.env.STRIPE_WEBHOOK_SECRET || "") : "",
  PUBLISHABLE_KEY: typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "") : "",
}

