"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Lock, Star, Send, Sparkles, ImageIcon, MessageSquare, Video, Zap } from "lucide-react"
import { getCharacterById, type Character, formatNumber } from "@/lib/data"
import { cn } from "@/lib/utils"
import { userStore, useUserStore } from "@/lib/user-store"
import { useAuth } from "@/hooks/use-auth"
import { useAuthModal } from "@/components/auth-modal-provider"
import { openStripeCheckoutWithPurchaseType, getIsOpeningCheckout } from "@/lib/paywall"
import { getOrCreateChatSession, loadChatMessages, saveChatMessage, verifyAuth } from "@/lib/supabase/chat"
import { HistoryPanel } from "@/components/history-panel"

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
    mediaId?: string
  }>
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isFree?: boolean
}

type TabType = "moments" | "chat" | "media"

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
  return `$${(cents / 100).toFixed(2)}`
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

  // Default situations with emotional, minimal copy
  return [
    {
      id: "free1",
      title: "Late night talk",
      description: "It starts slow.",
      tags: ["calm", "quiet"],
      isPaid: false,
      momentLevel: "free",
      image: character.image || undefined,
    },
    {
      id: "private1",
      title: "Private moment",
      description: "He sits closer.",
      tags: ["private", "personal"],
      isPaid: true,
      momentLevel: "private",
      blurred: true,
    },
    {
      id: "intimate1",
      title: "Intimate moment",
      description: "He sits closer.",
      tags: ["intimate", "closer"],
      isPaid: true,
      momentLevel: "intimate",
      blurred: true,
    },
    {
      id: "exclusive1",
      title: "Dark side",
      description: "No turning back.",
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
    <div className="mb-3 md:mb-4">
      <Link
        href="/discover"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors mb-2 md:mb-2.5"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 tracking-tight leading-tight">
        {character.name}
      </h1>
      {character.tags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {character.tags.slice(0, 4).map((tag, idx) => (
            <span key={idx} className="text-[10px] text-gray-400 lowercase whitespace-nowrap">
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
    <section className="mb-6 md:mb-8">
      {/* Desktop: 2-column asymmetrical layout (Dark Side always visible) */}
      {/* Mobile: Dark Side first (peek effect), then Private, then Free */}
      <div className="max-w-[1200px] lg:max-w-[1400px] mx-auto">
        {/* Desktop Layout: 2 columns */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-4 lg:gap-5">
          {/* LEFT COLUMN: Stacked Free + Private */}
          <div className="flex flex-col gap-4 lg:gap-5">
            {/* Free card (top) */}
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
            {/* Private/Intimate card (bottom) */}
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

          {/* RIGHT COLUMN: Dark Side (tall, always visible) */}
          {exclusiveMoments.length > 0 && (
            <div className="relative">
              {exclusiveMoments.map((situation) => {
                const isUnlocked = isMomentUnlocked(situation, character.id, entitlements)
                return (
                  <div key={situation.id} className="relative">
                    <MomentCardDarkSide
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
                    {/* Micro social proof */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10">
                      <span className="px-2.5 py-1 rounded-full bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 text-[10px] font-medium text-orange-300/80">
                        🔥 2,184 entered today
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Mobile Layout: Dark Side first (peek), then Private, then Free */}
        <div className="lg:hidden flex flex-col gap-3">
          {/* 1. Dark Side (first, peek effect) */}
          {exclusiveMoments.length > 0 && (
            <div className="relative">
              {exclusiveMoments.map((situation) => {
                const isUnlocked = isMomentUnlocked(situation, character.id, entitlements)
                return (
                  <div key={situation.id} className="relative">
                    <MomentCardDarkSide
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
                    {/* Micro social proof */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10">
                      <span className="px-2.5 py-1 rounded-full bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 text-[10px] font-medium text-orange-300/80">
                        🔥 2,184 entered today
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {/* 2. Private/Intimate (second) */}
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
          {/* 3. Free (third) */}
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
        </div>
      </div>
    </section>
  )
}

// Free moment card (always clear, bright, safe - soft lighting, calm colors)
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
  const [isSelected, setIsSelected] = useState(false)
  const imageSrc = situation.image || character.image || "/placeholder.svg"

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  const handleCardClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault()
      if (!isSelected) {
        setIsSelected(true)
        onHover()
      }
    } else {
      onClick()
    }
  }

  const handleCTAClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMobile && isSelected) {
      onClick()
    } else if (!isMobile) {
      onClick()
    }
  }

  return (
    <div
      className={cn(
        "group relative h-[300px] md:h-[340px] lg:h-[420px] xl:h-[480px] rounded-3xl overflow-hidden transition-all duration-500 cursor-pointer",
        // Mobile: no blur/dim, desktop: subtle hover effect
        isActive || isSelected
          ? "scale-[1.01] shadow-2xl shadow-blue-500/20 z-10 ring-2 ring-blue-400/40"
          : "lg:opacity-90 lg:hover:opacity-100 lg:hover:scale-[1.01]",
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
            className="object-cover transition-transform duration-700 lg:group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
            loading="lazy"
            onError={() => setImageError(true)}
            // ALWAYS sharp - no blur on mobile or desktop
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/60 to-cyan-500/60" />
        )}
        {/* Soft bottom gradient only - calm, safe feeling */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        {/* Soft warm lighting overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-transparent to-cyan-400/5" />
      </div>

      {/* Desirable label */}
      <div className="absolute top-3 left-3 z-20">
        <span className="px-2 py-1 rounded-full bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-[10px] font-semibold text-blue-200">
          Free tonight 🌙
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 z-10">
        <h3 className="text-base md:text-lg font-bold text-white mb-1 line-clamp-1">
          {situation.title || "Late night talk"} 🌙
        </h3>
        <p className="text-xs text-gray-300 mb-2">Start slow.</p>
        <div className="flex items-end justify-end">
          <button
            onClick={handleCTAClick}
            className="h-11 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm px-6 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Start
          </button>
        </div>
      </div>
    </div>
  )
}

// Premium moment card (Private/Intimate - intimate, closer, stronger purple glow, always sharp)
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
  const [isSelected, setIsSelected] = useState(false)
  const imageSrc = situation.image || character.image || "/placeholder.svg"
  const price = formatPrice(MOMENT_PRICES[situation.momentLevel])
  
  const isPrivate = tier === "private"

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  const handleCardClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault()
      if (!isSelected) {
        setIsSelected(true)
        onHover()
      }
    } else {
      onClick()
    }
  }

  const handleCTAClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMobile && isSelected) {
      onClick()
    } else if (!isMobile) {
      onClick()
    }
  }

  return (
    <div
      className={cn(
        "group relative h-[320px] md:h-[360px] lg:h-[420px] xl:h-[480px] rounded-3xl overflow-hidden transition-all duration-500 cursor-pointer",
        isUnlocked
          ? "bg-green-500/5"
          : "bg-[#1a1a1a]",
        // Mobile: no blur/dim, desktop: subtle hover effect
        isActive || isSelected
          ? "scale-[1.01] shadow-2xl shadow-violet-500/50 z-10 ring-2 ring-violet-400/60"
          : "lg:opacity-90 lg:hover:opacity-100 lg:hover:scale-[1.01]",
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
            className="object-cover transition-transform duration-700 lg:group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
            loading="lazy"
            onError={() => setImageError(true)}
            // ALWAYS sharp - no blur on mobile or desktop
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/80 to-purple-900/80" />
        )}
        {/* Higher contrast gradient - darker, more intimate */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/70 to-black/50" />
        {/* Strong purple glow overlay - feels closer, more intimate */}
        {!isUnlocked && (
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br",
            isPrivate ? "from-violet-500/35 via-purple-600/25 to-transparent" : "from-pink-500/30 via-rose-500/20 to-transparent"
          )} />
        )}
        {/* Additional rim lighting for intimacy - different for each tier */}
        <div className={cn(
          "absolute inset-0 ring-1",
          isPrivate ? "ring-violet-400/25" : "ring-pink-400/25"
        )} />
      </div>

      {/* Micro-identity label */}
      <div className="absolute top-3 left-3 z-20">
        <span className={cn(
          "px-2 py-1 rounded-full backdrop-blur-sm border text-[10px] font-semibold",
          isPrivate 
            ? "bg-violet-500/20 border-violet-400/30 text-violet-200"
            : "bg-pink-500/20 border-pink-400/30 text-pink-200"
        )}>
          {isPrivate ? "Closer 😳" : "Whispers 💜"}
        </span>
      </div>

      {!isUnlocked && (
        <div className="absolute top-3 right-3 z-20">
          <div className="w-7 h-7 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center border border-violet-400/40 shrink-0 shadow-lg shadow-violet-500/30">
            <Lock className="h-3.5 w-3.5 text-violet-300" />
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 z-10">
        <h3 className="text-base md:text-lg font-bold text-white mb-1 line-clamp-1">
          {situation.title || (isPrivate ? "Private moment" : "Intimate moment")} {isPrivate ? "😳" : "💜"}
        </h3>
        <p className="text-xs text-gray-300 mb-2">
          {isPrivate ? "He sits closer." : "His voice gets low."}
        </p>
        <div className="flex items-end justify-end">
          {isUnlocked ? (
            <button
              onClick={handleCTAClick}
              className="h-11 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm px-6 transition-all shadow-lg shadow-green-500/40 flex items-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Start
            </button>
          ) : (
            <button
              onClick={handleCTAClick}
              className="h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-6 transition-all shadow-xl shadow-violet-500/50 flex items-center gap-2"
            >
              <Lock className="h-3.5 w-3.5" />
              Unlock — {price}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Dark side moment card (ALWAYS blurred, forbidden, dangerous, larger, visually dominant)
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
  const [isSelected, setIsSelected] = useState(false)
  const imageSrc = situation.image || character.image || "/placeholder.svg"
  const price = formatPrice(MOMENT_PRICES[situation.momentLevel])

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  const handleCardClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault()
      if (!isSelected) {
        setIsSelected(true)
        onHover()
      }
    } else {
      onClick()
    }
  }

  const handleCTAClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMobile && isSelected) {
      onClick()
    } else if (!isMobile) {
      onClick()
    }
  }

  return (
    <div
      className={cn(
        "group relative h-[380px] md:h-[430px] lg:h-[860px] xl:h-[980px] rounded-3xl overflow-hidden border-2 transition-all duration-500 cursor-pointer",
        isUnlocked
          ? "bg-green-500/5 border-green-500/30"
          : "bg-[#0a0a0a] border-orange-500/60",
        isActive || isSelected
          ? "scale-[1.01] border-orange-500/80 shadow-2xl shadow-orange-500/60 z-10 ring-2 ring-orange-500/70"
          : "lg:opacity-95 lg:hover:opacity-100 lg:hover:scale-[1.005] hover:border-orange-500/70",
      )}
      onClick={handleCardClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      {!isUnlocked && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/10 via-orange-500/8 to-transparent animate-pulse" />
      )}

      <div className="absolute inset-0">
        {/* CRITICAL: Always render Image as bottom layer - MUST be real image, never flat gradient */}
        <Image
          src={imageSrc}
          alt={situation.title || "Dark side"}
          fill
          className={cn(
            "object-cover transition-transform duration-700 lg:group-hover:scale-105",
            // ALWAYS heavily blurred - forbidden aesthetic (even when unlocked)
            "blur-[18px] md:blur-[20px] lg:blur-[22px]"
          )}
          sizes="(max-width: 1024px) 100vw, 50vw"
          loading="lazy"
          onError={() => setImageError(true)}
        />
        {/* Fallback gradient ONLY if image completely fails to load */}
        {imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/80 to-red-900/80 blur-[18px] md:blur-[20px] lg:blur-[22px]" />
        )}
        {/* Heavy dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/85" />
        {/* Red/orange glow overlay - dangerous, forbidden */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/12 via-orange-500/10 to-transparent" />
        {/* Strong vignette - cinematic, forbidden */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at center, transparent 0%, transparent 20%, rgba(0,0,0,0.85) 100%)",
          }}
        />
        {/* Grain overlay - adds texture, forbidden aesthetic (opacity 0.25-0.40) */}
        <div
          className="absolute inset-0 opacity-[0.30]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            mixBlendMode: "overlay",
          }}
        />
      </div>

      {!isUnlocked && (
        <div className="absolute top-3 left-3 z-30">
          <span className="px-2.5 py-1 rounded-full bg-red-500/25 backdrop-blur-md border border-red-500/50 text-[10px] font-bold text-red-200 shadow-lg shadow-red-500/20">
            🔞 Not for everyone
          </span>
        </div>
      )}

      {!isUnlocked && (
        <div className="absolute top-3 right-3 z-30">
          <div className="w-7 h-7 rounded-full bg-black/90 backdrop-blur-md flex items-center justify-center border border-orange-400/50 shrink-0 shadow-lg shadow-orange-500/30">
            <Lock className="h-3.5 w-3.5 text-orange-300" />
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 lg:p-6 z-10">
        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 line-clamp-1">
          {situation.title || "Dark side"} 🖤🔥
        </h3>
        <div className="flex items-end justify-end mt-3">
          {isUnlocked ? (
            <button
              onClick={handleCTAClick}
              className="h-11 lg:h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm px-6 transition-all shadow-xl shadow-green-500/50 flex items-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Start
            </button>
          ) : (
            <div className="flex flex-col items-end gap-1.5">
              <button
                onClick={handleCTAClick}
                className="h-11 lg:h-12 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-sm px-6 transition-all shadow-xl shadow-orange-500/60 flex items-center gap-2 animate-pulse"
              >
                <Zap className="h-3.5 w-3.5" />
                Enter Dark Side — {price} 🔥
              </button>
              <p className="text-[10px] text-orange-300/70">Most unlocked tonight</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENT: Chat Tab
// ============================================================================

function ChatTab({
  character,
  characterSafe,
  messages,
  input,
  setInput,
  onSend,
  isLoadingMessages,
  isBlocked,
  showNarrativeBlock,
  blockingMessage,
  checkingOut,
  checkoutError,
  onContinueConversation,
  entitlements,
  isLoggedIn,
  user,
  showHistory,
  setShowHistory,
  characterId,
}: {
  character: Character
  characterSafe: SafeCharacter
  messages: Message[]
  input: string
  setInput: (v: string) => void
  onSend: () => void
  isLoadingMessages: boolean
  isBlocked: boolean
  showNarrativeBlock: boolean
  blockingMessage: string
  checkingOut: boolean
  checkoutError: string | null
  onContinueConversation: () => void
  entitlements: Entitlements | null
  isLoggedIn: boolean
  user: any
  showHistory: boolean
  setShowHistory: (v: boolean) => void
  characterId: string
}) {
  const [avatarError, setAvatarError] = useState(false)
  const { openModal } = useAuthModal()

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative h-16 w-16 overflow-hidden rounded-full mb-2 bg-gradient-to-br from-violet-500/30 to-pink-500/30">
              {!avatarError ? (
                <Image
                  src={character.image || "/placeholder.svg"}
                  alt={character.name}
                  fill
                  className="object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xl font-semibold text-white">{character.name[0]}</span>
                </div>
              )}
            </div>
            <h2 className="text-base font-semibold text-white">{character.name}</h2>
            <p className="text-[10px] text-gray-600 mt-1">All responses are AI-generated</p>
          </div>

          {isLoadingMessages && (
            <div className="flex justify-center mb-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          )}

          {messages.length === 0 && !isLoadingMessages && !isBlocked && (
            <div className="mb-4 flex gap-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500/30 to-pink-500/30">
                {!avatarError ? (
                  <Image
                    src={character.image || "/placeholder.svg"}
                    alt={character.name}
                    fill
                    className="object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">{character.name[0]}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="rounded-lg bg-[#151515] border border-white/5 p-4">
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {character.scenarioIntro}
                    {"\n\n"}
                    <span className="text-white">"{character.greetingOptions[0]}"</span>
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Tell me more...", "I've been thinking about you", "What do you want?"].map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => setInput(phrase)}
                      className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={cn("mb-4 flex gap-3", message.role === "user" && "flex-row-reverse")}>
              {message.role === "assistant" && (
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500/30 to-pink-500/30">
                  {!avatarError ? (
                    <Image
                      src={character.image || "/placeholder.svg"}
                      alt={character.name}
                      fill
                      className="object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">{character.name[0]}</span>
                    </div>
                  )}
                </div>
              )}
              <div className={cn("max-w-md", message.role === "user" && "text-right")}>
                <div
                  className={cn(
                    "rounded-lg p-3",
                    message.role === "user"
                      ? "bg-violet-500 text-white"
                      : "bg-[#151515] text-gray-300 border border-white/5",
                  )}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            </div>
          ))}

          {showNarrativeBlock && (
            <div className="mt-8 mb-4">
              <div className="rounded-2xl bg-gradient-to-br from-violet-500/5 via-pink-500/5 to-transparent border border-white/10 p-8 text-center">
                <div className="relative h-20 w-20 mx-auto mb-4 overflow-hidden rounded-full">
                  {!avatarError ? (
                    <Image
                      src={character.image || "/placeholder.svg"}
                      alt={character.name}
                      fill
                      className="object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-500/30 to-pink-500/30 flex items-center justify-center">
                      <span className="text-2xl font-semibold text-white">{character.name[0]}</span>
                    </div>
                  )}
                </div>
                <p className="text-xl text-white mb-2 font-medium">"{blockingMessage}"</p>
                <p className="text-sm text-gray-500 mb-8">— {character.name}</p>
                {checkoutError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{checkoutError}</p>
                  </div>
                )}
                <button
                  onClick={onContinueConversation}
                  disabled={checkingOut}
                  className="w-full max-w-xs mx-auto rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 py-3.5 text-sm font-semibold text-white hover:from-violet-500 hover:to-pink-500 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {checkingOut ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Continue • $3.99
                    </>
                  )}
                </button>
                <p className="text-[10px] text-gray-600 mt-4">Secure payment via Stripe</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isBlocked && (
        <div className="border-t border-white/5 px-4 py-3 shrink-0">
          <div className="mx-auto max-w-2xl">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSend()}
                placeholder="Type a message..."
                className="flex-1 rounded-xl bg-[#151515] border border-white/10 py-3 pl-4 pr-12 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
              <button
                onClick={onSend}
                className="absolute right-2 rounded-lg bg-transparent p-2 text-gray-500 hover:text-violet-400 transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <HistoryPanel
          characterId={characterId}
          onClose={() => setShowHistory(false)}
          onSelectSession={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}

// ============================================================================
// COMPONENT: Media Tab
// ============================================================================

function MediaTab({
  character,
  entitlements,
  isLoggedIn,
  onCheckout,
}: {
  character: SafeCharacter
  entitlements: Entitlements | null
  isLoggedIn: boolean
  onCheckout: (situation: Situation) => void
}) {
  const [showStickyCTA, setShowStickyCTA] = useState(false)
  
  // Mock media items - in production, this would come from character data or API
  const mediaItems = [
    { id: "1", type: "image", url: character.image || "/placeholder.svg", isLocked: true, height: "tall" },
    { id: "2", type: "image", url: character.image || "/placeholder.svg", isLocked: true, height: "short" },
    { id: "3", type: "video", url: character.image || "/placeholder.svg", isLocked: false, height: "tall" },
    { id: "4", type: "image", url: character.image || "/placeholder.svg", isLocked: true, height: "short" },
    { id: "5", type: "image", url: character.image || "/placeholder.svg", isLocked: true, height: "medium" },
    { id: "6", type: "video", url: character.image || "/placeholder.svg", isLocked: true, height: "tall" },
  ]

  const isMediaUnlocked = (mediaId: string) => {
    if (!entitlements?.authenticated) return false
    return entitlements.unlocks.some((u) => u.type === "media" && u.mediaId === mediaId)
  }

  // Show sticky CTA on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 200)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const lockedCount = mediaItems.filter((item) => item.isLocked && !isMediaUnlocked(item.id)).length
  const mediaPrice = formatPrice(399) // $3.99 for media unlock

  const totalItems = mediaItems.length
  const photoCount = mediaItems.filter((item) => item.type === "image").length
  const clipCount = mediaItems.filter((item) => item.type === "video").length

  return (
    <>
      {/* Compact header with addictive trigger */}
      <div className="mb-4 md:mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white mb-1">Locked gallery</h2>
          <p className="text-xs text-gray-400">
            {photoCount} photos • {clipCount} clips
          </p>
        </div>
        {lockedItems > 0 && (
          <button
            onClick={() => {
              onCheckout({
                id: "media-all",
                title: "Unlock all media",
                description: "",
                tags: [],
                isPaid: true,
                momentLevel: "private",
              })
            }}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors shadow-lg shadow-violet-500/40"
          >
            Unlock all
          </button>
        )}
      </div>

      {/* Masonry-style grid using Tailwind columns */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-3 lg:gap-4 space-y-2 md:space-y-3 lg:space-y-4">
        {mediaItems.map((item) => {
          const isUnlocked = isMediaUnlocked(item.id)
          const aspectClass = item.height === "tall" ? "aspect-[3/4]" : item.height === "medium" ? "aspect-[4/5]" : "aspect-square"
          
          return (
            <div
              key={item.id}
              className={cn(
                "group relative rounded-2xl overflow-hidden bg-[#151515] cursor-pointer break-inside-avoid mb-2 md:mb-3 lg:mb-4",
                aspectClass
              )}
            >
              {item.type === "image" ? (
                <>
                  <Image
                    src={item.url}
                    alt="Media"
                    fill
                    className={cn(
                      "object-cover transition-all duration-500 group-hover:scale-110",
                      !isUnlocked && item.isLocked ? "blur-lg" : ""
                    )}
                  />
                  {!isUnlocked && item.isLocked && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex items-center justify-center">
                      <div className="text-center p-4">
                        <div className="mb-3">
                          <Lock className="h-10 w-10 text-white/90 mx-auto mb-2" />
                        </div>
                        <p className="text-sm font-semibold text-white mb-2">Tap to unlock 👀</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onCheckout({
                              id: `media-${item.id}`,
                              title: "Unlock media",
                              description: "",
                              tags: [],
                              isPaid: true,
                              momentLevel: "private",
                            })
                          }}
                          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors shadow-lg shadow-violet-500/40"
                        >
                          Unlock — {mediaPrice}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="relative w-full h-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/20" />
                  <Video className="h-12 w-12 text-white/60 relative z-10" />
                  {!isUnlocked && item.isLocked && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex items-center justify-center z-20">
                      <div className="text-center p-4">
                        <Lock className="h-10 w-10 text-white/90 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-white mb-2">Tap to unlock 👀</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onCheckout({
                              id: `media-${item.id}`,
                              title: "Unlock media",
                              description: "",
                              tags: [],
                              isPaid: true,
                              momentLevel: "private",
                            })
                          }}
                          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors shadow-lg shadow-violet-500/40"
                        >
                          Unlock — {mediaPrice}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Sticky mini CTA for Media tab - lightweight */}
      {showStickyCTA && lockedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md border-white/10 bg-[#0a0a0a]/98">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white flex-1 min-w-0">
                Unlock media — {mediaPrice}
              </span>
              <button
                onClick={() => {
                  onCheckout({
                    id: "media-all",
                    title: "Unlock all media",
                    description: "",
                    tags: [],
                    isPaid: true,
                    momentLevel: "private",
                  })
                }}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors shadow-lg shadow-violet-500/40 h-9"
              >
                Unlock now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
    ? `Enter Dark Side — ${price} 🔥`
    : isUnlocked
      ? `Start ${activeMoment.title || "moment"}`
      : `Unlock ${activeMoment.title || "moment"} — ${price}`

  const buttonText = isOpeningCheckout
    ? "Opening..."
    : isUnlocked
      ? "Start"
      : isDarkSide
        ? "Enter now"
        : "Unlock now"

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md border-white/10 bg-[#0a0a0a]/98">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-white line-clamp-1 flex-1 min-w-0">
            {ctaText}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            disabled={isOpeningCheckout}
            className={cn(
              "px-5 py-2 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-50 shadow-lg h-9",
              isDarkSide && !isUnlocked
                ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-orange-500/50 animate-pulse"
                : "bg-violet-600 hover:bg-violet-700 shadow-violet-500/40"
            )}
          >
            {buttonText}
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
  const user = useUserStore()

  const [character, setCharacter] = useState<SafeCharacter | null>(null)
  const [rawCharacter, setRawCharacter] = useState<Character | null>(null)
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("moments")
  const [activeMoment, setActiveMoment] = useState<Situation | null>(null)
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false)
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [hasSupabaseAuth, setHasSupabaseAuth] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [showNarrativeBlock, setShowNarrativeBlock] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockingMessage, setBlockingMessage] = useState("")
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [chatSituation, setChatSituation] = useState<string | null>(null)

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
        const rawChar = getCharacterById(id)
        setRawCharacter(rawChar || null)
        // Default active moment: Free (mobile-first, conversion-optimized)
        const free = charData.situations.find((s) => !s.isPaid)
        const defaultMoment = free || null
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

  // Initialize chat session when switching to chat tab
  useEffect(() => {
    if (activeTab === "chat" && id && rawCharacter) {
      async function initSession() {
        setIsLoadingMessages(true)
        const authUserId = await verifyAuth()
        if (!authUserId) {
          setHasSupabaseAuth(false)
          setIsLoadingMessages(false)
          return
        }
        setHasSupabaseAuth(true)
        const session = await getOrCreateChatSession(authUserId, id)
        if (session) {
          setSessionId(session.id)
          const existingMessages = await loadChatMessages(session.id)
          if (existingMessages.length > 0) {
            setMessages(
              existingMessages.map((m) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
            )
            setMessageCount(existingMessages.length)
          }
        }
        setIsLoadingMessages(false)
      }
      initSession()
      if (rawCharacter) {
        userStore.addRecentChat(id)
      }
    }
  }, [activeTab, id, rawCharacter])

  const canContinue = useCallback((): boolean => {
    if (!entitlements?.authenticated) return false
    if (entitlements.hasPlus && entitlements.plusStatus === "active") return true
    if (chatSituation && character) {
      return entitlements.unlocks.some(
        (u) => u.type === "moment" && u.characterId === character.id && u.situationId === chatSituation,
      )
    }
    return false
  }, [entitlements, chatSituation, character])

  const handleSend = useCallback(async () => {
    if (!input.trim() || !rawCharacter) return
    if (isBlocked) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    const newCount = messageCount + 1
    setMessageCount(newCount)

    if (newCount >= 6 && !showNarrativeBlock && !canContinue()) {
      const blockingMessages = [
        "I was about to show you something… but not here.",
        "There's more I want to tell you… privately.",
        "I feel like we're just getting started...",
        "I have something for you, but I can't share it here.",
      ]
      setBlockingMessage(blockingMessages[Math.floor(Math.random() * blockingMessages.length)])
      setShowNarrativeBlock(true)
      setIsBlocked(true)
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `*${rawCharacter.name} looks at you thoughtfully*\n\n"${input.slice(0, 30)}..." I understand. Let me think about that for a moment.\n\n*pauses, considering your words*`,
      isFree: newCount < 6,
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput("")

    if (sessionId && hasSupabaseAuth) {
      await saveChatMessage(sessionId, "user", input)
      await saveChatMessage(sessionId, "assistant", assistantMessage.content)
    }
  }, [input, rawCharacter, sessionId, hasSupabaseAuth, messageCount, showNarrativeBlock, isBlocked, canContinue])

  const handleContinueConversation = async () => {
    if (!isLoggedIn) {
      openModal({
        type: "checkout",
        purchaseType: "moment",
        characterId: id || "",
        situationId: chatSituation || "chat",
        momentLevel: "private",
      })
      return
    }
    setCheckingOut(true)
    setCheckoutError(null)
    try {
      await openStripeCheckoutWithPurchaseType({
        purchaseType: "moment",
        characterId: id || "",
        situationId: chatSituation || "chat",
        momentLevel: "private",
      })
    } catch (error: any) {
      setCheckoutError(error?.message || "Payment failed. Please try again.")
      setCheckingOut(false)
    }
  }

  // Handle moment click - switch to Chat tab instead of routing
  const handleMomentClick = (situation: Situation) => {
    if (!character || isOpeningCheckout) return

    if (situation.id === "plus") {
      handleCheckout(situation)
      return
    }

    const isUnlocked = isMomentUnlocked(situation, character.id, entitlements)

    if (isUnlocked) {
      setChatSituation(situation.id)
      setActiveTab("chat")
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
      {/* Header with tabs */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <CharacterHeader character={character} />
          
          {/* Premium Segmented Control Tabs */}
          <div className="flex items-center gap-1.5 bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setActiveTab("moments")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-all rounded-md flex-1",
                activeTab === "moments"
                  ? "text-white bg-violet-500/20 shadow-lg shadow-violet-500/20 border border-violet-400/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Moments
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-all rounded-md flex-1",
                activeTab === "chat"
                  ? "text-white bg-violet-500/20 shadow-lg shadow-violet-500/20 border border-violet-400/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab("media")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-all rounded-md flex-1",
                activeTab === "media"
                  ? "text-white bg-violet-500/20 shadow-lg shadow-violet-500/20 border border-violet-400/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Media
            </button>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-20 sm:pb-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 md:py-6 lg:py-8">
          {activeTab === "moments" && (
            <>
              <MomentsGallery
                character={character}
                entitlements={entitlements}
                activeMoment={activeMoment}
                onMomentClick={handleMomentClick}
                onMomentHover={setActiveMoment}
              />
              <div className="flex items-center gap-3 pt-4 md:pt-6">
                <button
                  onClick={() => userStore.toggleFavorite(character.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm transition-colors",
                    isFavorite
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10",
                  )}
                >
                  <Star className={cn("h-3.5 w-3.5 md:h-4 md:w-4", isFavorite && "fill-yellow-400")} />
                  {isFavorite ? "Saved" : "Save"}
                </button>
              </div>
            </>
          )}

          {activeTab === "chat" && rawCharacter && (
            <ChatTab
              character={rawCharacter}
              characterSafe={character}
              messages={messages}
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isLoadingMessages={isLoadingMessages}
              isBlocked={isBlocked}
              showNarrativeBlock={showNarrativeBlock}
              blockingMessage={blockingMessage}
              checkingOut={checkingOut}
              checkoutError={checkoutError}
              onContinueConversation={handleContinueConversation}
              entitlements={entitlements}
              isLoggedIn={isLoggedIn}
              user={user}
              showHistory={showHistory}
              setShowHistory={setShowHistory}
              characterId={id || ""}
            />
          )}

          {activeTab === "media" && character && (
            <MediaTab
              character={character}
              entitlements={entitlements}
              isLoggedIn={isLoggedIn}
              onCheckout={handleCheckout}
            />
          )}
        </div>
      </div>

      {/* Sticky CTA bar - only for Moments tab */}
      {activeTab === "moments" && (
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
      )}
    </div>
  )
}
