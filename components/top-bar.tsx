"use client"

import { Search } from "lucide-react"
import { useAuthModal } from "@/components/auth-modal-provider"
import { useI18n } from "@/components/i18n-provider"
import { LanguageSelector } from "@/components/language-selector"
import { useAuth } from "@/hooks/use-auth"
import { userStore } from "@/lib/user-store"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function TopBar() {
  const { openModal } = useAuthModal()
  const { t } = useI18n()
  const { isLoggedIn, isLoading, username } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await userStore.logout()
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 flex h-11 items-center justify-between bg-[#0d0d0d]/95 backdrop-blur-md px-3 mx-0">
      {/* Search - centered with max width */}
      <div className="flex-1 max-w-sm mx-auto">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={t("searchCharacters")}
            className="rounded-full bg-[#1a1a1a] border border-white/10 py-1.5 pr-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all mx-0 pl-8 w-10/12"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-48">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-md shadow-orange-500/20 opacity-90">
          <span className="text-[8px] font-bold text-black">--</span>
        </div>
        <LanguageSelector />
        {isLoading ? (
          <div className="h-4 w-16 rounded bg-white/5 animate-pulse" />
        ) : isLoggedIn ? (
          <div className="flex items-center gap-2">
            <Link href="/profile" className="text-xs text-gray-300 hover:text-white transition-colors">
              {username}
            </Link>
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-white transition-colors">
              {t("logOut")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => openModal()}
            className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20 transition-colors"
          >
            {t("logIn")}
          </button>
        )}
      </div>
    </header>
  )
}
