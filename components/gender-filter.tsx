"use client"

import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n-provider"

interface GenderFilterProps {
  selected: string
  onSelect: (gender: string) => void
}

export function GenderFilter({ selected, onSelect }: GenderFilterProps) {
  const { t } = useI18n()

  const genders = [
    { id: "All", labelKey: "all", symbol: "★" },
    { id: "Male", labelKey: "male", symbol: "♂" },
    { id: "Female", labelKey: "female", symbol: "♀" },
    { id: "Non-binary", labelKey: "nonBinary", symbol: "∿" },
  ]

  return (
    <div className="flex items-center gap-2">
      {genders.map((gender) => (
        <button
          key={gender.id}
          onClick={() => onSelect(gender.id)}
          className={cn(
            "flex items-center gap-0.5 text-xs font-medium transition-all duration-150",
            selected === gender.id ? "text-blue-400" : "text-gray-500 hover:text-gray-300",
          )}
        >
          <span className={cn("text-sm", selected === gender.id ? "text-blue-400" : "text-gray-600")}>
            {gender.symbol}
          </span>
          {t(gender.labelKey)}
        </button>
      ))}
    </div>
  )
}
