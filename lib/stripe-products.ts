import "server-only"
import { ENV_STRIPE_PRICES, validateStripePriceId } from "@/lib/env"

export type MomentLevel = "private" | "intimate" | "exclusive"

export interface StripeProduct {
  priceId: string
  name: string
  description: string
  priceInCents: number
  mode: "payment" | "subscription"
}

/**
 * Gets a validated price ID for a product
 * Throws a clear error if missing or invalid
 */
function getValidatedPriceId(
  value: string,
  productName: string,
  ...envVarNames: string[]
): string {
  return validateStripePriceId(value, ...envVarNames)
}

// Product catalog - SINGLE SOURCE OF TRUTH for Stripe prices
// All price IDs come from ENV_STRIPE_PRICES (which validates on load)
export const STRIPE_PRODUCTS = {
  // One-time moment purchases
  moment: {
    private: {
      priceId: ENV_STRIPE_PRICES.PRIVATE_MOMENT,
      name: "Private Moment",
      description: "A conversation that doesn't happen in public.",
      priceInCents: 399,
      mode: "payment" as const,
    },
    intimate: {
      priceId: ENV_STRIPE_PRICES.INTIMATE_MOMENT,
      name: "Intimate Moment",
      description: "He lowers his voice. This moment brings you closer.",
      priceInCents: 499,
      mode: "payment" as const,
    },
    exclusive: {
      priceId: ENV_STRIPE_PRICES.EXCLUSIVE_MOMENT,
      name: "Exclusive Moment",
      description: "Some moments are only shared once.",
      priceInCents: 699,
      mode: "payment" as const,
    },
  },
  // One-time media purchase
  media: {
    priceId: ENV_STRIPE_PRICES.PRIVATE_PHOTO,
    name: "Private Photo",
    description: "Something you weren't meant to see.",
    subtitle: "He hesitated before sending it. It's not explicit. It's just… intimate.",
    priceInCents: 199,
    mode: "payment" as const,
  },
  // Subscription
  plus: {
    priceId: ENV_STRIPE_PRICES.WHISPR_PLUS_MONTHLY,
    name: "WHISPR Plus",
    description: "A different kind of access.",
    priceInCents: 1299,
    mode: "subscription" as const,
    benefits: [
      "Access all Private + Intimate moments",
      "Fewer interruptions, smoother conversations",
      "Characters engage more personally and remember more",
      "Early access to selected moments and features",
    ],
    footnote: "Exclusive moments and private media remain one-time unlocks.",
  },
} as const

export function getMomentProduct(level: MomentLevel): StripeProduct {
  const product = STRIPE_PRODUCTS.moment[level]
  // Validate price ID at runtime (when actually used)
  const envVarNames = level === "private"
    ? ["STRIPE_PRICE_PRIVATE_MOMENT", "STRIPE_PRICE_ID_PRIVATE_MOMENT"]
    : level === "intimate"
    ? ["STRIPE_PRICE_INTIMATE_MOMENT", "STRIPE_PRICE_ID_INTIMATE_MOMENT"]
    : ["STRIPE_PRICE_EXCLUSIVE_MOMENT", "STRIPE_PRICE_ID_EXCLUSIVE_MOMENT"]
  
  return {
    ...product,
    priceId: getValidatedPriceId(product.priceId, `Moment (${level})`, ...envVarNames),
  }
}

export function getMediaProduct(): StripeProduct {
  const product = STRIPE_PRODUCTS.media
  return {
    ...product,
    priceId: getValidatedPriceId(
      product.priceId,
      "Private Photo",
      "STRIPE_PRICE_PRIVATE_PHOTO",
      "STRIPE_PRICE_ID_PRIVATE_PHOTO"
    ),
  }
}

export function getPlusProduct() {
  const product = STRIPE_PRODUCTS.plus
  return {
    ...product,
    priceId: getValidatedPriceId(
      product.priceId,
      "WHISPR Plus",
      "STRIPE_PRICE_WHISPR_PLUS_MONTHLY",
      "STRIPE_PRICE_ID_WHISPR_PLUS"
    ),
  }
}

// Price display helpers
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
