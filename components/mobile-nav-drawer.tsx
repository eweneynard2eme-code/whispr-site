"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, Compass, ImageIcon, UserPlus, Bell, Heart, Coins, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"
import { useUserStore } from "@/lib/user-store"

interface MobileNavDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
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

  const bottomItems = user.isLoggedIn ? [{ href: "/profile", labelKey: "chat", icon: MessageCircle }] : []

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Close drawer on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  // Close drawer when route changes
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  const handleLinkClick = () => {
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-[60] flex h-screen w-[min(85vw,360px)] flex-col bg-[#0d0d0d] border-r border-white/5 shadow-2xl md:hidden",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!isOpen}
      >
        {/* Header with logo and close button */}
        <div className="flex h-14 items-center justify-between gap-2 px-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <img src="/logo-cat.png" alt="WHISPR Logo" className="object-contain w-10 h-10" />
            <span className="text-base font-semibold text-white">WHISPR</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors",
                      isActive ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{t(item.labelKey)}</span>
                    {item.badge && (
                      <span className="ml-auto rounded bg-green-500/20 border border-green-500/30 px-2 py-1 text-xs font-medium text-green-400">
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
            <ul className="mt-6 pt-4 border-t border-white/5 space-y-1">
              {bottomItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors",
                        isActive ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{t(item.labelKey)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </nav>
      </aside>
    </>
  )
}

