"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Lock, Star } from "lucide-react"
import { getCharacterById, type Character } from "@/lib/data"
import { cn } from "@/lib/utils"
import { userStore } from "@/lib/user-store"
import { useAuth } from "@/hooks/use-auth"
import { useAuthModal } from "@/components/auth-modal-provider"
import { openStripeCheckoutWithPurchaseType } from "@/lib/paywall"

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type MomentLevel = "free" | "private" | "intimate" | "exclusive"

interface Situation {
  id: string
  title: string
  description: string
  tags: string[]
  isPaid: boolean
  momentLevel: MomentLevel
  image?: string
  blurred?: boolean
}

interface Entitlements {
  authenticated: boolean
  hasPlus: boolean
  plusStatus: string
  unlocks: Array<{
    type: string
    characterId: string
    situationId: string
    momentLevel: string
  }>
}

// Safe character model with guaranteed defaults
interface SafeCharacter {
  id: string
  name: string
  description: string
  image: string | null
  tags: string[]
  situations: Situation[]
}

const MOMENT_PRICES: Record<MomentLevel, string> = {
  free: "Free",
  private: "$3.99",
  intimate: "$4.99",
  exclusive: "$6.99",
}

// ============================================================================
// DATA LOADING & VALIDATION
// ============================================================================

async function loadCharacterData(id: string | undefined): Promise<SafeCharacter | null> {
  // Validate ID
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    console.warn("[CHARACTER_PAGE] Invalid character ID:", id)
    return null
  }

  try {
    const character = getCharacterById(id)
    if (!character) {
      console.warn("[CHARACTER_PAGE] Character not found:", id)
      return null
    }

    // Build safe character with guaranteed defaults
    const safeCharacter: SafeCharacter = {
      id: character.id || id,
      name: character.name || "Unknown",
      description: character.description || "",
      image: character.image || null,
      tags: Array.isArray(character.tags) ? character.tags : [],
      situations: buildSafeSituations(character),
    }

    return safeCharacter
  } catch (error) {
    console.error("[CHARACTER_PAGE] Error loading character:", error)
    return null
  }
}

function buildSafeSituations(character: Character): Situation[] {
  // Use character's situations if available
  if (Array.isArray(character.situations) && character.situations.length > 0) {
    return character.situations.map((s) => ({
      id: s.id || `situation-${Math.random()}`,
      title: s.title || "Untitled",
      description: s.description || "",
      tags: Array.isArray(s.tags) ? s.tags : [],
      isPaid: s.isPaid === true,
      momentLevel: s.isPaid ? "private" : "free",
      image: s.image || undefined,
      blurred: s.blurred || false,
    }))
  }

  // Default situations if none provided
  return [
    {
      id: "free1",
      title: "Late night talk",
      description: "A calm, quiet conversation where anything can happen.",
      tags: ["calm", "quiet"],
      isPaid: false,
      momentLevel: "free",
      image: character.image || undefined,
    },
    {
      id: "private1",
      title: "Private moment",
      description: "A conversation that doesn't happen in public.",
      tags: ["private", "personal"],
      isPaid: true,
      momentLevel: "private",
      blurred: true,
    },
    {
      id: "intimate1",
      title: "Intimate moment",
      description: "He lowers his voice. This moment brings you closer.",
      tags: ["intimate", "closer"],
      isPaid: true,
      momentLevel: "intimate",
      blurred: true,
    },
    {
      id: "exclusive1",
      title: "Exclusive moment",
      description: "Some moments are only shared once.",
      tags: ["exclusive", "rare"],
      isPaid: true,
      momentLevel: "exclusive",
      blurred: true,
    },
  ]
}

