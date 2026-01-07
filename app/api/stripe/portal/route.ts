import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { getUserEntitlements } from "@/lib/entitlements"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const entitlements = await getUserEntitlements(user.id)

    if (!entitlements?.stripeCustomerId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 })
    }

    const origin = new URL(request.url).origin
    const returnUrl = process.env.STRIPE_CUSTOMER_PORTAL_RETURN_URL || `${origin}/profile`

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: entitlements.stripeCustomerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("[v0] Portal error:", error)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
