"use client"

import { TopBar } from "@/components/top-bar"
import { Plus, Upload, Package } from "lucide-react"
import Image from "next/image"
import { useI18n } from "@/components/i18n-provider"

export default function CreatePage() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <TopBar />

      {/* Discover more chips */}
      

      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold text-white mb-6">{t("createCharacterTitle")}</h1>

        {/* Create / Upload cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-8">
          {/* Create card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600/80 to-violet-500/60 p-6">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2">
                {t("create")}
                <span className="text-white/60">●</span>
              </h2>
              <p className="text-white/80 mb-4 text-left">{t("letsCreate")}</p>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="absolute right-0 top-0 h-full w-1/2">
              <Image src="/anime-characters-group-colorful.jpg" alt="Create" fill className="object-cover object-right" />
            </div>
          </div>

          {/* Upload card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-600/80 to-pink-500/60 p-6">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2">
                {t("upload")}
                <span className="text-white/60">●</span>
              </h2>
              <p className="text-white/80 mb-4">{t("uploadJson")}</p>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
                <Upload className="h-5 w-5" />
              </button>
            </div>
            <div className="absolute right-0 top-0 h-full w-1/2">
              <Image src="/anime-characters-fantasy-style.jpg" alt="Upload" fill className="object-cover object-right py-8 px-0 border-0 leading-7" />
            </div>
          </div>
        </div>

        {/* Character Bank */}
        <h2 className="text-2xl font-bold text-white mb-6">{t("characterBank")}</h2>

        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/5 mb-4">
            <Package className="h-10 w-10 text-gray-500" />
          </div>
          <p className="text-gray-500 text-center">{t("wannaHaveAI")}</p>
        </div>
      </div>
    </div>
  )
}
