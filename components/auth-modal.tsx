"use client"

import { useState } from "react"
import { X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useI18n } from "@/components/i18n-provider"
import { getBrowserSupabase } from "@/lib/supabase/browser"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"login" | "signup">("login")

  if (!isOpen) return null

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password")
      return
    }

    const supabase = getBrowserSupabase()
    setIsLoading(true)
    setError(null)

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/discover` : "/discover",
            data: {
              username: `user_${Math.random().toString(36).substring(2, 8)}`,
              display_name: email.split("@")[0],
            },
          },
        })
        if (error) throw error
        setError("Check your email for verification link!")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.refresh()
        onSuccess?.()
        onClose()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: "google" | "apple") => {
    const supabase = getBrowserSupabase()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "/auth/callback",
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OAuth login failed")
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex w-full max-w-4xl overflow-hidden rounded-2xl bg-[#1a1a1a] shadow-2xl">
        {/* Left side - Form */}
        <div className="flex w-1/2 flex-col p-8">
          <h2 className="text-2xl font-bold text-white">{mode === "login" ? t("logInSignUp") : "Create Account"}</h2>
          <p className="mt-2 text-sm text-blue-400">{t("toChatWith")}</p>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => handleOAuthLogin("apple")}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-white py-3 font-medium text-black hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              {t("continueWithApple")}
            </button>

            <button
              onClick={() => handleOAuthLogin("google")}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-white py-3 font-medium text-black hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t("continueWithGoogle")}
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-sm text-gray-500">{t("or")}</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Email/Password form */}
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailAddress")}
              className="w-full rounded-lg bg-white/5 border border-white/10 py-3 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
              placeholder="Password"
              className="w-full rounded-lg bg-white/5 border border-white/10 py-3 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />

            {error && (
              <p className={`text-sm ${error.includes("Check your email") ? "text-green-400" : "text-red-400"}`}>
                {error}
              </p>
            )}

            <button
              onClick={handleEmailAuth}
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Loading..." : mode === "login" ? "Sign In" : "Sign Up"}
            </button>
          </div>

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-4 text-sm text-cyan-400 hover:text-cyan-300"
          >
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>

          <p className="mt-4 text-center text-xs text-gray-500">
            {t("byContin")}{" "}
            <a href="#" className="text-blue-400 hover:underline">
              {t("privacyPolicy")}
            </a>{" "}
            {t("and")}{" "}
            <a href="#" className="text-blue-400 hover:underline">
              {t("termsOfUse")}
            </a>
          </p>
        </div>

        {/* Right side - Image */}
        <div className="relative w-1/2 bg-gradient-to-br from-violet-900/50 to-pink-900/50">
          <Image
            src="/anime-girl-with-dragon-ethereal-blue-glow-fantasy-.jpg"
            alt="WHISPR"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
