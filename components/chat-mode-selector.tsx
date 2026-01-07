"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, ChevronDown, Check, Brain, Clock } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"
import { cn } from "@/lib/utils"

export type ChatMode = "standard" | "permanentMemory" | "longMemory"

interface ChatModeSelectorProps {
  mode: ChatMode
  onModeChange: (mode: ChatMode) => void
}

export function ChatModeSelector({ mode, onModeChange }: ChatModeSelectorProps) {
  const { t } = useI18n()
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

  const modes = [
    { id: "standard" as const, label: t("standard"), desc: t("standardDesc"), icon: Sparkles },
    { id: "permanentMemory" as const, label: t("permanentMemory"), desc: t("permanentMemoryDesc"), icon: Brain },
    { id: "longMemory" as const, label: t("longMemory"), desc: t("longMemoryDesc"), icon: Clock },
  ]

  const currentMode = modes.find((m) => m.id === mode)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 px-3 py-1.5 text-xs text-violet-400 hover:bg-violet-500/30 transition-colors"
      >
        <Sparkles className="h-3 w-3" />
        {currentMode?.label}
        <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-64 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-xl z-50 py-1 overflow-hidden">
          {modes.map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.id}
                onClick={() => {
                  onModeChange(m.id)
                  setIsOpen(false)
                }}
                className={cn(
                  "flex w-full items-start gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left",
                  mode === m.id && "bg-violet-500/10",
                )}
              >
                <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", mode === m.id ? "text-violet-400" : "text-gray-500")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs font-medium", mode === m.id ? "text-violet-400" : "text-gray-300")}>
                      {m.label}
                    </span>
                    {mode === m.id && <Check className="h-3 w-3 text-violet-400" />}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{m.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
