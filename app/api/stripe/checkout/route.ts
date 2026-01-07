import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { getMomentProduct, getMediaProduct, getPlusProduct, type MomentLevel } from "@/lib/stripe-products"
import { getOrCreateStripeCustomer } from "@/lib/entitlements"

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log("[STRIPE CHECKOUT] Request received", { requestId })

  try {
    let body: any
    try {
      body = await request.json()
      console.log("[STRIPE CHECKOUT] Request body:", { requestId, body: JSON.stringify(body) })
    } catch (parseError: any) {
      console.error("[STRIPE CHECKOUT] Failed to parse request body:", {
        requestId,
        error: parseError?.message,
        stack: parseError?.stack,
      })
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Support both new priceId format and legacy purchaseType format
    const { priceId, metadata: clientMetadata, purchaseType, characterId, situationId, momentLevel, mediaId } = body

    // Get authenticated user
    console.log("[STRIPE CHECKOUT] Getting authenticated user...", { requestId })
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[STRIPE CHECKOUT] No authenticated user", { requestId })
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.log("[STRIPE CHECKOUT] User authenticated:", { requestId, userId: user.id, email: user.email })

    // Get or create Stripe customer
    console.log("[STRIPE CHECKOUT] Getting/creating Stripe customer...", { requestId })
    const customerId = await getOrCreateStripeCustomer(user.id, user.email || "")
    if (!customerId) {
      console.error("[STRIPE CHECKOUT] Failed to create/get customer", { requestId, userId: user.id })
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
    }
    console.log("[STRIPE CHECKOUT] Customer ID:", { requestId, customerId })

    // Build URLs using APP_URL from env, fallback to origin
    const appUrl = process.env.APP_URL || new URL(request.url).origin
    const baseUrl = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`

    const successUrl = `${baseUrl}/pay/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/pay/cancel`
    console.log("[STRIPE CHECKOUT] URLs:", { requestId, successUrl, cancelUrl, appUrl })

    let lineItems: any[] = []
    let mode: "payment" | "subscription" = "payment"
    let metadata: Record<string, string> = {
      userId: user.id,
      ...(clientMetadata || {}),
    }

    // NEW: Direct priceId support (preferred)
    if (priceId) {
      if (!priceId || typeof priceId !== "string") {
        console.error("[STRIPE CHECKOUT] Invalid priceId", { requestId, priceId })
        return NextResponse.json({ error: "Invalid priceId" }, { status: 400 })
      }

      // Determine mode by checking if priceId starts with subscription indicators
      // For now, default to payment. If it's a subscription, the caller should specify in metadata
      // or we can check the price object, but that requires an API call
      mode = clientMetadata?.mode === "subscription" ? "subscription" : "payment"

      lineItems = [{ price: priceId, quantity: 1 }]
      console.log("[STRIPE CHECKOUT] Using direct priceId:", { requestId, priceId, mode })
    }
    // LEGACY: Support old purchaseType format for backward compatibility
    else if (purchaseType) {
      metadata.purchaseType = purchaseType

      if (purchaseType === "moment") {
        if (!momentLevel) {
          console.error("[STRIPE CHECKOUT] Missing momentLevel for moment purchase", { requestId })
          return NextResponse.json({ error: "Missing momentLevel" }, { status: 400 })
        }

        const product = getMomentProduct(momentLevel as MomentLevel)
        console.log("[STRIPE CHECKOUT] Moment product:", { requestId, product })

        if (!product.priceId) {
          console.error("[STRIPE CHECKOUT] No priceId configured for moment level:", {
            requestId,
            momentLevel,
          })
          return NextResponse.json(
            {
              error: `Price not configured for ${momentLevel}. Check STRIPE_PRICE_${momentLevel.toUpperCase()}_MOMENT env var.`,
            },
            { status: 500 },
          )
        }

        lineItems = [{ price: product.priceId, quantity: 1 }]
        metadata = { ...metadata, characterId: characterId || "", situationId: situationId || "", momentLevel }
      } else if (purchaseType === "media") {
        const product = getMediaProduct()
        console.log("[STRIPE CHECKOUT] Media product:", { requestId, product })

        if (!product.priceId) {
          console.error("[STRIPE CHECKOUT] No priceId configured for media", { requestId })
          return NextResponse.json(
            { error: "Media price not configured. Check STRIPE_PRICE_PRIVATE_PHOTO env var." },
            { status: 500 },
          )
        }

        lineItems = [{ price: product.priceId, quantity: 1 }]
        metadata = { ...metadata, characterId: characterId || "", mediaId: mediaId || "" }
      } else if (purchaseType === "plus") {
        const product = getPlusProduct()
        console.log("[STRIPE CHECKOUT] Plus product:", { requestId, product })

        if (!product.priceId) {
          console.error("[STRIPE CHECKOUT] No priceId configured for Plus subscription", { requestId })
          return NextResponse.json(
            { error: "Subscription price not configured. Check STRIPE_PRICE_WHISPR_PLUS_MONTHLY env var." },
            { status: 500 },
          )
        }

        lineItems = [{ price: product.priceId, quantity: 1 }]
        mode = "subscription"
      } else {
        console.error("[STRIPE CHECKOUT] Invalid purchaseType:", { requestId, purchaseType })
        return NextResponse.json({ error: "Invalid purchase type" }, { status: 400 })
      }
    } else {
      console.error("[STRIPE CHECKOUT] Missing priceId or purchaseType", { requestId, body })
      return NextResponse.json(
        { error: "Missing required field: priceId or purchaseType" },
        { status: 400 },
      )
    }

    console.log("[STRIPE CHECKOUT] Creating checkout session...", {
      requestId,
      lineItems: JSON.stringify(lineItems),
      mode,
      metadata: JSON.stringify(metadata),
    })

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      allow_promotion_codes: true,
    })

    console.log("[STRIPE CHECKOUT] Session created successfully!", {
      requestId,
      sessionId: session.id,
      url: session.url,
    })

    if (!session.url) {
      console.error("[STRIPE CHECKOUT] No URL in session response", { requestId, sessionId: session.id })
      return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("[STRIPE CHECKOUT] Unhandled error:", {
      requestId,
      error: error?.message,
      stack: error?.stack,
      name: error?.name,
    })

    const errorMessage = error?.message || "Failed to create checkout session"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
