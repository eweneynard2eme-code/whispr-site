"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { AuthModal } from "./auth-modal"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { openStripeCheckoutWithPurchaseType } from "@/lib/paywall"
import { getMomentProduct, getPlusProduct } from "@/lib/stripe-products"
import { safeParse } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

export type AuthIntent =
  | {
      type: "open_character"
      characterId: string
      scrollTo?: "moments" | "hero" | "chat"
    }
  | {
      type: "checkout"
      purchaseType: "moment" | "media" | "plus"
      characterId?: string
      situationId?: string
      momentLevel?: "private" | "intimate" | "exclusive"
      mediaId?: string
    }

interface AuthModalContextType {
  isOpen: boolean
  openModal: (intent?: AuthIntent) => void
  closeModal: () => void
  currentIntent: AuthIntent | null
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

const INTENT_STORAGE_KEY = "whispr_auth_intent"

function storeIntent(intent: AuthIntent | null) {
  if (typeof window === "undefined") return
  try {
    if (intent) {
      // Never store undefined values
      const serialized = JSON.stringify(intent)
      if (serialized && serialized !== "undefined") {
        localStorage.setItem(INTENT_STORAGE_KEY, serialized)
      }
    } else {
      localStorage.removeItem(INTENT_STORAGE_KEY)
    }
  } catch (error) {
    // Silently fail - localStorage might be disabled or full
    if (process.env.NODE_ENV === "development") {
      console.warn("[AUTH] Failed to store intent:", error)
    }
  }
}

function getStoredIntent(): AuthIntent | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(INTENT_STORAGE_KEY)
    if (!stored) return null
    // Use safeParse which will remove corrupted values
    return safeParse<AuthIntent>(stored, INTENT_STORAGE_KEY)
  } catch {
    // Fallback: remove corrupted value
    try {
      localStorage.removeItem(INTENT_STORAGE_KEY)
    } catch {
      // Ignore
    }
    return null
  }
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIntent, setCurrentIntent] = useState<AuthIntent | null>(null)
  const { isLoggedIn, isLoading } = useAuth()
  const router = useRouter()

  // Execute intent after successful login
  useEffect(() => {
    if (!isLoading && isLoggedIn && currentIntent) {
      console.log("[AUTH] Executing stored intent after login:", currentIntent)

      // Clear intent immediately to prevent loops
      const intentToExecute = currentIntent
      setCurrentIntent(null)
      storeIntent(null)

      const executeIntent = async () => {
        try {
          if (intentToExecute.type === "open_character") {
            const scrollTo = intentToExecute.scrollTo || "moments"
            const characterId = intentToExecute.characterId
            
            // Validate character ID before navigation
            if (!characterId || typeof characterId !== "string" || characterId.trim().length === 0) {
              console.warn("[AUTH] Invalid character ID in intent:", characterId)
              throw new Error("Invalid character ID")
            }
            
            console.log("[AUTH] Opening character:", characterId, "scrollTo:", scrollTo)
            
            // Use router.push with error handling
            try {
              router.push(`/s/${encodeURIComponent(characterId)}?scrollTo=${encodeURIComponent(scrollTo)}`)
            } catch (routerError) {
              console.error("[AUTH] Router push failed:", routerError)
              // Fallback to window.location if router fails
              if (typeof window !== "undefined") {
                window.location.href = `/s/${encodeURIComponent(characterId)}?scrollTo=${encodeURIComponent(scrollTo)}`
              } else {
                throw new Error("Navigation failed")
              }
            }
          } else if (intentToExecute.type === "checkout") {
            console.log("[AUTH] Opening checkout with purchaseType:", intentToExecute.purchaseType)
            await openStripeCheckoutWithPurchaseType({
              purchaseType: intentToExecute.purchaseType,
              characterId: intentToExecute.characterId,
              situationId: intentToExecute.situationId,
              momentLevel: intentToExecute.momentLevel,
              mediaId: intentToExecute.mediaId,
            })
          }
        } catch (error: any) {
          console.error("[AUTH] Failed to execute intent:", error)
          // Show user-friendly error
          toast({
            title: "Something went wrong",
            description: error?.message || "Unable to complete your request. Please try again.",
            variant: "destructive",
          })
          // Fallback to safe route
          try {
            router.push("/discover")
          } catch {
            // If router fails, try window.location as last resort
            if (typeof window !== "undefined") {
              window.location.href = "/discover"
            }
          }
        }
      }

      // Small delay to ensure auth state is fully propagated
      const timeout = setTimeout(executeIntent, 100)
      return () => clearTimeout(timeout)
    }
  }, [isLoggedIn, isLoading, currentIntent, router])

  // Restore intent from localStorage on mount (client-side only) - runs once
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const stored = getStoredIntent()
      if (stored) {
        // Validate stored intent structure thoroughly
        if (
          stored &&
          typeof stored === "object" &&
          "type" in stored &&
          (stored.type === "open_character" || stored.type === "checkout")
        ) {
          // Validate open_character intent
          if (stored.type === "open_character") {
            if (typeof stored.characterId === "string" && stored.characterId.length > 0) {
              setCurrentIntent(stored)
            } else {
              console.warn("[AUTH] Invalid open_character intent: missing characterId")
              storeIntent(null)
            }
          }
          // Validate checkout intent
          else if (stored.type === "checkout") {
            if (
              typeof stored.purchaseType === "string" &&
              ["moment", "media", "plus"].includes(stored.purchaseType)
            ) {
              setCurrentIntent(stored)
            } else {
              console.warn("[AUTH] Invalid checkout intent: invalid purchaseType")
              storeIntent(null)
            }
          }
        } else {
          // Invalid intent structure - remove it
          console.warn("[AUTH] Invalid intent structure, removing")
          storeIntent(null)
        }
      }
    } catch (error) {
      // If anything fails, clear corrupted intent
      console.error("[AUTH] Failed to restore intent:", error)
      storeIntent(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount only

  const openModal = (intent?: AuthIntent) => {
    // CRITICAL: Never open modal if already logged in OR if still loading
    // This prevents modal from opening during auth state hydration
    if (isLoading || isLoggedIn) {
      if (isLoading) {
        console.log("[AUTH] Auth state loading, skipping modal open")
        return
      }
      console.log("[AUTH] User is logged in, skipping modal. Intent:", intent)
      // Execute intent directly if provided
      if (intent) {
        try {
          if (intent.type === "open_character") {
            const scrollTo = intent.scrollTo || "moments"
            const characterId = intent.characterId
            
            // Validate character ID before navigation
            if (!characterId || typeof characterId !== "string" || characterId.trim().length === 0) {
              console.warn("[AUTH] Invalid character ID in intent:", characterId)
              throw new Error("Invalid character ID")
            }
            
            try {
              router.push(`/s/${encodeURIComponent(characterId)}?scrollTo=${encodeURIComponent(scrollTo)}`)
            } catch (routerError) {
              console.error("[AUTH] Router push failed:", routerError)
              if (typeof window !== "undefined") {
                window.location.href = `/s/${encodeURIComponent(characterId)}?scrollTo=${encodeURIComponent(scrollTo)}`
              } else {
                throw new Error("Navigation failed")
              }
            }
          } else if (intent.type === "checkout") {
            openStripeCheckoutWithPurchaseType({
              purchaseType: intent.purchaseType,
              characterId: intent.characterId,
              situationId: intent.situationId,
              momentLevel: intent.momentLevel,
              mediaId: intent.mediaId,
            }).catch((error) => {
              console.error("[AUTH] Checkout error:", error)
              toast({
                title: "Payment Error",
                description: error?.message || "Unable to open checkout. Please try again.",
                variant: "destructive",
              })
            })
          }
        } catch (error: any) {
          console.error("[AUTH] Failed to execute intent:", error)
          toast({
            title: "Error",
            description: error?.message || "Unable to complete your request.",
            variant: "destructive",
          })
        }
      }
      return
    }

    console.log("[AUTH] Opening auth modal with intent:", intent)
    if (intent) {
      setCurrentIntent(intent)
      storeIntent(intent)
    }
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    // Don't clear intent on close - user might reopen modal
  }

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        openModal,
        closeModal,
        currentIntent,
      }}
    >
      {children}
      <AuthModal
        isOpen={isOpen}
        onClose={closeModal}
        onSuccess={() => {
          closeModal()
          // Intent will be executed by the effect above when auth state updates
        }}
      />
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider")
  }
  return context
}
