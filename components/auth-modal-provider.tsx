"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { AuthModal } from "./auth-modal"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { openStripeCheckoutWithPurchaseType } from "@/lib/paywall"
import { getMomentProduct, getPlusProduct } from "@/lib/stripe-products"

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
  if (intent) {
    localStorage.setItem(INTENT_STORAGE_KEY, JSON.stringify(intent))
  } else {
    localStorage.removeItem(INTENT_STORAGE_KEY)
  }
}

function getStoredIntent(): AuthIntent | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(INTENT_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
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

      const executeIntent = async () => {
        try {
          if (currentIntent.type === "open_character") {
            const scrollTo = currentIntent.scrollTo || "moments"
            console.log("[AUTH] Opening character:", currentIntent.characterId, "scrollTo:", scrollTo)
            router.push(`/s/${currentIntent.characterId}?scrollTo=${scrollTo}`)
          } else if (currentIntent.type === "checkout") {
            console.log("[AUTH] Opening checkout with purchaseType:", currentIntent.purchaseType)
            await openStripeCheckoutWithPurchaseType({
              purchaseType: currentIntent.purchaseType,
              characterId: currentIntent.characterId,
              situationId: currentIntent.situationId,
              momentLevel: currentIntent.momentLevel,
              mediaId: currentIntent.mediaId,
            })
          }
        } catch (error) {
          console.error("[AUTH] Failed to execute intent:", error)
        } finally {
          // Clear intent after execution
          setCurrentIntent(null)
          storeIntent(null)
        }
      }

      // Small delay to ensure auth state is fully propagated
      const timeout = setTimeout(executeIntent, 100)
      return () => clearTimeout(timeout)
    }
  }, [isLoggedIn, isLoading, currentIntent, router])

  // Restore intent from localStorage on mount
  useEffect(() => {
    const stored = getStoredIntent()
    if (stored) {
      setCurrentIntent(stored)
      // If already logged in, execute immediately
      if (!isLoading && isLoggedIn) {
        // Intent will be executed by the effect above
      }
    }
  }, [isLoading, isLoggedIn])

  const openModal = (intent?: AuthIntent) => {
    // Never open modal if already logged in
    if (isLoggedIn) {
      console.log("[AUTH] User is logged in, skipping modal. Intent:", intent)
      // Execute intent directly if provided
      if (intent) {
        if (intent.type === "open_character") {
          const scrollTo = intent.scrollTo || "moments"
          router.push(`/s/${intent.characterId}?scrollTo=${scrollTo}`)
        } else if (intent.type === "checkout") {
          openStripeCheckoutWithPurchaseType({
            purchaseType: intent.purchaseType,
            characterId: intent.characterId,
            situationId: intent.situationId,
            momentLevel: intent.momentLevel,
            mediaId: intent.mediaId,
          }).catch(console.error)
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
