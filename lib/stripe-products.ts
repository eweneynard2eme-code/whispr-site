import "server-only"

export type MomentLevel = "private" | "intimate" | "exclusive"

export interface StripeProduct {
  priceId: string
  name: string
  description: string
  priceInCents: number
  mode: "payment" | "subscription"
}

// Product catalog - prices from env vars, fallback to empty for build
export const STRIPE_PRODUCTS = {
  // One-time moment purchases
  moment: {
    private: {
      priceId: process.env.STRIPE_PRICE_PRIVATE_MOMENT || "",
      name: "Private Moment",
      description: "A conversation that doesn't happen in public.",
      priceInCents: 399,
      mode: "payment" as const,
    },
    intimate: {
      priceId: process.env.STRIPE_PRICE_INTIMATE_MOMENT || "",
      name: "Intimate Moment",
      description: "He lowers his voice. This moment brings you closer.",
      priceInCents: 499,
      mode: "payment" as const,
    },
    exclusive: {
      priceId: process.env.STRIPE_PRICE_EXCLUSIVE_MOMENT || "",
      name: "Exclusive Moment",
      description: "Some moments are only shared once.",
      priceInCents: 699,
      mode: "payment" as const,
    },
  },
  // One-time media purchase
  media: {
    priceId: process.env.STRIPE_PRICE_PRIVATE_PHOTO || "",
    name: "Private Photo",
    description: "Something you weren't meant to see.",
    subtitle: "He hesitated before sending it. It's not explicit. It's just… intimate.",
    priceInCents: 199,
    mode: "payment" as const,
  },
  // Subscription
  plus: {
    priceId: process.env.STRIPE_PRICE_WHISPR_PLUS_MONTHLY || "",
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
  return STRIPE_PRODUCTS.moment[level]
}

export function getMediaProduct(): StripeProduct {
  return STRIPE_PRODUCTS.media
}

export function getPlusProduct() {
  return STRIPE_PRODUCTS.plus
}

// Price display helpers
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
