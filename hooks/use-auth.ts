"use client"

import { useUserStore } from "@/lib/user-store"

/**
 * Unified auth hook - single source of truth for authentication state
 * Wraps useUserStore with a cleaner API
 */
export function useAuth() {
  const user = useUserStore()

  return {
    user: user.supabaseUser,
    isLoading: user.isLoading,
    isLoggedIn: user.isLoggedIn,
    userId: user.userId,
    email: user.email,
    username: user.username,
  }
}

