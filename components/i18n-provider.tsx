"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type Locale, getTranslation } from "@/lib/i18n"

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem("whispr-locale") as Locale
      if (stored && (stored === "en" || stored === "fr" || stored === "es")) {
        setLocaleState(stored)
      }
    } catch (error) {
      // Silently fail - localStorage might be disabled
      if (process.env.NODE_ENV === "development") {
        console.warn("[I18N] Failed to load locale from localStorage:", error)
      }
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("whispr-locale", newLocale)
      } catch (error) {
        // Silently fail - localStorage might be disabled or full
        if (process.env.NODE_ENV === "development") {
          console.warn("[I18N] Failed to save locale to localStorage:", error)
        }
      }
    }
  }

  const t = (key: string) => getTranslation(locale, key)

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return context
}
