"use client"

import { toast } from "@/hooks/use-toast"

// Shared checkout opening lock to prevent multiple Stripe sessions
let isOpeningCheckout = false
let lockTimeout: ReturnType<typeof setTimeout> | null = null

// Pub/sub system for lock state changes
const listeners = new Set<(value: boolean) => void>()

/**
 * Subscribe to checkout lock state changes.
 * @param callback - Function called whenever lock state changes
 * @returns Unsubscribe function
 */
export function subscribeCheckoutLock(callback: (value: boolean) => void): () => void {
  listeners.add(callback)
  // Immediately call with current state
  callback(isOpeningCheckout)
  // Return unsubscribe function
  return () => {
    listeners.delete(callback)
  }
}

/**
 * Notifies all listeners of lock state changes.
 */
function notifyListeners(): void {
  listeners.forEach((cb) => cb(isOpeningCheckout))
}

/**
 * Checks if checkout is currently being opened (locked).
 * @returns true if checkout is locked, false otherwise
 */
export function getIsOpeningCheckout(): boolean {
  return isOpeningCheckout
}

/**
 * Sets the checkout opening lock state.
 * Auto-resets after 3 seconds or on error.
 * Notifies all subscribers of the change.
 */
function setCheckoutLock(locked: boolean): void {
  isOpeningCheckout = locked

  if (lockTimeout) {
    clearTimeout(lockTimeout)
    lockTimeout = null
  }

  if (locked) {
    // Auto-reset after 3 seconds as safety fallback
    lockTimeout = setTimeout(() => {
      console.log("[PAYWALL] Checkout lock auto-reset after 3s")
      isOpeningCheckout = false
      lockTimeout = null
      notifyListeners()
    }, 3000)
  }

  // Notify all listeners of the lock state change
  notifyListeners()
}

/**
 * Opens Stripe Checkout for a paid item using purchaseType (legacy format).
 * Shows loading spinner after 800ms, handles errors with toast notifications.
 *
 * @param purchaseData - Object with purchaseType and related fields
 * @returns Promise that resolves when redirect starts, rejects on error
 */
export async function openStripeCheckoutWithPurchaseType(
  purchaseData: {
    purchaseType: "moment" | "media" | "plus"
    characterId?: string
    situationId?: string
    momentLevel?: string
    mediaId?: string
  },
): Promise<void> {
  // Check if checkout is already opening
  if (isOpeningCheckout) {
    console.log("[PAYWALL] Checkout already opening, ignoring duplicate request")
    return
  }

  const { purchaseType, characterId, situationId, momentLevel, mediaId } = purchaseData

  // Set checkout lock
  setCheckoutLock(true)

  // Show spinner after 800ms if request is slow
  let spinnerTimeout: ReturnType<typeof setTimeout> | null = null
  const showSpinner = () => {
    spinnerTimeout = setTimeout(() => {
      // Spinner is handled by the calling component's loading state
      console.log("[PAYWALL] Request taking longer than 800ms, showing spinner...")
    }, 800)
  }

  showSpinner()

  try {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log("[PAYWALL] Opening checkout with purchaseType:", { requestId, purchaseType })

    const body: any = { purchaseType }
    if (characterId) body.characterId = characterId
    if (situationId) body.situationId = situationId
    if (momentLevel) body.momentLevel = momentLevel
    if (mediaId) body.mediaId = mediaId

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (spinnerTimeout) {
      clearTimeout(spinnerTimeout)
      spinnerTimeout = null
    }

    const data = await response.json()
    console.log("[PAYWALL] Checkout response:", { requestId, status: response.status, hasUrl: !!data.url })

    if (!response.ok) {
      const errorMsg = data.error || "Payment failed. Please try again."
      console.error("[PAYWALL] Checkout failed:", { requestId, error: errorMsg, status: response.status })
      toast({
        title: "Payment Error",
        description: errorMsg,
        variant: "destructive",
      })
      throw new Error(errorMsg)
    }

    if (!data.url) {
      const errorMsg = "Unable to start payment. Please try again."
      console.error("[PAYWALL] No checkout URL in response:", { requestId, data })
      toast({
        title: "Payment Error",
        description: errorMsg,
        variant: "destructive",
      })
      throw new Error(errorMsg)
    }

    console.log("[PAYWALL] Redirecting to Stripe checkout:", { requestId, url: data.url })
    // Lock remains until redirect completes (page unload)
    // Immediately redirect to Stripe
    window.location.assign(data.url)
  } catch (error: any) {
    // Reset lock on error
    setCheckoutLock(false)

    if (spinnerTimeout) {
      clearTimeout(spinnerTimeout)
      spinnerTimeout = null
    }

    const errorMsg = error?.message || "Payment failed. Please try again."
    console.error("[PAYWALL] Checkout error:", {
      error: errorMsg,
      stack: error?.stack,
      name: error?.name,
    })

    // Only show toast if it's not already shown (from the response handling above)
    if (!error?.message?.includes("Payment failed")) {
      toast({
        title: "Payment Error",
        description: errorMsg,
        variant: "destructive",
      })
    }

    throw error
  }
}

