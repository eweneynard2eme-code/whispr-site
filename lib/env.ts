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

/**
 * Validates that a price ID is a valid Stripe price ID format
 * Stripe price IDs start with "price_" followed by alphanumeric characters
 */
function isValidStripePriceId(value: string): boolean {
  if (!value || typeof value !== "string") return false
  return /^price_[a-zA-Z0-9]+$/.test(value.trim())
}

/**
 * Gets a Stripe price ID from environment variables
 * Returns the value (may be empty string if not set)
 * Validation happens at runtime when price IDs are used
 * @param primary - Primary env var name
 * @param fallbacks - Optional fallback env var names
 * @returns The price ID value (may be empty if not set)
 */
function getStripePriceId(primary: string, ...fallbacks: string[]): string {
  return getEnv(primary, ...fallbacks).trim()
}

/**
 * Validates a Stripe price ID and throws a clear error if invalid
 * This is called at runtime (in API routes) when price IDs are actually used
 * @param value - The price ID to validate
 * @param envVarNames - The environment variable names (for error messages)
 * @throws Error if price ID is missing or invalid
 */
export function validateStripePriceId(value: string, ...envVarNames: string[]): string {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    const allNames = envVarNames.join(" or ")
    throw new Error(
      `Missing required Stripe price ID: ${allNames}. ` +
      `Please set this in your Vercel project settings.`
    )
  }
  
  const trimmed = value.trim()
  if (!isValidStripePriceId(trimmed)) {
    const allNames = envVarNames.join(" or ")
    throw new Error(
      `Invalid Stripe price ID format in ${allNames}. ` +
      `Expected format: price_xxxxx (got: "${trimmed}"). ` +
      `Please check your Vercel environment variables.`
    )
  }
  
  return trimmed
}

// Stripe price IDs - SINGLE SOURCE OF TRUTH
// All price IDs MUST come from environment variables
// No hardcoded values, no fallbacks to stale data
// Validation happens at runtime when used (not at module load)
export const ENV_STRIPE_PRICES = {
  PRIVATE_MOMENT: getStripePriceId(
    "STRIPE_PRICE_PRIVATE_MOMENT",
    "STRIPE_PRICE_ID_PRIVATE_MOMENT"
  ),
  INTIMATE_MOMENT: getStripePriceId(
    "STRIPE_PRICE_INTIMATE_MOMENT",
    "STRIPE_PRICE_ID_INTIMATE_MOMENT"
  ),
  EXCLUSIVE_MOMENT: getStripePriceId(
    "STRIPE_PRICE_EXCLUSIVE_MOMENT",
    "STRIPE_PRICE_ID_EXCLUSIVE_MOMENT"
  ),
  PRIVATE_PHOTO: getStripePriceId(
    "STRIPE_PRICE_PRIVATE_PHOTO",
    "STRIPE_PRICE_ID_PRIVATE_PHOTO"
  ),
  WHISPR_PLUS_MONTHLY: getStripePriceId(
    "STRIPE_PRICE_WHISPR_PLUS_MONTHLY",
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

