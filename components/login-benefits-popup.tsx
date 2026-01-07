"use client"

import { X, Check } from "lucide-react"
import Image from "next/image"
import { useAuthModal } from "@/components/auth-modal-provider"
import { useI18n } from "@/components/i18n-provider"

interface LoginBenefitsPopupProps {
  onClose: () => void
}

export function LoginBenefitsPopup({ onClose }: LoginBenefitsPopupProps) {
  const { openModal } = useAuthModal()
  const { t } = useI18n()

  const benefits = [
    t("multipleChatRounds"),
    t("advancedChatModel"),
    t("unlimitedSearches"),
    t("generateImagesFree"),
    t("createCharactersYourself"),
  ]

  const handleLogin = () => {
    onClose()
    openModal()
  }

  return (
    <div className="fixed top-24 right-3 z-30 animate-in slide-in-from-right duration-500">
      <div className="relative w-64 bg-gradient-to-br from-[#2a1f3d] to-[#1a1525] rounded-xl overflow-hidden shadow-xl shadow-purple-900/20 border border-purple-500/20">
        {/* Character image accent */}
        <div className="absolute top-0 right-0 w-20 h-28 opacity-70">
          <Image src="/anime-girl-side-profile-mysterious-purple-glow.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#2a1f3d]/50 to-[#2a1f3d]" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-1.5 right-1.5 z-10 w-5 h-5 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
        >
          <X className="w-3 h-3 text-white/70" />
        </button>

        <div className="relative p-3">
          <h3 className="text-orange-400 font-semibold text-sm mb-2">{t("logInToEnjoy")}</h3>

          <ul className="space-y-1.5">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-1.5 text-xs text-white/90">
                <Check className="w-3 h-3 text-orange-400 shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleLogin}
            className="mt-3 w-full py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg text-white font-medium text-xs hover:opacity-90 transition-opacity"
          >
            {t("logIn")}
          </button>
        </div>
      </div>
    </div>
  )
}
