"use client"

import { useCallback, useState } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { X } from "lucide-react"

import { startCheckoutSession } from "@/app/actions/stripe"

import { ENV_STRIPE } from "@/lib/env"

const stripePromise = ENV_STRIPE.PUBLISHABLE_KEY
  ? loadStripe(ENV_STRIPE.PUBLISHABLE_KEY)
  : Promise.resolve(null)

interface StripeCheckoutProps {
  productId: string
  metadata?: Record<string, string>
  onClose: () => void
  onSuccess?: () => void
}

export default function StripeCheckout({ productId, metadata, onClose, onSuccess }: StripeCheckoutProps) {
  const [isComplete, setIsComplete] = useState(false)

  const fetchClientSecret = useCallback(() => {
    return startCheckoutSession(productId, metadata)
  }, [productId, metadata])

  const handleComplete = useCallback(() => {
    setIsComplete(true)
    onSuccess?.()
  }, [onSuccess])

  if (isComplete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-card rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Payment Successful!</h3>
          <p className="text-muted-foreground mb-6">Your content has been unlocked.</p>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <div id="checkout" className="p-4">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{
              fetchClientSecret,
              onComplete: handleComplete,
            }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  )
}
