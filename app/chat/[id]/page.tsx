"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Send, Star, X, Lock, Sparkles } from "lucide-react"
import { getCharacterById, formatNumber, type Character } from "@/lib/data"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import type { ChatMode } from "@/components/chat-mode-selector"
import { HistoryPanel } from "@/components/history-panel"
import { userStore, useUserStore } from "@/lib/user-store"
import { getOrCreateChatSession, loadChatMessages, saveChatMessage, verifyAuth } from "@/lib/supabase/chat"
import { useAuth } from "@/hooks/use-auth"
import { useAuthModal } from "@/components/auth-modal-provider"
import { openStripeCheckoutWithPurchaseType } from "@/lib/paywall"
import { openStripeCheckoutWithPurchaseType } from "@/lib/paywall"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isFree?: boolean
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

const BLOCKING_MESSAGES = [
  "I was about to show you something… but not here.",
  "There's more I want to tell you… privately.",
  "I feel like we're just getting started...",
  "I have something for you, but I can't share it here.",
]

const FREE_MESSAGE_LIMIT = 6

export default function ChatPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id as string
  const situation = searchParams.get("situation")
  const { t } = useI18n()
  const user = useUserStore()
  const { isLoggedIn } = useAuth()
  const { openModal } = useAuthModal()

  const [character, setCharacter] = useState<Character | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [showPanel, setShowPanel] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>("standard")
  const [showHistory, setShowHistory] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [hasSupabaseAuth, setHasSupabaseAuth] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [showNarrativeBlock, setShowNarrativeBlock] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockingMessage, setBlockingMessage] = useState("")
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

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

  const canContinue = useCallback((): boolean => {
    if (!entitlements?.authenticated) return false

    // Plus subscribers can continue private/intimate
    if (entitlements.hasPlus && entitlements.plusStatus === "active") {
      return true
    }

    // Check for specific unlock
    if (situation && character) {
      return entitlements.unlocks.some(
        (u) => u.type === "moment" && u.characterId === character.id && u.situationId === situation,
      )
    }

    return false
  }, [entitlements, situation, character])

  useEffect(() => {
    if (id) {
      const char = getCharacterById(id)
      setCharacter(char || null)
      if (char) {
        userStore.addRecentChat(id)
      }
    }
  }, [id])

  useEffect(() => {
    async function initSession() {
      if (!id) return

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
  }, [id])

  const handleSend = useCallback(async () => {
    if (!input.trim() || !character) return
    if (isBlocked) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    const newCount = messageCount + 1
    setMessageCount(newCount)

    if (newCount >= FREE_MESSAGE_LIMIT && !showNarrativeBlock && !canContinue()) {
      setBlockingMessage(BLOCKING_MESSAGES[Math.floor(Math.random() * BLOCKING_MESSAGES.length)])
      setShowNarrativeBlock(true)
      setIsBlocked(true)
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `*${character.name} looks at you thoughtfully*\n\n"${input.slice(0, 30)}..." I understand. Let me think about that for a moment.\n\n*pauses, considering your words*`,
      isFree: newCount < FREE_MESSAGE_LIMIT,
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput("")

    if (sessionId && hasSupabaseAuth) {
      await saveChatMessage(sessionId, "user", input)
      await saveChatMessage(sessionId, "assistant", assistantMessage.content)
    }
  }, [input, character, sessionId, hasSupabaseAuth, messageCount, showNarrativeBlock, isBlocked, canContinue])

  const handlePresetPhraseClick = (phrase: string) => {
    setInput(phrase)
  }

  const handleContinueConversation = async () => {
    console.log("[PAYWALL] Continue conversation clicked:", { characterId: id, situation, isLoggedIn })

    // If not logged in, open auth modal with checkout intent
    if (!isLoggedIn) {
      console.log("[PAYWALL] User not logged in, opening auth modal with checkout intent")
      openModal({
        type: "checkout",
        purchaseType: "moment",
        characterId: id,
        situationId: situation || "chat",
        momentLevel: "private",
      })
      return
    }

    // User is logged in - proceed directly to checkout
    setCheckingOut(true)
    setCheckoutError(null)

    try {
      await openStripeCheckoutWithPurchaseType({
        purchaseType: "moment",
        characterId: id,
        situationId: situation || "chat",
        momentLevel: "private",
      })
    } catch (error: any) {
      console.error("[v0] Checkout error:", error)
      setCheckoutError(error?.message || "Payment failed. Please try again.")
      setCheckingOut(false)
    }
  }

  if (!character) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const isFavorite = userStore.isFavorite(character.id)

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/5 px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href={`/s/${character.id}`}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {entitlements?.hasPlus && (
              <span className="flex items-center gap-1 text-xs text-violet-400 bg-violet-500/10 px-2 py-1 rounded-full">
                <Sparkles className="h-3 w-3" />
                Plus
              </span>
            )}
            {isLoggedIn ? (
              <span className="text-xs text-gray-500">{user.email}</span>
            ) : (
              <button
                onClick={() => openModal()}
                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </header>

        {/* Chat content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-6">
            {/* Character avatar and name */}
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

            {/* Loading indicator */}
            {isLoadingMessages && (
              <div className="flex justify-center mb-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            )}

            {/* Initial message from character */}
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
                        onClick={() => handlePresetPhraseClick(phrase)}
                        className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
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
                      <div
                        className={cn(
                          "w-full h-full bg-gradient-to-br flex items-center justify-center",
                          getCharacterGradient(character.name),
                        )}
                      >
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
                    onClick={handleContinueConversation}
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

        {/* Input bar */}
        {!isBlocked && (
          <div className="border-t border-white/5 px-4 py-3 shrink-0">
            <div className="mx-auto max-w-2xl">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl bg-[#151515] border border-white/10 py-3 pl-4 pr-12 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
                <button
                  onClick={handleSend}
                  className="absolute right-2 rounded-lg bg-transparent p-2 text-gray-500 hover:text-violet-400 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right panel */}
      {showPanel && (
        <div className="hidden xl:flex w-72 border-l border-white/5 bg-[#080808] flex-col shrink-0">
          <div className="relative h-[50%] min-h-[280px]">
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
                <span className="text-4xl font-semibold text-white">{character.name[0]}</span>
              </div>
            )}
            <button
              onClick={() => setShowPanel(false)}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white/70 hover:bg-black/70 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-white">{character.name}</h3>
              <Link href={`/s/${character.id}`} className="text-xs text-gray-500 hover:text-white transition-colors">
                Profile ›
              </Link>
            </div>

            <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
              <span>{formatNumber(character.stats.chats)} chats</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {character.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-gray-500">
                  {tag}
                </span>
              ))}
            </div>

            <button
              onClick={() => userStore.toggleFavorite(character.id)}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs transition-colors",
                isFavorite
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10",
              )}
            >
              <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-yellow-400")} />
              {isFavorite ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* History panel */}
      {showHistory && (
        <HistoryPanel
          characterId={character.id}
          onClose={() => setShowHistory(false)}
          onSelectSession={(sid) => {
            setShowHistory(false)
          }}
        />
      )}
    </div>
  )
}
