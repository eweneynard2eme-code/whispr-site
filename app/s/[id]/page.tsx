"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
// Removed notFound import - we never throw in client components, show friendly UI instead
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Lock, Camera, Star, Sparkles, Check } from "lucide-react"
import { getCharacterById, type Character } from "@/lib/data"
import { cn } from "@/lib/utils"
import { userStore, useUserStore } from "@/lib/user-store"
import { useAuth } from "@/hooks/use-auth"
import { useAuthModal } from "@/components/auth-modal-provider"
import { openStripeCheckoutWithPurchaseType, subscribeCheckoutLock, getIsOpeningCheckout } from "@/lib/paywall"

type MomentLevel = "free" | "private" | "intimate" | "exclusive"

interface Situation {
  id: string
  title: string
  description: string
  tags: string[]
  isPaid: boolean
  momentLevel?: MomentLevel
  image?: string
  blurred?: boolean
  hasMedia?: boolean
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
    mediaId: string
  }>
}

const MOMENT_PRICES: Record<MomentLevel, { price: string; cents: number }> = {
  free: { price: "Free", cents: 0 },
  private: { price: "$3.99", cents: 399 },
  intimate: { price: "$4.99", cents: 499 },
  exclusive: { price: "$6.99", cents: 699 },
}

const MOMENT_DESCRIPTIONS: Record<MomentLevel, string> = {
  free: "Start your conversation",
  private: "A conversation that doesn't happen in public.",
  intimate: "He lowers his voice. This moment brings you closer.",
  exclusive: "Some moments are only shared once.",
}

function getCharacterGradient(name: string): string {
  const gradients = [
    "from-violet-600/80 to-purple-900/80",
    "from-pink-600/80 to-rose-900/80",
    "from-blue-600/80 to-indigo-900/80",
    "from-cyan-600/80 to-teal-900/80",
    "from-amber-600/80 to-orange-900/80",
    "from-fuchsia-600/80 to-pink-900/80",
  ]
  const index = name.charCodeAt(0) % gradients.length
  return gradients[index]
}

function getDefaultSituations(character: Character): Situation[] {
  // Defensive: ensure image exists
  const characterImage = character.image || "/placeholder.svg"
  return [
    {
      id: "free1",
      title: "Late night talk",
      description: "A calm, quiet conversation where anything can happen.",
      tags: ["calm", "quiet"],
      isPaid: false,
      momentLevel: "free",
      image: characterImage,
    },
    {
      id: "private1",
      title: "Private moment",
      description: MOMENT_DESCRIPTIONS.private,
      tags: ["private", "personal"],
      isPaid: true,
      momentLevel: "private",
      blurred: true,
    },
    {
      id: "intimate1",
      title: "Intimate moment",
      description: MOMENT_DESCRIPTIONS.intimate,
      tags: ["intimate", "closer"],
      isPaid: true,
      momentLevel: "intimate",
      blurred: true,
      hasMedia: true,
    },
    {
      id: "exclusive1",
      title: "Exclusive moment",
      description: MOMENT_DESCRIPTIONS.exclusive,
      tags: ["exclusive", "rare"],
      isPaid: true,
      momentLevel: "exclusive",
      blurred: true,
      hasMedia: true,
    },
  ]
}

