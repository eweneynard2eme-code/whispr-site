"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { locales } from "@/lib/i18n"
import { useI18n } from "@/components/i18n-provider"
import { cn } from "@/lib/utils"

export function LanguageSelector() {
  const { locale, setLocale } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const currentLocale = locales.find((l) => l.code === locale)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition-colors"
      >
        {locale.toUpperCase()}
        <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => {
                setLocale(loc.code)
                setIsOpen(false)
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-white/5 transition-colors",
                locale === loc.code ? "text-violet-400" : "text-gray-300",
              )}
            >
              <span>{loc.name}</span>
              {locale === loc.code && <Check className="h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
