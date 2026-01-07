"use client"

import { useUserStore } from "@/lib/user-store"

/**
 * Unified auth hook - single source of truth for authentication state
 * Wraps useUserStore with a cleaner API
 * 
 * CRITICAL: isLoggedIn must be true ONLY when:
 * - isLoading is false (session check complete)
 * - userId exists (user is authenticated)
 * - supabaseUser exists (session is valid)
 */
export function useAuth() {
  const user = useUserStore()

  // Single source of truth: logged in = has userId AND supabaseUser AND not loading
  // This ensures we never show "logged in" during the loading phase
  const isLoggedIn = !user.isLoading && !!user.userId && !!user.supabaseUser

  return {
    user: user.supabaseUser,
    isLoading: user.isLoading,
    isLoggedIn,
    userId: user.userId,
    email: user.email,
    username: user.username,
  }
}

