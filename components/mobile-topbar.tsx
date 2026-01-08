"use client"

import { useState } from "react"
import { Search, Menu } from "lucide-react"
import { MobileNavDrawer } from "@/components/mobile-nav-drawer"

export function MobileTopBar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-[55] flex h-12 items-center justify-between bg-[#0d0d0d]/95 backdrop-blur-md px-3 border-b border-white/5 md:hidden">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo-cat.png" alt="WHISPR Logo" className="object-contain w-8 h-8" />
          <span className="text-base font-semibold text-white">WHISPR</span>
        </div>

        {/* Right: Search + Hamburger */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <MobileNavDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  )
}

