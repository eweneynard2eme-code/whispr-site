"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, RotateCcw } from "lucide-react"
import { debugError, isDebugMode } from "@/lib/debug"
import { resetClientState } from "@/lib/reset-client-state"
import { toast } from "@/hooks/use-toast"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Always log errors in production for debugging
    debugError("ERROR_BOUNDARY", error, {
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "unknown",
    })
    
    // Show toast in production if debug mode is on
    if (isDebugMode() && typeof window !== "undefined") {
      toast({
        title: "Error Detected",
        description: error?.message || "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }, [error])

  const handleReset = () => {
    resetClientState()
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-500/10 p-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">Something went wrong</h1>
        <p className="text-gray-400 mb-6">
          We encountered an unexpected error. Please try reloading the page.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <div className="flex gap-3">
            <Button
              onClick={() => {
                reset()
              }}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            <Button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/"
                }
              }}
              variant="outline"
              className="border-white/10 text-gray-400 hover:text-white"
            >
              Go home
            </Button>
          </div>
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-500/50 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-2" />
            Reset & reload
          </Button>
        </div>
        {(isDebugMode() || process.env.NODE_ENV === "development") && error.message && (
          <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-left">
            <p className="text-xs text-red-400 font-mono break-all">{error.message}</p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-red-500/60 cursor-pointer">Stack trace</summary>
                <pre className="text-xs text-red-500/40 mt-2 whitespace-pre-wrap font-mono">
                  {error.stack}
                </pre>
              </details>
            )}
            {error.digest && (
              <p className="text-xs text-red-500/60 mt-2">Digest: {error.digest}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

