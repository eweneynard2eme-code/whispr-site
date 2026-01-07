"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Users, MessageCircle, ChevronRight, Sparkles } from "lucide-react"
import { TopBar } from "@/components/top-bar"
import { CharacterCard } from "@/components/character-card"
import { getCharacterById, getSimilarCharacters, formatNumber, type Character } from "@/lib/data"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { userStore, useUserStore } from "@/lib/user-store"

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

export default function CharacterDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const { t } = useI18n()
  const user = useUserStore()

  const [character, setCharacter] = useState<Character | null>(null)
  const [similarCharacters, setSimilarCharacters] = useState<Character[]>([])
  const [activeTab, setActiveTab] = useState("greeting")
  const [imageError, setImageError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      const char = getCharacterById(id)
      if (char) {
        setCharacter(char)
        setSimilarCharacters(getSimilarCharacters(char))
      }
      setLoading(false)
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    )
  }

  if (!character) {
    notFound()
  }

  const isFavorite = userStore.isFavorite(character.id)

  const tabs = [
    { id: "greeting", label: t("greeting") },
    { id: "comments", label: t("comments") },
    { id: "similar", label: t("similarCharacters") },
  ]

  const handleCollect = () => {
    userStore.toggleFavorite(character.id)
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <TopBar />

      <div className="px-6 py-4">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Link>

        <div className="flex gap-5 mb-6">
          <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/30 to-pink-500/30">
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
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <span className="text-2xl font-semibold text-white">{character.name[0]}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white mb-0.5">{character.name}</h1>
                <p className="text-xs text-gray-400 mb-2">By@{character.creatorName} ›</p>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="h-3.5 w-3.5" />
                    {formatNumber(character.stats.followers)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {formatNumber(character.stats.chats)}
                  </div>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed max-w-lg mb-3">{character.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {character.tags.map((tag) => (
                    <span key={tag} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button className="flex items-center gap-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 px-3 py-1.5 text-xs text-violet-400 hover:bg-violet-500/30 transition-colors shrink-0">
                <Sparkles className="h-3.5 w-3.5" />
                {t("memory")}
                <span className="rounded bg-red-500 px-1 py-0.5 text-[8px] font-bold text-white">New</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Link
            href={`/chat/${character.id}`}
            className="flex-1 rounded-lg bg-white py-2.5 text-center text-sm font-medium text-black hover:bg-gray-100 transition-colors"
          >
            {t("chat")}
          </Link>
          <button className="flex-1 rounded-lg bg-white/10 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors">
            {t("share")}
          </button>
          <button
            onClick={handleCollect}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors",
              isFavorite
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                : "bg-white/10 text-white hover:bg-white/20",
            )}
          >
            {isFavorite ? "Collected ★" : t("collect")}
          </button>
        </div>

        <div className="border-b border-white/10 mb-5">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-2.5 text-sm font-medium transition-colors relative",
                  activeTab === tab.id ? "text-white" : "text-gray-500 hover:text-gray-300",
                )}
              >
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "greeting" && (
          <div className="space-y-2">
            {character.greetingOptions.map((greeting, index) => (
              <Link
                key={index}
                href={`/chat/${character.id}?greeting=${index}`}
                className="flex items-center justify-between rounded-lg bg-[#1a1a1a] border border-white/5 p-3.5 hover:bg-[#222] transition-colors group"
              >
                <p className="text-gray-300 text-sm italic leading-relaxed pr-4">{greeting}</p>
                <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-white transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {activeTab === "comments" && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-gray-500">No comments yet. Start a conversation!</p>
          </div>
        )}

        {activeTab === "similar" && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {similarCharacters.map((char) => (
              <CharacterCard key={char.id} character={char} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
