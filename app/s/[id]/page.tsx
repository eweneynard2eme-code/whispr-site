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
import { openStripeCheckoutWithPurchaseType, getIsOpeningCheckout } from "@/lib/paywall"

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

interface SafeCharacter {
  id: string
  name: string
  description: string
  image: string | null
  tags: string[]
  situations: Situation[]
}

const MOMENT_PRICES: Record<MomentLevel, number> = {
  free: 0,
  private: 399,
  intimate: 499,
  exclusive: 699,
}

function formatPrice(cents: number): string {
  if (cents === 0) return "Free"
  return `€${(cents / 100).toFixed(2)}`
}

// ============================================================================
// DATA LOADING & VALIDATION
// ============================================================================

async function loadCharacterData(id: string | undefined): Promise<SafeCharacter | null> {
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
  if (Array.isArray(character.situations) && character.situations.length > 0) {
    return character.situations.map((s, idx) => {
      let momentLevel: MomentLevel = "free"
      if (s.isPaid) {
        const paidIndex = character.situations.filter((sit) => sit.isPaid).indexOf(s)
        if (paidIndex === 0) momentLevel = "private"
        else if (paidIndex === 1) momentLevel = "intimate"
        else momentLevel = "exclusive"
      }

      return {
        id: s.id || `situation-${idx}`,
        title: s.title || "Untitled",
        description: s.description || "",
        tags: Array.isArray(s.tags) ? s.tags : [],
        isPaid: s.isPaid === true,
        momentLevel,
        image: s.image || undefined,
        blurred: s.blurred !== false && s.isPaid,
      }
    })
  }

  // Default situations with exact copy + emojis
  return [
    {
      id: "free1",
      title: "Late night talk",
      description: "Calm, quiet conversation",
      tags: ["calm", "quiet"],
      isPaid: false,
      momentLevel: "free",
      image: character.image || undefined,
    },
    {
      id: "private1",
      title: "Private moment",
      description: "Something more intimate",
      tags: ["private", "personal"],
      isPaid: true,
      momentLevel: "private",
      blurred: true,
    },
    {
      id: "intimate1",
      title: "Intimate moment",
      description: "His voice gets low",
      tags: ["intimate", "closer"],
      isPaid: true,
      momentLevel: "intimate",
      blurred: true,
    },
    {
      id: "exclusive1",
      title: "Dark side",
      description: "This goes further. Once you open it… you can't unsee it.",
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

  if (entitlements.hasPlus && entitlements.plusStatus === "active") {
    if (situation.momentLevel === "private" || situation.momentLevel === "intimate") {
      return true
    }
  }

  return entitlements.unlocks.some(
    (u) =>
      u.type === "moment" &&
      u.characterId === characterId &&
      u.situationId === situation.id &&
      u.momentLevel === situation.momentLevel,
  )
}

// ============================================================================
// COMPONENT: Character Header (Minimal)
// ============================================================================

function CharacterHeader({ character }: { character: SafeCharacter }) {
  return (
    <div className="mb-8">
      <Link
        href="/discover"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight">
        {character.name}
      </h1>
      {character.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {character.tags.slice(0, 4).map((tag, idx) => (
            <span key={idx} className="text-xs text-gray-400 lowercase">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}


// ============================================================================
// COMPONENT: Moment Cards
// ============================================================================

function MomentsGallery({
  character,
  entitlements,
  activeMoment,
  onMomentClick,
  onMomentHover,
}: {
  character: SafeCharacter
  entitlements: Entitlements | null
  activeMoment: Situation | null
  onMomentClick: (situation: Situation) => void
  onMomentHover: (situation: Situation | null) => void
}) {
  const freeMoments = character.situations.filter((s) => !s.isPaid)
  const privateMoments = character.situations.filter((s) => s.isPaid && s.momentLevel === "private")
  const intimateMoments = character.situations.filter((s) => s.isPaid && s.momentLevel === "intimate")
  const exclusiveMoments = character.situations.filter((s) => s.isPaid && s.momentLevel === "exclusive")

  const allMoments = [...freeMoments, ...privateMoments, ...intimateMoments, ...exclusiveMoments]

  if (allMoments.length === 0) {
    return (
      <section className="mb-16">
        <div className="text-center py-16">
          <p className="text-gray-400">No moments available for this character.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-16">
      {/* First row: Free + Private/Intimate (side by side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8">
        {/* Tier A: Warm-up (Free) */}
        {freeMoments.map((situation) => (
          <MomentCardFree
            key={situation.id}
            situation={situation}
            character={character}
            isActive={activeMoment?.id === situation.id}
            onClick={() => onMomentClick(situation)}
            onHover={() => onMomentHover(situation)}
            onHoverEnd={() => onMomentHover(null)}
          />
        ))}

        {/* Tier B: Private or Intimate (whichever exists first) */}
        {[...privateMoments, ...intimateMoments].slice(0, 1).map((situation) => {
          const isUnlocked = isMomentUnlocked(situation, character.id, entitlements)
          return (
            <MomentCardPremium
              key={situation.id}
              situation={situation}
              character={character}
              isUnlocked={isUnlocked}
              isActive={activeMoment?.id === situation.id}
              tier={situation.momentLevel === "private" ? "private" : "intimate"}
              onClick={() => onMomentClick(situation)}
              onHover={() => onMomentHover(situation)}
              onHoverEnd={() => onMomentHover(null)}
              onPlusClick={() => {
                onMomentClick({
                  id: "plus",
                  title: "WHISPR Plus",
                  description: "",
                  tags: [],
                  isPaid: true,
                  momentLevel: "private",
                })
              }}
            />
          )
        })}
      </div>

      {/* Second row: Dark side (centered, larger) */}
      {exclusiveMoments.length > 0 && (
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            {exclusiveMoments.map((situation) => {
              const isUnlocked = isMomentUnlocked(situation, character.id, entitlements)
              return (
                <MomentCardDarkSide
                  key={situation.id}
                  situation={situation}
                  character={character}
                  isUnlocked={isUnlocked}
                  isActive={activeMoment?.id === situation.id}
                  onClick={() => onMomentClick(situation)}
                  onHover={() => onMomentHover(situation)}
                  onHoverEnd={() => onMomentHover(null)}
                  onPlusClick={() => {
                    onMomentClick({
                      id: "plus",
                      title: "WHISPR Plus",
                      description: "",
                      tags: [],
                      isPaid: true,
                      momentLevel: "private",
                    })
                  }}
                />
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

// Free moment card
function MomentCardFree({
  situation,
  character,
  isActive,
  onClick,
  onHover,
  onHoverEnd,
}: {
  situation: Situation
  character: SafeCharacter
  isActive: boolean
  onClick: () => void
  onHover: () => void
  onHoverEnd: () => void
}) {
  const [imageError, setImageError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const imageSrc = situation.image || character.image || "/placeholder.svg"

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  const handleCardClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault()
      onHover()
    } else {
      onClick()
    }
  }

  return (
    <div
      className={cn(
        "group relative h-[520px] lg:h-[580px] rounded-3xl overflow-hidden transition-all duration-500 cursor-pointer",
        isActive
          ? "scale-[1.03] shadow-2xl shadow-violet-500/30 z-10"
          : "opacity-50 scale-[0.98] lg:blur-[2px] hover:opacity-80 hover:scale-[1.0] hover:blur-0",
      )}
      onClick={handleCardClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      <div className="absolute inset-0">
        {!imageError ? (
          <Image
            src={imageSrc}
            alt={situation.title || "Moment"}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 50vw"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/80 to-purple-900/80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 z-10 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
        <h3 className="text-2xl font-bold text-white mb-2 line-clamp-1">
          {situation.title || "Late night talk"} 🌙
        </h3>
        <p className="text-base text-gray-200 mb-6 line-clamp-1">
          {situation.description || "Calm, quiet conversation"}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          className="w-full h-14 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-lg transition-colors shadow-xl shadow-violet-500/40"
        >
          Start
        </button>
      </div>
    </div>
  )
}

// Premium moment card (Private/Intimate)
function MomentCardPremium({
  situation,
  character,
  isUnlocked,
  isActive,
  tier,
  onClick,
  onHover,
  onHoverEnd,
  onPlusClick,
}: {
  situation: Situation
  character: SafeCharacter
  isUnlocked: boolean
  isActive: boolean
  tier: "private" | "intimate"
  onClick: () => void
  onHover: () => void
  onHoverEnd: () => void
  onPlusClick: () => void
}) {
  const [imageError, setImageError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const imageSrc = situation.image || character.image || "/placeholder.svg"
  const price = formatPrice(MOMENT_PRICES[situation.momentLevel])
  
  const isPrivate = tier === "private"
  const emoji = isPrivate ? "😳" : "😳💗"
  const title = isPrivate ? "Private moment" : "Intimate moment"
  const description = isPrivate
    ? "Something more intimate"
    : "His voice gets low"

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  const handleCardClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault()
      onHover()
    } else {
      onClick()
    }
  }

  const glowColor = isPrivate ? "violet" : "pink"

  return (
    <div
      className={cn(
        "group relative h-[520px] lg:h-[580px] rounded-3xl overflow-hidden transition-all duration-500 cursor-pointer",
        isUnlocked
          ? "bg-green-500/5"
          : isPrivate
            ? "bg-[#1a1a1a]"
            : "bg-[#1a1a1a]",
        isActive
          ? isPrivate
            ? "scale-[1.03] shadow-2xl shadow-violet-500/40 z-10"
            : "scale-[1.03] shadow-2xl shadow-pink-500/40 z-10"
          : "opacity-50 scale-[0.98] lg:blur-[2px] hover:opacity-80 hover:scale-[1.0] hover:blur-0",
      )}
      onClick={handleCardClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      <div className="absolute inset-0">
        {!imageError ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 50vw"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br", isPrivate ? "from-violet-600/80 to-purple-900/80" : "from-pink-600/80 to-rose-900/80")} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/30" />
        {!isUnlocked && (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              isPrivate ? "from-violet-900/50 via-purple-900/40 to-transparent" : "from-pink-900/50 via-rose-900/40 to-transparent",
            )}
          />
        )}
      </div>

      {!isUnlocked && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-sm border border-white/20 text-xs font-medium text-white">
            Locked
          </span>
          <div className="w-7 h-7 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center border border-white/20 shrink-0">
            <Lock className={cn("h-4 w-4", isPrivate ? "text-violet-400" : "text-pink-400")} />
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-8 z-10 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
        <h3 className="text-2xl font-bold text-white mb-2 line-clamp-1">
          {situation.title || title} {emoji}
        </h3>
        <p className="text-base text-gray-200 mb-6 line-clamp-1">
          {situation.description || description}
        </p>
        {isUnlocked ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className="w-full h-14 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg transition-colors shadow-xl shadow-green-500/40"
          >
            Start
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className={cn(
              "w-full h-14 rounded-xl font-bold text-lg transition-colors shadow-xl",
              isPrivate
                ? "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/40"
                : "bg-pink-600 hover:bg-pink-700 text-white shadow-pink-500/40",
            )}
          >
            Unlock now — {price}
          </button>
        )}
      </div>
    </div>
  )
}

// Dark side moment card (centered, larger)
function MomentCardDarkSide({
  situation,
  character,
  isUnlocked,
  isActive,
  onClick,
  onHover,
  onHoverEnd,
  onPlusClick,
}: {
  situation: Situation
  character: SafeCharacter
  isUnlocked: boolean
  isActive: boolean
  onClick: () => void
  onHover: () => void
  onHoverEnd: () => void
  onPlusClick: () => void
}) {
  const [imageError, setImageError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const imageSrc = situation.image || character.image || "/placeholder.svg"
  const price = formatPrice(MOMENT_PRICES[situation.momentLevel])

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  const handleCardClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault()
      onHover()
    } else {
      onClick()
    }
  }

  return (
    <div
      className={cn(
        "group relative h-[520px] lg:h-[580px] rounded-3xl overflow-hidden border-2 transition-all duration-500 cursor-pointer",
        isUnlocked
          ? "bg-green-500/5 border-green-500/30"
          : "bg-[#0a0a0a] border-amber-500/40 animate-pulse-ring",
        isActive
          ? "scale-[1.03] border-amber-500/60 shadow-2xl shadow-amber-500/40 z-10"
          : "opacity-50 scale-[0.98] lg:blur-[2px] hover:opacity-80 hover:scale-[1.0] hover:blur-0 hover:border-amber-500/60",
      )}
      onClick={handleCardClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      {!isUnlocked && (
        <div className="absolute inset-0 rounded-2xl bg-amber-500/10 animate-pulse opacity-50" />
      )}

      <div className="absolute inset-0">
        {!imageError ? (
          <Image
            src={imageSrc}
            alt={situation.title || "Dark side"}
            fill
            className={cn(
              "object-cover transition-all duration-700",
              isUnlocked ? "group-hover:scale-110" : "scale-110 blur-[24px] group-hover:blur-[16px]",
            )}
            sizes="(max-width: 768px) 100vw, 100vw"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/80 to-orange-900/80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/70" />
        {!isUnlocked && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/50 via-red-900/40 to-black/90" />
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(circle at center, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 100%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                mixBlendMode: "overlay",
              }}
            />
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-amber-500/10 to-transparent" />
          </>
        )}
      </div>

      {!isUnlocked && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-sm border border-white/20 text-xs font-medium text-white">
            Locked
          </span>
          <div className="w-7 h-7 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center border border-white/20 shrink-0">
            <Lock className="h-4 w-4 text-amber-400" />
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-8 z-10 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
        {!isUnlocked && (
          <p className="text-xs text-red-400/90 mb-2 font-semibold">Not for everyone.</p>
        )}
        <h3 className="text-2xl font-bold text-white mb-2 line-clamp-1">
          {situation.title || "Dark side"} 🔥🖤
        </h3>
        {!isUnlocked && (
          <p className="text-sm text-amber-400/90 mb-3 font-mono tracking-widest">
            He whispers: "•••• •••• •••"
          </p>
        )}
        <p className="text-base text-gray-200 mb-6 line-clamp-1">
          {situation.description || "This goes further. Once you open it… you can't unsee it."}
        </p>
        {isUnlocked ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className="w-full h-14 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg transition-colors shadow-xl shadow-green-500/40"
          >
            Start
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className="w-full h-14 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg transition-colors shadow-xl shadow-amber-500/40"
          >
            Unlock dark side — {price}
          </button>
        )}
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
  isOpeningCheckout,
  onClick,
  onPlusClick,
}: {
  activeMoment: Situation | null
  character: SafeCharacter
  isUnlocked: boolean
  isOpeningCheckout: boolean
  onClick: () => void
  onPlusClick: () => void
}) {
  if (!activeMoment) return null

  const price = formatPrice(MOMENT_PRICES[activeMoment.momentLevel])
  const isDarkSide = activeMoment.momentLevel === "exclusive"
  const ctaText = isDarkSide && !isUnlocked
    ? `Unlock dark side — ${price}`
    : isUnlocked
      ? `Start ${activeMoment.title || "moment"}`
      : `Unlock ${activeMoment.title || "moment"} — ${price}`

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md border-violet-500/30 bg-[#0a0a0a]/98">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-base font-bold text-white line-clamp-1">
              {ctaText}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            disabled={isOpeningCheckout}
            className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-base transition-colors disabled:opacity-50 shadow-xl shadow-violet-500/40"
          >
            {isOpeningCheckout ? "Opening..." : isUnlocked ? "Start" : "Unlock now"}
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
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false)

  // Subscribe to checkout lock
  useEffect(() => {
    const checkLock = () => {
      setIsOpeningCheckout(getIsOpeningCheckout())
    }
    checkLock()
    const interval = setInterval(checkLock, 100)
    return () => clearInterval(interval)
  }, [])

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
        // Default active moment: Intimate if locked, else Private, else Free
        const intimate = charData.situations.find((s) => s.momentLevel === "intimate")
        const privateMoment = charData.situations.find((s) => s.momentLevel === "private")
        const free = charData.situations.find((s) => !s.isPaid)
        const defaultMoment = intimate || privateMoment || free || null
        setActiveMoment(defaultMoment)
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
    if (!character || isOpeningCheckout) return

    if (situation.id === "plus") {
      handleCheckout(situation)
      return
    }

    const isUnlocked = isMomentUnlocked(situation, character.id, entitlements)

    if (isUnlocked) {
      router.push(`/chat/${character.id}?situation=${situation.id}`)
    } else {
      handleCheckout(situation)
    }
  }

  // Handle checkout
  const handleCheckout = async (situation: Situation) => {
    if (!character || isOpeningCheckout || getIsOpeningCheckout()) return

    if (authLoading) {
      console.log("[CHARACTER_PAGE] Auth loading, waiting...")
      return
    }

    if (!isLoggedIn) {
      openModal({
        type: "checkout",
        purchaseType: situation.id === "plus" ? "plus" : "moment",
        characterId: character.id,
        situationId: situation.id === "plus" ? undefined : situation.id,
        momentLevel: situation.momentLevel === "free" ? "private" : situation.momentLevel,
      })
      return
    }

    try {
      if (situation.id === "plus") {
        await openStripeCheckoutWithPurchaseType({
          purchaseType: "plus",
        })
      } else {
        await openStripeCheckoutWithPurchaseType({
          purchaseType: "moment",
          characterId: character.id,
          situationId: situation.id,
          momentLevel: situation.momentLevel,
        })
      }
    } catch (error) {
      console.error("[CHARACTER_PAGE] Checkout error:", error)
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

  const activeMomentUnlocked = activeMoment
    ? activeMoment.id === "plus"
      ? false
      : isMomentUnlocked(activeMoment, character.id, entitlements)
    : false

  const isFavorite = userStore.isFavorite(character.id)

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto pb-24 sm:pb-28">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 lg:py-12">
            <CharacterHeader character={character} />

            <MomentsGallery
              character={character}
              entitlements={entitlements}
              activeMoment={activeMoment}
              onMomentClick={handleMomentClick}
              onMomentHover={setActiveMoment}
            />

            {/* Save button */}
            <div className="flex items-center gap-3 pt-8">
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
        isOpeningCheckout={isOpeningCheckout}
        onClick={() => activeMoment && handleMomentClick(activeMoment)}
        onPlusClick={() => {
          if (activeMoment) {
            handleMomentClick({
              id: "plus",
              title: "WHISPR Plus",
              description: "",
              tags: [],
              isPaid: true,
              momentLevel: "private",
            })
          }
        }}
      />
    </div>
  )
}