/**
 * Opens Stripe Checkout for a paid item using priceId (new format).
 * Shows loading spinner after 800ms, handles errors with toast notifications.
 *
 * @param priceId - Stripe Price ID (required)
 * @param metadata - Additional metadata to pass to Stripe (optional)
 * @returns Promise that resolves when redirect starts, rejects on error
 */
export async function openStripeCheckout(
  priceId: string,
  metadata?: Record<string, string>,
): Promise<void> {
  // Check if checkout is already opening
  if (isOpeningCheckout) {
    console.log("[PAYWALL] Checkout already opening, ignoring duplicate request")
    return
  }

  if (!priceId) {
    const errorMsg = "Missing price ID. Please contact support."
    console.error("[PAYWALL] Missing priceId")
    toast({
      title: "Payment Error",
      description: errorMsg,
      variant: "destructive",
    })
    throw new Error(errorMsg)
  }

  // Set checkout lock
  setCheckoutLock(true)

  // Show spinner after 800ms if request is slow
  let spinnerTimeout: ReturnType<typeof setTimeout> | null = null
  const showSpinner = () => {
    spinnerTimeout = setTimeout(() => {
      // Spinner is handled by the calling component's loading state
      console.log("[PAYWALL] Request taking longer than 800ms, showing spinner...")
    }, 800)
  }

  showSpinner()

  try {
    console.log("[PAYWALL] Opening checkout for priceId:", priceId, "metadata:", metadata)

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log("[PAYWALL] Request ID:", requestId)

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId,
        metadata: metadata || {},
      }),
    })

    if (spinnerTimeout) {
      clearTimeout(spinnerTimeout)
      spinnerTimeout = null
    }

    const data = await response.json()
    console.log("[PAYWALL] Checkout response:", { requestId, status: response.status, hasUrl: !!data.url })

    if (!response.ok) {
      const errorMsg = data.error || "Payment failed. Please try again."
      console.error("[PAYWALL] Checkout failed:", { requestId, error: errorMsg, status: response.status })
      toast({
        title: "Payment Error",
        description: errorMsg,
        variant: "destructive",
      })
      throw new Error(errorMsg)
    }

    if (!data.url) {
      const errorMsg = "Unable to start payment. Please try again."
      console.error("[PAYWALL] No checkout URL in response:", { requestId, data })
      toast({
        title: "Payment Error",
        description: errorMsg,
        variant: "destructive",
      })
      throw new Error(errorMsg)
    }

    console.log("[PAYWALL] Redirecting to Stripe checkout:", { requestId, url: data.url })
    // Lock remains until redirect completes (page unload)
    // Immediately redirect to Stripe
    window.location.assign(data.url)
  } catch (error: any) {
    // Reset lock on error
    setCheckoutLock(false)

    if (spinnerTimeout) {
      clearTimeout(spinnerTimeout)
      spinnerTimeout = null
    }

    const errorMsg = error?.message || "Payment failed. Please try again."
    console.error("[PAYWALL] Checkout error:", {
      error: errorMsg,
      stack: error?.stack,
      name: error?.name,
    })

    // Only show toast if it's not already shown (from the response handling above)
    if (!error?.message?.includes("Payment failed")) {
      toast({
        title: "Payment Error",
        description: errorMsg,
        variant: "destructive",
      })
    }

    throw error
  }
}

