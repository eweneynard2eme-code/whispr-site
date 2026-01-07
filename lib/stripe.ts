import "server-only"

import Stripe from "stripe"
import { ENV_STRIPE } from "@/lib/env"

// Lazy initialization to avoid build-time crashes
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = ENV_STRIPE.SECRET_KEY
    if (!secretKey) {
      throw new Error(
        "Missing required environment variable: STRIPE_SECRET_KEY. " +
        "Please set this in your Vercel project settings."
      )
    }
    stripeInstance = new Stripe(secretKey)
  }
  return stripeInstance
}

// Export for backward compatibility (lazy-loaded)
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})
