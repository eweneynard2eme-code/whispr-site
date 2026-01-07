import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { MomentLevel } from "@/lib/stripe-products"

export interface UserEntitlements {
  hasPlus: boolean
  plusStatus: "active" | "past_due" | "canceled" | "none"
  plusCurrentPeriodEnd: Date | null
  stripeCustomerId: string | null
}

export interface UnlockCheck {
  isUnlocked: boolean
  reason: "plus" | "purchased" | "free" | null
}

// Get user's subscription entitlements
export async function getUserEntitlements(userId: string): Promise<UserEntitlements | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("entitlements").select("*").eq("user_id", userId).single()

  if (error || !data) {
    return null
  }

  return {
    hasPlus: data.has_plus || false,
    plusStatus: data.plus_status || "none",
    plusCurrentPeriodEnd: data.plus_current_period_end ? new Date(data.plus_current_period_end) : null,
    stripeCustomerId: data.stripe_customer_id,
  }
}

// Check if a specific moment is unlocked for user
export async function checkMomentUnlock(
  userId: string,
  characterId: string,
  situationId: string,
  momentLevel: MomentLevel,
): Promise<UnlockCheck> {
  const supabase = await createClient()

  // First check if user has Plus subscription (covers private + intimate)
  if (momentLevel !== "exclusive") {
    const entitlements = await getUserEntitlements(userId)
    if (entitlements?.hasPlus && entitlements.plusStatus === "active") {
      return { isUnlocked: true, reason: "plus" }
    }
  }

  // Check for one-time purchase
  const { data } = await supabase
    .from("unlocks")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "moment")
    .eq("character_id", characterId)
    .eq("situation_id", situationId)
    .eq("moment_level", momentLevel)
    .single()

  if (data) {
    return { isUnlocked: true, reason: "purchased" }
  }

  return { isUnlocked: false, reason: null }
}

// Check if a specific media is unlocked
export async function checkMediaUnlock(userId: string, characterId: string, mediaId: string): Promise<UnlockCheck> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("unlocks")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "media")
    .eq("character_id", characterId)
    .eq("media_id", mediaId)
    .single()

  if (data) {
    return { isUnlocked: true, reason: "purchased" }
  }

  return { isUnlocked: false, reason: null }
}

// Get all unlocks for a user (for bulk checking)
export async function getUserUnlocks(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("unlocks").select("*").eq("user_id", userId)

  if (error) {
    console.error("[v0] Error fetching unlocks:", error)
    return []
  }

  return data || []
}

// Create or get Stripe customer for user
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string | null> {
  const supabase = await createClient()
  const { stripe } = await import("@/lib/stripe")

  // Check existing
  const { data: entitlements } = await supabase
    .from("entitlements")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single()

  if (entitlements?.stripe_customer_id) {
    return entitlements.stripe_customer_id
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  })

  // Store in entitlements
  await supabase.from("entitlements").upsert(
    {
      user_id: userId,
      stripe_customer_id: customer.id,
    },
    { onConflict: "user_id" },
  )

  return customer.id
}
