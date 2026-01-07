"use client"

import { cn } from "@/lib/utils"
import { categories } from "@/lib/data"
import { ChevronDown } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"

interface CategoryChipsProps {
  selected: string
  onSelect: (category: string) => void
}

// Map category names to translation keys
const categoryKeyMap: Record<string, string> = {
  Recommend: "recommend",
  Anime: "anime",
  Dominant: "dominant",
  OC: "OC",
  Mafia: "mafia",
  Yandere: "yandere",
  Furry: "furry",
  Femboy: "femboy",
  Horror: "horror",
  Celebrity: "celebrity",
  Harem: "harem",
  Fantasy: "fantasy",
  "Secret Crush": "secretCrush",
}

export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  const { t } = useI18n()

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
      {categories.map((category) => {
        const translationKey = categoryKeyMap[category] || category.toLowerCase()
        const label = t(translationKey) !== translationKey ? t(translationKey) : category

        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150",
              selected === category
                ? "bg-white text-black shadow-md"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200",
            )}
          >
            {label}
          </button>
        )
      })}
      <button className="shrink-0 flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-medium bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300">
        {t("game")}
        <ChevronDown className="w-3 h-3" />
      </button>
    </div>
  )
}
