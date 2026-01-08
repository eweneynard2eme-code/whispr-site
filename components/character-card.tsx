"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { MessageCircle } from "lucide-react"
import { type Character, formatNumber } from "@/lib/data"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useAuthModal } from "@/components/auth-modal-provider"

interface CharacterCardProps {
  character: Character
}

function getCharacterGradient(name: string): string {
  const gradients = [
    "from-violet-600/80 to-purple-900/80",
    "from-pink-600/80 to-rose-900/80",
    "from-blue-600/80 to-indigo-900/80",
    "from-cyan-600/80 to-teal-900/80",
    "from-amber-600/80 to-orange-900/80",
    "from-fuchsia-600/80 to-pink-900/80",
  ]
  const index = name.charCodeAt(0) % gradients.length
  return gradients[index]
}

export function CharacterCard({ character }: CharacterCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [clicked, setClicked] = useState(false) // Temporary visual feedback
  const { isLoggedIn, isLoading } = useAuth()
  const { openModal } = useAuthModal()
  const router = useRouter()

  const handleClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // STEP 1: Immediate visual feedback to confirm click fires
    setClicked(true)
    setTimeout(() => setClicked(false), 200)

    // Validate character ID
    if (!character?.id || typeof character.id !== "string" || character.id.trim().length === 0) {
      console.error("[MODEL_CLICK] Invalid character ID:", character?.id)
      return
    }

    const characterId = character.id.trim()
    console.log("MODEL_CLICK", { characterId, isLoggedIn, isLoading })

    // If loading, wait briefly then proceed (prevents permanent blocking)
    // We still want to proceed even if loading, to avoid dead clicks
    if (isLoading) {
      console.log("[MODEL_CLICK] Auth state loading, waiting briefly...")
      await new Promise(resolve => setTimeout(resolve, 100))
      // After wait, proceed anyway - openModal will handle storing intent if still loading
    }

    const targetUrl = `/s/${encodeURIComponent(characterId)}?scrollTo=moments`

    // If logged in, navigate directly
    if (isLoggedIn) {
      console.log("[MODEL_CLICK] User logged in, navigating to character:", characterId)
      
      try {
        const currentPath = typeof window !== "undefined" ? window.location.pathname : ""
        router.push(targetUrl)
        
        // Fallback: if navigation doesn't happen within 300ms, use window.location
        const timeoutId = setTimeout(() => {
          const newPath = typeof window !== "undefined" ? window.location.pathname : ""
          if (newPath === currentPath) {
            // Navigation didn't happen, use fallback
            console.warn("[MODEL_CLICK] Router push timeout, using window.location fallback")
            if (typeof window !== "undefined") {
              window.location.href = targetUrl
            }
          }
        }, 300)
        
        // Store timeout ID to clear if navigation succeeds
        // Check after a short delay if navigation happened
        setTimeout(() => {
          const newPath = typeof window !== "undefined" ? window.location.pathname : ""
          if (newPath !== currentPath && newPath.includes(`/s/${encodeURIComponent(characterId)}`)) {
            clearTimeout(timeoutId)
          }
        }, 100)
      } catch (error) {
        console.error("[MODEL_CLICK] Router push failed, using fallback:", error)
        // Fallback to window.location if router fails
        if (typeof window !== "undefined") {
          window.location.href = targetUrl
        }
      }
      return
    }

    // If logged out OR still loading, open auth modal with intent
    // openModal will handle storing intent even if isLoading is true
    console.log("[MODEL_CLICK] User logged out or loading, opening auth modal with character intent:", characterId)
    
    try {
      openModal({
        type: "open_character",
        characterId: characterId,
        scrollTo: "moments",
      })
    } catch (error) {
      console.error("[MODEL_CLICK] Failed to open auth modal:", error)
      // Fallback: try direct navigation as last resort
      if (typeof window !== "undefined") {
        window.location.href = targetUrl
      }
    }
  }

  return (
    <div
      onClick={handleClick}
      onTouchEnd={handleClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg bg-[#151515]",
        "transition-all duration-200 ease-out",
        "hover:scale-[1.02] hover:z-10",
        "hover:shadow-xl hover:shadow-violet-500/10",
        "cursor-pointer border border-white/5 hover:border-white/10",
        "touch-manipulation", // Mobile optimization
        "pointer-events-auto", // Ensure clicks work
        // Temporary visual feedback
        clicked && "ring-4 ring-green-500/60 scale-[1.01]",
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {/* Gradient overlay - must not block clicks */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {!imageError ? (
          <Image
            src={
              character.image ||
              `/placeholder.svg?height=320&width=240&query=${encodeURIComponent(character.name + " portrait")}`
            }
            alt={character.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className={cn(
              "object-cover transition-all duration-300 pointer-events-none",
              "group-hover:scale-105",
              isLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setIsLoaded(true)}
            onError={() => setImageError(true)}
            draggable={false}
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br flex items-center justify-center pointer-events-none",
              getCharacterGradient(character.name),
            )}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 pointer-events-none">
              <span className="text-xl font-semibold text-white">{character.name[0]}</span>
            </div>
          </div>
        )}

        {!isLoaded && !imageError && (
          <div
            className={cn("absolute inset-0 bg-gradient-to-br animate-pulse pointer-events-none", getCharacterGradient(character.name))}
          />
        )}

        {/* Message count badge - decorative only, must not block clicks */}
        <div className="absolute bottom-1.5 left-1.5 z-20 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-1.5 py-0.5 pointer-events-none">
          <MessageCircle className="h-2.5 w-2.5 text-green-400 fill-green-400" />
          <span className="text-[10px] font-medium text-white">{formatNumber(character.stats.chats)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 p-2.5 md:p-2">
        <h3 className="font-semibold text-white text-base md:text-xs leading-tight truncate group-hover:text-violet-300 transition-colors">
          {character.name}
        </h3>
        <p className="text-base md:text-[10px] text-gray-500 line-clamp-2 leading-snug min-h-[1.75rem]">{character.description}</p>

        <div className="flex flex-wrap gap-1 mt-0.5">
          {character.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded bg-white/5 px-1.5 py-0.5 text-xs md:text-[9px] text-gray-600">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