export default function SituationsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params?.id as string
  const user = useUserStore()
  const { isLoggedIn } = useAuth()
  const { openModal } = useAuthModal()

  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [activeMoment, setActiveMoment] = useState<Situation | null>(null)
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false)

  useEffect(() => {
    async function fetchEntitlements() {
      try {
        const res = await fetch("/api/stripe/entitlements")
        const data = await res.json()
        setEntitlements(data)
      } catch (error) {
        console.error("[v0] Failed to fetch entitlements:", error)
      }
    }
    fetchEntitlements()
  }, [])

  // Subscribe to checkout lock state changes
  useEffect(() => {
    const unsubscribe = subscribeCheckoutLock((isLocked) => {
      setIsOpeningCheckout(isLocked)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    // Validate ID is a non-empty string
    if (typeof id !== "string" || id.trim().length === 0) {
      console.warn("[CHARACTER_PAGE] Invalid character ID:", id)
      setLoading(false)
      return
    }

    try {
      const char = getCharacterById(id)
      if (char) {
        setCharacter(char)
      } else {
        // Character not found - show not found state
        console.warn("[CHARACTER_PAGE] Character not found:", id)
      }
    } catch (error) {
      console.error("[CHARACTER_PAGE] Error loading character:", error)
      // Don't crash - just show loading/error state
    } finally {
      setLoading(false)
    }
  }, [id])

  // Auto-scroll to section based on scrollTo query param
  useEffect(() => {
    if (typeof window === "undefined") return
    if (loading || !character) return

    try {
      const scrollTo = searchParams.get("scrollTo")
      if (!scrollTo) return

      console.log("[CHARACTER_PAGE] Auto-scrolling to section:", scrollTo)

      let retries = 0
      const maxRetries = 6
      const retryDelay = 150

      const attemptScroll = () => {
        try {
          const element = document.querySelector(`[data-section="${scrollTo}"]`)
          if (element) {
            console.log("[CHARACTER_PAGE] Found section element, scrolling")
            element.scrollIntoView({ behavior: "smooth", block: "start" })
            // Clean up query param after scrolling
            try {
              const url = new URL(window.location.href)
              url.searchParams.delete("scrollTo")
              window.history.replaceState({}, "", url.toString())
            } catch {
              // Ignore URL manipulation errors
            }
          } else if (retries < maxRetries) {
            retries++
            console.log(`[CHARACTER_PAGE] Section not found, retrying (${retries}/${maxRetries})`)
            setTimeout(attemptScroll, retryDelay)
          } else {
            console.warn("[CHARACTER_PAGE] Section not found after max retries:", scrollTo)
          }
        } catch (error) {
          console.error("[CHARACTER_PAGE] Scroll error:", error)
          // Don't crash - just log and continue
        }
      }

      // Small delay to ensure DOM is ready
      const timeout = setTimeout(attemptScroll, 100)
      return () => clearTimeout(timeout)
    } catch (error) {
      console.error("[CHARACTER_PAGE] Scroll setup error:", error)
    }
  }, [searchParams, loading, character])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    )
  }


  // Guard: ensure character exists and has required properties before accessing
  if (!character) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold text-white mb-2">Character not found</h1>
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

  // Defensive checks: ensure character has required properties
  const characterName = character.name || "Character"
  const characterTags = character.tags || []
  const characterImage = character.image || "/placeholder.svg"
  const firstName = characterName.split(" ")[0] || characterName

  const isFavorite = userStore.isFavorite(character.id)
  const situations =
    (character.situations && character.situations.length > 0)
      ? character.situations.map((s) => ({ ...s, momentLevel: s.isPaid ? "private" : "free" }) as Situation)
      : getDefaultSituations(character)

  const isMomentUnlocked = (situation: Situation): boolean => {
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
        u.characterId === character.id &&
        u.situationId === situation.id &&
        u.momentLevel === situation.momentLevel,
    )
  }

  const handleCheckout = async (situation: Situation) => {
    // Prevent double triggers
    if (isOpeningCheckout || getIsOpeningCheckout()) {
      console.log("[PAYWALL] Checkout already opening, ignoring duplicate request")
      return
    }

    console.log("[PAYWALL] Checkout clicked:", { situationId: situation.id, isLoggedIn })

    // If not logged in, open auth modal with checkout intent
    if (!isLoggedIn) {
      console.log("[PAYWALL] User not logged in, opening auth modal with checkout intent")
      const isPlusPurchase = situation.id === "plus"
      openModal({
        type: "checkout",
        purchaseType: isPlusPurchase ? "plus" : "moment",
        characterId: character.id,
        situationId: situation.id,
        momentLevel: (situation.momentLevel || "private") as "private" | "intimate" | "exclusive",
      })
      return
    }

    // User is logged in - proceed directly to checkout
    setCheckingOut(situation.id)
    setCheckoutError(null)

    try {
      const isPlusPurchase = situation.id === "plus"

      await openStripeCheckoutWithPurchaseType(
        isPlusPurchase
        ? { purchaseType: "plus" }
        : {
            purchaseType: "moment",
            characterId: character.id,
            situationId: situation.id,
              momentLevel: situation.momentLevel || "private",
            },
      )
    } catch (error: any) {
      console.error("[v0] Checkout error:", error)
      setCheckoutError(error?.message || "Payment failed. Please try again.")
      setCheckingOut(null)
    }
  }

  const handleSituationClick = (situation: Situation) => {
    if (isMomentUnlocked(situation)) {
      router.push(`/chat/${character.id}?situation=${situation.id}`)
    } else {
      handleCheckout(situation)
    }
  }

  const freeSituations = situations.filter((s) => !s.isPaid)
  const paidSituations = situations.filter((s) => s.isPaid)

  // Set default active moment to "Closer" (first premium moment)
  useEffect(() => {
    if (!activeMoment && character) {
      const closerMoment = paidSituations.find((s) => s.momentLevel === "private" || s.momentLevel === "intimate")
      if (closerMoment) {
        setActiveMoment(closerMoment)
      } else if (paidSituations.length > 0) {
        setActiveMoment(paidSituations[0])
      } else if (freeSituations.length > 0) {
        setActiveMoment(freeSituations[0])
      }
    }
  }, [activeMoment, character, paidSituations, freeSituations])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left panel - character image */}
      <div className="hidden lg:flex w-[45%] xl:w-[40%] relative">
        <Link
          href="/discover"
          className="absolute top-6 left-6 z-30 flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {!imageError ? (
          <Image
            src={characterImage}
            alt={characterName}
            fill
            className="object-cover"
            priority
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br flex items-center justify-center",
              getCharacterGradient(characterName),
            )}
          >
            <div className="w-40 h-40 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-6xl font-semibold text-white">{characterName[0] || "?"}</span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Right panel - content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="lg:hidden px-4 py-4 flex items-center gap-3">
          <Link
            href="/discover"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-6 lg:px-10 xl:px-16 py-8 lg:py-12 pb-24 sm:pb-28">
          {/* Mobile image */}
          <div className="lg:hidden relative w-full aspect-[3/4] max-w-xs mx-auto mb-8 rounded-2xl overflow-hidden">
            {!imageError ? (
              <Image
                src={character.image || "/placeholder.svg"}
                alt={character.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br flex items-center justify-center",
                  getCharacterGradient(character.name),
                )}
              >
                <span className="text-4xl font-semibold text-white">{characterName[0] || "?"}</span>
              </div>
            )}
          </div>

          {/* Character info - Hero section */}
          <section data-section="hero" className="mb-8">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 tracking-tight">
              {characterName}
            </h1>

            <p className="text-lg lg:text-xl text-gray-400 mb-5 max-w-lg leading-relaxed">{character.description || ""}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {characterTags.slice(0, 5).map((tag) => (
                <span key={tag} className="text-xs text-gray-500 lowercase tracking-wide">
                  {tag} ·
                </span>
              ))}
            </div>

            <p className="text-sm text-gray-500 leading-relaxed max-w-md">
              Choose how you want to meet {firstName}.
            </p>
          </section>

          {entitlements?.authenticated && !entitlements?.hasPlus && (
            <div className="mb-8 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white mb-1">WHISPR Plus</h3>
                  <p className="text-xs text-gray-400 mb-2">A different kind of access.</p>
                  <ul className="text-xs text-gray-500 space-y-1 mb-3">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-violet-400" /> Access all Private + Intimate moments
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-violet-400" /> Characters engage more personally
                    </li>
                  </ul>
                  <button
                    onClick={() =>
                      handleCheckout({
                        id: "plus",
                        title: "WHISPR Plus",
                        description: "",
                        tags: [],
                        isPaid: true,
                        momentLevel: "private",
                      })
                    }
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Learn more • $12.99/mo →
                  </button>
                </div>
              </div>
            </div>
          )}

          {checkoutError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{checkoutError}</p>
              <button
                onClick={() => setCheckoutError(null)}
                className="text-xs text-red-500 hover:text-red-400 mt-2 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Moments section - Premium Gallery */}
          <section data-section="moments" className="mb-16">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Moments</h2>
              <p className="text-sm text-gray-400">Choose how you want to meet {firstName}</p>
            </div>

            {/* Tonight's path strip */}
            <div className="mb-6 flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-2 group/path" data-path-step="warm-up">
                <div className="w-2 h-2 rounded-full bg-violet-400 transition-all duration-300 group-hover/path:scale-125" />
                <span className="text-gray-400 transition-colors group-hover/path:text-violet-400">Warm-up</span>
              </div>
              <div className="w-8 h-px bg-gray-700" />
              <div className="flex items-center gap-2 group/path" data-path-step="closer">
                <div className="w-2 h-2 rounded-full bg-violet-500 transition-all duration-300 group-hover/path:scale-125" />
                <span className="text-gray-400 transition-colors group-hover/path:text-violet-400">Closer</span>
              </div>
              <div className="w-8 h-px bg-gray-700" />
              <div className="flex items-center gap-2 group/path" data-path-step="dark-side">
                <div className="w-2 h-2 rounded-full bg-amber-500 transition-all duration-300 group-hover/path:scale-125" />
                <span className="text-gray-400 transition-colors group-hover/path:text-amber-400">Dark side</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Free situations - Type 1: Safe */}
              {freeSituations.map((situation) => (
                <div
                  key={situation.id}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/10"
                  data-moment-type="warm-up"
                  onMouseEnter={() => {
                    setActiveMoment(situation)
                    const el = document.querySelector('[data-path-step="warm-up"]')
                    if (el) {
                      el.classList.add("!scale-110")
                      el.querySelector("span")?.classList.add("!text-violet-400")
                    }
                  }}
                  onMouseLeave={() => {
                    const el = document.querySelector('[data-path-step="warm-up"]')
                    if (el) {
                      el.classList.remove("!scale-110")
                      el.querySelector("span")?.classList.remove("!text-violet-400")
                    }
                  }}
                  onClick={() => {
                    if (isOpeningCheckout) return
                    setActiveMoment(situation)
                  }}
                >
                  {/* Image */}
                  <div className="absolute inset-0">
                    <Image
                      src={characterImage}
                      alt={situation.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  </div>

                  {/* Storytelling badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 rounded-full bg-violet-500/20 backdrop-blur-sm border border-violet-500/30 text-xs font-medium text-violet-300">
                      Warm-up
                    </span>
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                      {situation.title}
                    </h3>
                    <p className="text-sm text-gray-300 mb-4 leading-relaxed line-clamp-3">
                      {situation.description}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isOpeningCheckout) return
                        handleSituationClick(situation)
                      }}
                      disabled={isOpeningCheckout}
                      className="w-full py-2.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors mb-2 disabled:opacity-50"
                    >
                      {isOpeningCheckout ? "Opening checkout..." : "Start"}
                    </button>
                  </div>
                </div>
              ))}

              {/* Premium situations - Type 2: Premium (Private/Intimate) */}
              {paidSituations
                .filter((s) => s.momentLevel === "private" || s.momentLevel === "intimate")
                .map((situation) => {
                const isUnlocked = isMomentUnlocked(situation)
                const level = situation.momentLevel || "private"
                  const isPlusIncluded = entitlements?.hasPlus && entitlements?.plusStatus === "active"

                return (
                    <div
                    key={situation.id}
                      onClick={() => {
                        if (isOpeningCheckout) return
                        setActiveMoment(situation)
                        if (!isUnlocked) {
                          handleSituationClick(situation)
                        }
                      }}
                    className={cn(
                        "group relative aspect-[4/5] rounded-2xl overflow-hidden border transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer",
                      isUnlocked
                          ? "bg-green-500/5 border-green-500/30 hover:border-green-500/50"
                          : "bg-[#1a1a1a] border-violet-500/30 hover:border-violet-500/50 scale-[1.02] shadow-xl shadow-violet-500/5",
                      )}
                      data-moment-type="closer"
                      onMouseEnter={() => {
                        setActiveMoment(situation)
                        const el = document.querySelector('[data-path-step="closer"]')
                        if (el) {
                          el.classList.add("!scale-110")
                          el.querySelector("span")?.classList.add("!text-violet-400")
                        }
                      }}
                      onMouseLeave={() => {
                        const el = document.querySelector('[data-path-step="closer"]')
                        if (el) {
                          el.classList.remove("!scale-110")
                          el.querySelector("span")?.classList.remove("!text-violet-400")
                        }
                      }}
                    >
                      {/* Image with subtle intimacy */}
                      <div className="absolute inset-0">
                        <Image
                          src={character.image || "/placeholder.svg"}
                          alt={situation.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />
                    {!isUnlocked && (
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-pink-900/20 to-transparent" />
                        )}
                      </div>

                      {/* Storytelling badge */}
                      <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1 rounded-full bg-violet-500/20 backdrop-blur-sm border border-violet-500/30 text-xs font-medium text-violet-300">
                          Closer
                          </span>
                      </div>

                      {/* Lock indicator with label */}
                      {!isUnlocked && (
                        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-[10px] font-medium text-violet-300/80">
                            Locked
                          </span>
                          <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <Lock className="h-3 w-3 text-violet-400" />
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                          {situation.title}
                        </h3>
                        {!isUnlocked && (
                          <p className="text-sm text-violet-300/80 mb-2 italic leading-relaxed">
                            He gets closer than usual...
                          </p>
                        )}
                        <p className="text-sm text-gray-300 mb-4 leading-relaxed line-clamp-2">
                          {situation.description}
                        </p>
                          {isUnlocked ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (isOpeningCheckout) return
                              handleSituationClick(situation)
                            }}
                            disabled={isOpeningCheckout}
                            className="w-full py-2.5 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
                          >
                            {isOpeningCheckout ? "Opening checkout..." : "Start"}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isOpeningCheckout) return
                                handleSituationClick(situation)
                              }}
                              disabled={checkingOut === situation.id || isOpeningCheckout}
                              className="w-full py-2.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors mb-2 disabled:opacity-50"
                            >
                              {checkingOut === situation.id || isOpeningCheckout
                                ? "Opening checkout..."
                                : `Unlock – ${MOMENT_PRICES[level].price.replace("$", "€")}`}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isOpeningCheckout) return
                                handleCheckout({
                                  id: "plus",
                                  title: "WHISPR Plus",
                                  description: "",
                                  tags: [],
                                  isPaid: true,
                                  momentLevel: "private",
                                })
                              }}
                              disabled={isOpeningCheckout}
                              className="text-xs text-violet-400/80 hover:text-violet-400 text-center transition-colors mb-1 disabled:opacity-50"
                            >
                              Get WHISPR+ — unlock all moments tonight
                            </button>
                            <p className="text-[10px] text-violet-400/60 text-center">
                              (Best value) from €12.99/mo
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}

              {/* Exclusive situations - Type 3: Dark/Exclusive */}
              {paidSituations
                .filter((s) => s.momentLevel === "exclusive")
                .map((situation) => {
                  const isUnlocked = isMomentUnlocked(situation)
                  const level = situation.momentLevel || "exclusive"

                  return (
                    <div
                      key={situation.id}
                      onClick={() => {
                        if (isOpeningCheckout) return
                        setActiveMoment(situation)
                        if (!isUnlocked) {
                          handleSituationClick(situation)
                        }
                      }}
                      className={cn(
                        "group relative aspect-[4/5] rounded-2xl overflow-hidden border-2 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer",
                        isUnlocked
                          ? "bg-green-500/5 border-green-500/30 hover:border-green-500/50"
                          : "bg-[#0a0a0a] border-amber-500/40 hover:border-amber-500/60",
                        // Special emphasis for exclusive with pulsing animation
                        !isUnlocked && "animate-pulse-ring",
                      )}
                      data-moment-type="dark-side"
                      onMouseEnter={() => {
                        setActiveMoment(situation)
                        const el = document.querySelector('[data-path-step="dark-side"]')
                        if (el) {
                          el.classList.add("!scale-110")
                          el.querySelector("span")?.classList.add("!text-amber-400")
                        }
                      }}
                      onMouseLeave={() => {
                        const el = document.querySelector('[data-path-step="dark-side"]')
                        if (el) {
                          el.classList.remove("!scale-110")
                          el.querySelector("span")?.classList.remove("!text-amber-400")
                        }
                      }}
                    >
                      {/* Pulsing glow animation */}
                      {!isUnlocked && (
                        <div className="absolute inset-0 rounded-2xl bg-amber-500/10 animate-pulse opacity-50" />
                      )}

                      {/* Heavily blurred image with hover blur reduction */}
                      <div className="absolute inset-0">
                        <Image
                          src={character.image || "/placeholder.svg"}
                          alt={situation.title}
                          fill
                          className={cn(
                            "object-cover transition-all duration-700",
                            isUnlocked
                              ? "group-hover:scale-110"
                              : "scale-110 group-hover:blur-[14px] blur-[20px]",
                          )}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                        />
                        {/* Dark gradient overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
                        {!isUnlocked && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-red-900/30 to-black/80" />
                            {/* Grain texture effect */}
                            <div
                              className="absolute inset-0 opacity-30"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                                mixBlendMode: "overlay",
                              }}
                            />
                          </>
                          )}
                        </div>

                      {/* Storytelling badge */}
                      <div className="absolute top-4 left-4 z-30">
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-sm border border-amber-500/40 text-xs font-bold text-amber-300">
                          Dark side
                        </span>
                      </div>

                      {/* Lock indicator */}
                      {!isUnlocked && (
                        <div className="absolute top-4 right-4 z-30">
                          <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <Lock className="h-3 w-3 text-amber-400" />
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-amber-300 transition-colors">
                          {situation.title}
                        </h3>
                        {!isUnlocked && (
                          <>
                            <p className="text-sm text-amber-300/80 mb-2 italic leading-relaxed">
                              There's no turning back once you step into this moment. The intensity builds, and boundaries blur...
                            </p>
                            <p className="text-xs text-amber-400/60 mb-2 font-mono tracking-wider">
                              He whispers: "•••• •••• •••"
                            </p>
                          </>
                        )}
                        <p
                          className={cn(
                            "text-sm mb-4 leading-relaxed line-clamp-2",
                            isUnlocked ? "text-gray-300" : "text-gray-400",
                          )}
                        >
                          {isUnlocked ? situation.description : situation.description}
                        </p>
                        {isUnlocked ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (isOpeningCheckout) return
                              handleSituationClick(situation)
                            }}
                            disabled={isOpeningCheckout}
                            className="w-full py-2.5 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
                          >
                            {isOpeningCheckout ? "Opening checkout..." : "Start"}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isOpeningCheckout) return
                                handleSituationClick(situation)
                              }}
                              disabled={checkingOut === situation.id || isOpeningCheckout}
                              className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-colors mb-2 disabled:opacity-50"
                            >
                              {checkingOut === situation.id || isOpeningCheckout
                                ? "Opening checkout..."
                                : `Unlock Dark Side – ${MOMENT_PRICES[level].price.replace("$", "€")}`}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isOpeningCheckout) return
                                handleCheckout({
                                  id: "plus",
                                  title: "WHISPR Plus",
                                  description: "",
                                  tags: [],
                                  isPaid: true,
                                  momentLevel: "private",
                                })
                              }}
                              disabled={isOpeningCheckout}
                              className="text-xs text-amber-400/80 hover:text-amber-400 text-center transition-colors mb-1 disabled:opacity-50"
                            >
                              Get WHISPR+ — unlock all moments tonight
                            </button>
                            <p className="text-[10px] text-amber-400/60 text-center">
                              (Best value) from €12.99/mo
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                )
              })}
            </div>
          </section>

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

      {/* Sticky bottom CTA bar */}
      {activeMoment && (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md transition-colors",
            activeMoment.momentLevel === "free"
              ? "border-white/10 bg-[#0a0a0a]/95"
              : activeMoment.momentLevel === "exclusive"
                ? "border-amber-500/30 bg-[#0a0a0a]/95 ring-2 ring-amber-500/20"
                : "border-violet-500/30 bg-[#0a0a0a]/95",
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              {/* Left: Moment name + price */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="text-sm sm:text-base font-semibold text-white">
                    {activeMoment.momentLevel === "free"
                      ? `Start ${activeMoment.title}`
                      : activeMoment.momentLevel === "exclusive"
                        ? `Unlock Dark side — ${MOMENT_PRICES[activeMoment.momentLevel].price.replace("$", "€")}`
                        : `Unlock ${activeMoment.title} — ${MOMENT_PRICES[activeMoment.momentLevel || "private"].price.replace("$", "€")}`}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Unlock in seconds • Instant access</p>
              </div>

              {/* Right: Action buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (activeMoment.momentLevel === "free") {
                      handleSituationClick(activeMoment)
                    } else {
                      handleSituationClick(activeMoment)
                    }
                  }}
                  disabled={checkingOut === activeMoment.id || isOpeningCheckout}
                  className={cn(
                    "px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors disabled:opacity-50",
                    activeMoment.momentLevel === "free"
                      ? "bg-violet-600 hover:bg-violet-700 text-white"
                      : activeMoment.momentLevel === "exclusive"
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "bg-violet-600 hover:bg-violet-700 text-white",
                  )}
                >
                  {checkingOut === activeMoment.id || isOpeningCheckout
                    ? "Opening checkout..."
                    : activeMoment.momentLevel === "free"
                      ? "Start"
                      : "Unlock now"}
                </button>
              </div>
            </div>

            {/* Secondary WHISPR+ link */}
            {activeMoment.momentLevel !== "free" && (
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/5">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isOpeningCheckout) return
                    handleCheckout({
                      id: "plus",
                      title: "WHISPR Plus",
                      description: "",
                      tags: [],
                      isPaid: true,
                      momentLevel: "private",
                    })
                  }}
                  disabled={isOpeningCheckout}
                  className="text-xs text-violet-400/80 hover:text-violet-400 transition-colors disabled:opacity-50"
                >
                  Get WHISPR+ (Best value) — unlock all moments tonight
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
