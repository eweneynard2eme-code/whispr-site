import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserEntitlements, getUserUnlocks, checkMomentUnlock } from "@/lib/entitlements"
import type { MomentLevel } from "@/lib/stripe-products"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        hasPlus: false,
        unlocks: [],
      })
    }

    const entitlements = await getUserEntitlements(user.id)
    const unlocks = await getUserUnlocks(user.id)

    return NextResponse.json({
      authenticated: true,
      hasPlus: entitlements?.hasPlus || false,
      plusStatus: entitlements?.plusStatus || "none",
      unlocks: unlocks.map((u) => ({
        type: u.type,
        characterId: u.character_id,
        situationId: u.situation_id,
        momentLevel: u.moment_level,
        mediaId: u.media_id,
      })),
    })
  } catch (error) {
    console.error("[v0] Entitlements check error:", error)
    return NextResponse.json({ error: "Failed to check entitlements" }, { status: 500 })
  }
}

// Check specific moment unlock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { characterId, situationId, momentLevel } = body

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ isUnlocked: false, reason: null })
    }

    const result = await checkMomentUnlock(user.id, characterId, situationId, momentLevel as MomentLevel)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Moment check error:", error)
    return NextResponse.json({ isUnlocked: false, reason: null })
  }
}
