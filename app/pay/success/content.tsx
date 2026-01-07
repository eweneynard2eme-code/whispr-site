"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"

export function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [metadata, setMetadata] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setStatus("error")
      return
    }

    async function verify() {
      try {
        const res = await fetch(`/api/stripe/verify?session_id=${sessionId}`)
        const data = await res.json()

        if (data.status === "complete") {
          setStatus("success")
          setMetadata(data.metadata)
          // Don't auto-redirect, let user click Continue button
        } else {
          setStatus("error")
        }
      } catch {
        setStatus("error")
      }
    }

    verify()
  }, [sessionId, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying payment...</p>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-3xl">✕</span>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Payment Issue</h1>
          <p className="text-gray-400 mb-6">There was a problem verifying your payment.</p>
          <button
            onClick={() => router.push("/discover")}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors"
          >
            Return to Discover
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Confirmed</h1>
        <p className="text-gray-400 mb-8">
          {metadata?.purchaseType === "plus"
            ? "Welcome to WHISPR Plus! You now have access to all Private and Intimate moments."
            : "Your payment was successful and your content has been unlocked."}
        </p>
        <button
          onClick={() => {
            if (metadata?.characterId) {
              router.push(`/chat/${metadata.characterId}?situation=${metadata.situationId || ""}`)
            } else {
              router.push("/discover")
            }
          }}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
