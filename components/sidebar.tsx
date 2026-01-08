"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Compass, ImageIcon, UserPlus, Bell, Heart, Coins, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { useUserStore } from "@/lib/user-store"

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useI18n()
  const user = useUserStore()

  const navItems = [
    { href: "/discover", labelKey: "discover", icon: Compass },
    { href: "/generate", labelKey: "generateImage", icon: ImageIcon },
    { href: "/create", labelKey: "createCharacter", icon: UserPlus },
    { href: "/notifications", labelKey: "notification", icon: Bell },
    { href: "/subscribe", labelKey: "subscribe", icon: Heart, badge: "82% off" },
    { href: "/coins", labelKey: "coins", icon: Coins },
  ]

  // Add chat link if user has recent chats
  const bottomItems = user.isLoggedIn ? [{ href: "/profile", labelKey: "chat", icon: MessageCircle }] : []

  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-56 flex-col bg-[#0d0d0d] border-r border-white/5">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4">
        <img src="/logo-cat.png" alt="WHISPR Logo" className="object-contain my-0 px-0 w-12 h-12 mx-0" />
        <span className="text-base font-semibold text-white my-0 mx-0">WHISPR</span>
        <button className="ml-auto text-gray-400 hover:text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{t(item.labelKey)}</span>
                  {item.badge && (
                    <span className="ml-auto rounded bg-green-500/20 border border-green-500/30 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Chat link for logged in users */}
        {bottomItems.length > 0 && (
          <ul className="mt-4 pt-4 border-t border-white/5 space-y-0.5">
            {bottomItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </nav>
    </aside>
  )
}