async function loadEntitlements(): Promise<Entitlements | null> {
  try {
    const res = await fetch("/api/stripe/entitlements")
    if (!res.ok) return null
    const data = await res.json()
    return {
      authenticated: data.authenticated === true,
      hasPlus: data.hasPlus === true,
      plusStatus: data.plusStatus || "inactive",
      unlocks: Array.isArray(data.unlocks) ? data.unlocks : [],
    }
  } catch (error) {
    console.error("[CHARACTER_PAGE] Failed to fetch entitlements:", error)
    return null
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getCharacterGradient(name: string): string {
  const gradients = [
    "from-violet-600/80 to-purple-900/80",
    "from-pink-600/80 to-rose-900/80",
    "from-blue-600/80 to-indigo-900/80",
    "from-cyan-600/80 to-teal-900/80",
    "from-amber-600/80 to-orange-900/80",
    "from-fuchsia-600/80 to-pink-900/80",
  ]
  const index = (name.charCodeAt(0) || 0) % gradients.length
  return gradients[index]
}

function getInitial(name: string): string {
  return name && name.length > 0 ? name[0].toUpperCase() : "?"
}

function getFirstName(name: string): string {
  if (!name || name.length === 0) return "them"
  const parts = name.split(" ")
  return parts[0] || name
}

function isMomentUnlocked(
  situation: Situation,
  characterId: string,
  entitlements: Entitlements | null,
): boolean {
  if (!situation.isPaid || situation.momentLevel === "free") return true
  if (!entitlements?.authenticated) return false

  // Plus subscription covers private + intimate (NOT exclusive)
  if (entitlements.hasPlus && entitlements.plusStatus === "active") {
    if (situation.momentLevel === "private" || situation.momentLevel === "intimate") {
      return true
    }
  }

  // Check for one-time purchase
  return entitlements.unlocks.some(
    (u) =>
      u.type === "moment" &&
      u.characterId === characterId &&
      u.situationId === situation.id &&
      u.momentLevel === situation.momentLevel,
  )
}

// ============================================================================
// COMPONENT: Hero Section
// ============================================================================

function HeroSection({ character }: { character: SafeCharacter }) {
  const [imageError, setImageError] = useState(false)
  const firstName = getFirstName(character.name)
  const gradient = getCharacterGradient(character.name)

  return (
    <section className="mb-8">
      {/* Mobile image */}
      <div className="lg:hidden relative w-full aspect-[3/4] max-w-xs mx-auto mb-8 rounded-2xl overflow-hidden">
        {!imageError && character.image ? (
          <Image
            src={character.image}
            alt={character.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br flex items-center justify-center", gradient)}>
            <span className="text-4xl font-semibold text-white">{getInitial(character.name)}</span>
          </div>
        )}
      </div>

      {/* Desktop image */}
      <div className="hidden lg:flex w-[45%] xl:w-[40%] relative mb-8">
        {!imageError && character.image ? (
          <Image
            src={character.image}
            alt={character.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br flex items-center justify-center", gradient)}>
            <div className="w-40 h-40 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-6xl font-semibold text-white">{getInitial(character.name)}</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a0a0a]" />
      </div>

      {/* Character info */}
      <div>
        <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 tracking-tight">
          {character.name}
        </h1>
        <p className="text-lg lg:text-xl text-gray-400 mb-5 max-w-lg leading-relaxed">
          {character.description}
        </p>
        {character.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {character.tags.slice(0, 5).map((tag, idx) => (
              <span key={idx} className="text-xs text-gray-500 lowercase tracking-wide">
                {tag} ·
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-500 leading-relaxed max-w-md">
          Choose how you want to meet {firstName}.
        </p>
      </div>
    </section>
  )
}

// ============================================================================
// COMPONENT: Moments Gallery
// ============================================================================

function MomentsGallery({
  character,
  entitlements,
  onMomentClick,
}: {
  character: SafeCharacter
  entitlements: Entitlements | null
  onMomentClick: (situation: Situation) => void
}) {
  const freeMoments = character.situations.filter((s) => !s.isPaid)
  const paidMoments = character.situations.filter((s) => s.isPaid)

  return (
    <section className="mb-16">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Moments</h2>
        <p className="text-sm text-gray-400">Choose how you want to meet {getFirstName(character.name)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Free moments */}
        {freeMoments.map((situation) => (
          <MomentCard
            key={situation.id}
            situation={situation}
            character={character}
            isUnlocked={true}
            onClick={() => onMomentClick(situation)}
          />
        ))}

        {/* Paid moments */}
        {paidMoments.map((situation) => {
          const isUnlocked = isMomentUnlocked(situation, character.id, entitlements)
          return (
            <MomentCard
              key={situation.id}
              situation={situation}
              character={character}
              isUnlocked={isUnlocked}
              onClick={() => onMomentClick(situation)}
            />
          )
        })}
      </div>
    </section>
  )
}

function MomentCard({
  situation,
  character,
  isUnlocked,
  onClick,
}: {
  situation: Situation
  character: SafeCharacter
  isUnlocked: boolean
  onClick: () => void
}) {
  const [imageError, setImageError] = useState(false)
  const imageSrc = situation.image || character.image || "/placeholder.svg"
  const price = MOMENT_PRICES[situation.momentLevel]

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative aspect-[4/5] rounded-2xl overflow-hidden border transition-all duration-500 hover:scale-[1.02] cursor-pointer",
        isUnlocked
          ? "bg-green-500/5 border-green-500/30 hover:border-green-500/50"
          : "bg-[#1a1a1a] border-violet-500/30 hover:border-violet-500/50",
      )}
    >
      <div className="absolute inset-0">
        {!imageError ? (
          <Image
            src={imageSrc}
            alt={situation.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/80 to-purple-900/80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        {situation.blurred && !isUnlocked && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        )}
      </div>

      {!isUnlocked && (
        <div className="absolute top-4 right-4 z-10">
          <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Lock className="h-3 w-3 text-violet-400" />
          </div>
        </div>
      )}

      <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
          {situation.title}
        </h3>
        <p className="text-sm text-gray-300 mb-4 leading-relaxed line-clamp-2">{situation.description}</p>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          className={cn(
            "w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors",
            isUnlocked
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-violet-600 hover:bg-violet-700 text-white",
          )}
        >
          {isUnlocked ? "Start" : `Unlock – ${price}`}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENT: Sticky CTA Bar
// ============================================================================

function StickyCTABar({
  activeMoment,
  character,
  isUnlocked,
  onClick,
}: {
  activeMoment: Situation | null
  character: SafeCharacter
  isUnlocked: boolean
  onClick: () => void
}) {
  if (!activeMoment) return null

  const price = MOMENT_PRICES[activeMoment.momentLevel]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-violet-500/30 bg-[#0a0a0a]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-sm sm:text-base font-semibold text-white">
              {isUnlocked
                ? `Start ${activeMoment.title}`
                : `Unlock ${activeMoment.title} — ${price}`}
            </span>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Unlock in seconds • Instant access</p>
          </div>
          <button
            onClick={onClick}
            className={cn(
              "px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors",
              isUnlocked
                ? "bg-violet-600 hover:bg-violet-700 text-white"
                : "bg-violet-600 hover:bg-violet-700 text-white",
            )}
          >
            {isUnlocked ? "Start" : "Unlock now"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CharacterPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string | undefined
  const { isLoggedIn, isLoading: authLoading } = useAuth()
  const { openModal } = useAuthModal()

  const [character, setCharacter] = useState<SafeCharacter | null>(null)
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeMoment, setActiveMoment] = useState<Situation | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)

  // Load character data
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const [charData, entitlementsData] = await Promise.all([
        loadCharacterData(id),
        loadEntitlements(),
      ])

      if (cancelled) return

      if (charData) {
        setCharacter(charData)
        // Set first paid moment as active, or first free moment
        const firstPaid = charData.situations.find((s) => s.isPaid)
        const firstFree = charData.situations.find((s) => !s.isPaid)
        setActiveMoment(firstPaid || firstFree || null)
      }
      setEntitlements(entitlementsData)
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id])

  // Handle moment click
  const handleMomentClick = (situation: Situation) => {
    if (!character) return

    const isUnlocked = isMomentUnlocked(situation, character.id, entitlements)

    if (isUnlocked) {
      // Navigate to chat
      router.push(`/chat/${character.id}?situation=${situation.id}`)
    } else {
      // Handle checkout
      handleCheckout(situation)
    }
  }

  // Handle checkout
  const handleCheckout = async (situation: Situation) => {
    if (!character || checkingOut) return

    // If auth is still loading, wait
    if (authLoading) {
      console.log("[CHARACTER_PAGE] Auth loading, waiting...")
      return
    }

    // If not logged in, open auth modal
    if (!isLoggedIn) {
      openModal({
        type: "open_character",
        characterId: character.id,
        scrollTo: "moments",
      })
      return
    }

    // User is logged in - proceed to checkout
    setCheckingOut(true)
    try {
      await openStripeCheckoutWithPurchaseType({
        purchaseType: "moment",
        characterId: character.id,
        situationId: situation.id,
        momentLevel: situation.momentLevel,
      })
    } catch (error) {
      console.error("[CHARACTER_PAGE] Checkout error:", error)
      setCheckingOut(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    )
  }

  // Character not found
  if (!character) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold text-white mb-2">Character not available</h1>
          <p className="text-gray-400 mb-6">
            The character you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/discover"
            className="inline-block rounded-lg bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 text-sm font-medium transition-colors"
          >
            Browse Characters
          </Link>
        </div>
      </div>
    )
  }

  // Determine if active moment is unlocked
  const activeMomentUnlocked = activeMoment
    ? isMomentUnlocked(activeMoment, character.id, entitlements)
    : false

  // Favorite state
  const isFavorite = userStore.isFavorite(character.id)

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left panel - desktop only */}
      <div className="hidden lg:flex w-[45%] xl:w-[40%] relative">
        <Link
          href="/discover"
          className="absolute top-6 left-6 z-30 flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      {/* Right panel - content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden px-4 py-4 flex items-center gap-3">
          <Link
            href="/discover"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 xl:px-16 py-8 lg:py-12 pb-24 sm:pb-28">
          <HeroSection character={character} />

          <MomentsGallery
            character={character}
            entitlements={entitlements}
            onMomentClick={(situation) => {
              setActiveMoment(situation)
              handleMomentClick(situation)
            }}
          />

          {/* Save button */}
          <div className="flex items-center gap-3 pb-8">
            <button
              onClick={() => userStore.toggleFavorite(character.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors",
                isFavorite
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10",
              )}
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-yellow-400")} />
              {isFavorite ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Sticky CTA bar */}
      <StickyCTABar
        activeMoment={activeMoment}
        character={character}
        isUnlocked={activeMomentUnlocked}
        onClick={() => activeMoment && handleMomentClick(activeMoment)}
      />
    </div>
  )
}
