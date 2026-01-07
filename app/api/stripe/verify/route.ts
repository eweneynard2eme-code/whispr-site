import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { getUserEntitlements, getUserUnlocks } from "@/lib/entitlements"

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Verify payment completed
    const isPaid =
      session.payment_status === "paid" || (session.mode === "subscription" && session.status === "complete")

    if (!isPaid) {
      return NextResponse.json({
        status: "incomplete",
        paymentStatus: session.payment_status,
      })
    }

    // Get user entitlements
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let entitlements = null
    let unlocks: any[] = []

    if (user) {
      entitlements = await getUserEntitlements(user.id)
      unlocks = await getUserUnlocks(user.id)
    }

    return NextResponse.json({
      status: "complete",
      paymentStatus: session.payment_status,
      metadata: session.metadata,
      entitlements,
      unlocks,
    })
  } catch (error) {
    console.error("[v0] Verify error:", error)
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 })
  }
}
