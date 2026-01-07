"use client"

import { useState } from "react"
import { TopBar } from "@/components/top-bar"
import { CharacterCard } from "@/components/character-card"
import { CategoryChips } from "@/components/category-chips"
import { GenderFilter } from "@/components/gender-filter"
import { PromoBanner } from "@/components/promo-banner"
import { LoginBenefitsPopup } from "@/components/login-benefits-popup"
import { characters, getCharactersByCategory } from "@/lib/data"
import { useI18n } from "@/components/i18n-provider"

export default function DiscoverPage() {
  const { t } = useI18n()
  const [selectedCategory, setSelectedCategory] = useState("Recommend")
  const [selectedGender, setSelectedGender] = useState("All")
  const [showLoginPopup, setShowLoginPopup] = useState(true)

  let filteredCharacters = selectedCategory === "Recommend" ? characters : getCharactersByCategory(selectedCategory)

  if (selectedGender !== "All") {
    filteredCharacters = filteredCharacters.filter((c) => c.gender === selectedGender.toLowerCase())
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] overflow-x-hidden">
      <TopBar />

      <div className="px-3 py-3">
        {/* Title and filters */}
        <div className="mb-2 flex items-center gap-4">
          <h1 className="text-lg font-bold text-white">{t("forYou")}</h1>
          <GenderFilter selected={selectedGender} onSelect={setSelectedGender} />
        </div>

        {/* Category chips */}
        <div className="mb-3">
          <CategoryChips selected={selectedCategory} onSelect={setSelectedCategory} />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {filteredCharacters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>

        {/* Load more indicator */}
        <div className="mt-6 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      </div>

      {showLoginPopup && <LoginBenefitsPopup onClose={() => setShowLoginPopup(false)} />}

      <PromoBanner />
    </div>
  )
}
