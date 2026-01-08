/**
 * Nuclear reset - clears all client-side state
 * Used for recovery when user is stuck in bad state
 */

export function resetClientState(): void {
  if (typeof window === "undefined") return

  try {
    // Clear auth intent
    localStorage.removeItem("whispr_auth_intent")
    
    // Clear i18n locale (optional - might want to keep)
    // localStorage.removeItem("whispr-locale")
    
    // Clear any other app-specific keys
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("whispr_")) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key)
      } catch {
        // Ignore errors
      }
    })
    
    console.log("[RESET] Client state cleared")
  } catch (error) {
    console.error("[RESET] Failed to clear client state:", error)
  }
}



