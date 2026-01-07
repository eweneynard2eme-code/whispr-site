"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Copy, MoreHorizontal, Package, LogOut } from "lucide-react"
import { TopBar } from "@/components/top-bar"
import { CharacterCard } from "@/components/character-card"
import { useUserStore, userStore } from "@/lib/user-store"
import { useI18n } from "@/components/i18n-provider"
import { getCharacterById, type Character } from "@/lib/data"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { t } = useI18n()
  const user = useUserStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"characters" | "collection">("characters")

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user.isLoggedIn) {
      router.push("/auth/login")
    }
  }, [user.isLoggedIn, router])

  // Get favorite characters
  const favoriteCharacters: Character[] = user.favorites
    .map((id) => getCharacterById(id))
    .filter((c): c is Character => c !== null)

  // Get recent chat characters
  const recentCharacters: Character[] = user.recentChats
    .map((id) => getCharacterById(id))
    .filter((c): c is Character => c !== null)

  const tabs = [
    { id: "characters" as const, label: t("characters") },
    { id: "collection" as const, label: t("collection") },
  ]

  const handleLogout = async () => {
    await userStore.logout()
    router.push("/discover")
  }

  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <p className="text-gray-400">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <TopBar />

      <div className="px-6 py-4">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Link>

        {/* Profile header */}
        <div className="flex items-start gap-5 mb-8">
          {/* Avatar */}
          <div className="relative h-20 w-20 shrink-0">
            <Image
              src="/anime-avatar-default-user-profile.jpg"
              alt="Avatar"
              fill
              className="rounded-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white mb-1">{user.username}</h1>
            {user.email && <p className="text-xs text-gray-500">{user.email}</p>}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button className="rounded-full bg-white/10 p-2 text-gray-400 hover:text-white hover:bg-white/20 transition-colors">
              <ExternalLink className="h-4 w-4" />
            </button>
            <button className="rounded-full bg-white/10 p-2 text-gray-400 hover:text-white hover:bg-white/20 transition-colors">
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full bg-red-500/20 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/30 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <button className="rounded-full bg-white/10 p-2 text-gray-400 hover:text-white hover:bg-white/20 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
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

        {/* Tab content */}
        {activeTab === "characters" && (
          <div>
            {recentCharacters.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {recentCharacters.map((char) => (
                  <CharacterCard key={char.id} character={char} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/5 mb-4">
                  <Package className="h-10 w-10 text-gray-500" />
                </div>
                <p className="text-gray-500 text-center mb-4">{t("wannaHaveAI")}</p>
                <Link
                  href="/create"
                  className="rounded-lg bg-white/10 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                >
                  {t("toCreate")}
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "collection" && (
          <div>
            {favoriteCharacters.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {favoriteCharacters.map((char) => (
                  <CharacterCard key={char.id} character={char} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/5 mb-4">
                  <Package className="h-10 w-10 text-gray-500" />
                </div>
                <p className="text-gray-500 text-center">
                  No characters collected yet. Browse and collect your favorites!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
