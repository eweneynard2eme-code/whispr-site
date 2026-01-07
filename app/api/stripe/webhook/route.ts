import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import type Stripe from "stripe"
import { ENV_SUPABASE, ENV_STRIPE } from "@/lib/env"

// Disable body parsing for webhook
export const runtime = "nodejs"

async function getSupabaseAdmin() {
  // Use service role for webhook operations
  const { createClient: createAdminClient } = await import("@supabase/supabase-js")
  return createAdminClient(ENV_SUPABASE.URL, ENV_SUPABASE.SERVICE_ROLE_KEY)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  const webhookSecret = ENV_STRIPE.WEBHOOK_SECRET
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("[v0] Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = await getSupabaseAdmin()

  // Idempotency check
  const { data: existingEvent } = await supabase.from("payments").select("id").eq("stripe_event_id", event.id).single()

  if (existingEvent) {
    console.log("[v0] Event already processed:", event.id)
    return NextResponse.json({ received: true })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(supabase, session, event.id)
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(supabase, invoice, event.id)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(supabase, subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(supabase, subscription)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook handler error:", error)
    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }
}

async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session, eventId: string) {
  const metadata = session.metadata || {}
  const { userId, purchaseType, characterId, situationId, momentLevel, mediaId } = metadata

  if (!userId) {
    console.error("[v0] No userId in checkout session metadata")
    return
  }

  // Record payment
  await supabase.from("payments").insert({
    user_id: userId,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent as string,
    stripe_subscription_id: session.subscription as string,
    stripe_event_id: eventId,
    type: purchaseType,
    moment_level: momentLevel,
    character_id: characterId,
    situation_id: situationId,
    media_id: mediaId,
    amount: session.amount_total,
    currency: session.currency,
    status: "completed",
    metadata,
  })

  // Create unlock based on purchase type
  if (purchaseType === "moment") {
    await supabase.from("unlocks").upsert(
      {
        user_id: userId,
        type: "moment",
        character_id: characterId,
        situation_id: situationId,
        moment_level: momentLevel,
      },
      {
        onConflict: "user_id,type,character_id,situation_id,moment_level",
        ignoreDuplicates: true,
      },
    )
  } else if (purchaseType === "media") {
    await supabase.from("unlocks").upsert(
      {
        user_id: userId,
        type: "media",
        character_id: characterId,
        media_id: mediaId,
      },
      {
        onConflict: "user_id,type,character_id,media_id",
        ignoreDuplicates: true,
      },
    )
  } else if (purchaseType === "plus") {
    await supabase.from("entitlements").upsert(
      {
        user_id: userId,
        has_plus: true,
        plus_status: "active",
        stripe_subscription_id: session.subscription as string,
      },
      { onConflict: "user_id" },
    )
  }

  console.log(`[v0] Processed ${purchaseType} purchase for user ${userId}`)
}

async function handleInvoicePaid(supabase: any, invoice: Stripe.Invoice, eventId: string) {
  if (!invoice.subscription) return

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
  const customerId = invoice.customer as string

  // Find user by stripe customer id
  const { data: entitlements } = await supabase
    .from("entitlements")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!entitlements) {
    console.error("[v0] No user found for customer:", customerId)
    return
  }

  await supabase
    .from("entitlements")
    .update({
      has_plus: true,
      plus_status: "active",
      plus_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq("user_id", entitlements.user_id)

  console.log(`[v0] Invoice paid - updated Plus for user ${entitlements.user_id}`)
}

async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const { data: entitlements } = await supabase
    .from("entitlements")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!entitlements) return

  const status =
    subscription.status === "active" ? "active" : subscription.status === "past_due" ? "past_due" : "canceled"

  await supabase
    .from("entitlements")
    .update({
      has_plus: subscription.status === "active",
      plus_status: status,
      plus_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq("user_id", entitlements.user_id)
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const { data: entitlements } = await supabase
    .from("entitlements")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!entitlements) return

  await supabase
    .from("entitlements")
    .update({
      has_plus: false,
      plus_status: "canceled",
    })
    .eq("user_id", entitlements.user_id)

  console.log(`[v0] Subscription canceled for user ${entitlements.user_id}`)
}
