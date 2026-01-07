"use client"

import { useSyncExternalStore } from "react"
import { getBrowserSupabase } from "@/lib/supabase/browser"
import type { User } from "@supabase/supabase-js"

export interface UserState {
  isLoggedIn: boolean
  username: string
  email: string | null
  userId: string | null
  favorites: string[] // Character IDs stored in Supabase collections table
  recentChats: string[] // Character IDs from chat_sessions
  supabaseUser: User | null
  isLoading: boolean
}

let state: UserState = {
  isLoggedIn: false,
  username: `guest_${Math.random().toString(36).substring(2, 8)}`,
  email: null,
  userId: null,
  favorites: [],
  recentChats: [],
  supabaseUser: null,
  isLoading: true,
}

const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

async function loadUserDataFromSupabase(userId: string) {
  const supabase = getBrowserSupabase()

  // Load favorites from collections table
  const { data: collections } = await supabase.from("collections").select("character_id").eq("user_id", userId)

  // Load recent chat sessions
  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("character_id")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false })
    .limit(20)

  state = {
    ...state,
    favorites: collections?.map((c) => c.character_id) || [],
    recentChats: sessions?.map((s) => s.character_id) || [],
  }
  notifyListeners()
}

// Initialize Supabase auth listener - runs exactly once
let sessionCheckStarted = false

if (typeof window !== "undefined" && !sessionCheckStarted) {
  sessionCheckStarted = true
  const supabase = getBrowserSupabase()

  // Check initial session immediately and set loading to false
  // This prevents race conditions where components render before session is checked
  // CRITICAL: isLoading must remain true until we have a definitive answer about auth state
  supabase.auth
    .getSession()
    .then(({ data: { session }, error }) => {
      if (error) {
        console.error("[USER_STORE] Error getting session:", error)
        // On error, we're definitely not logged in
        state = {
          ...state,
          isLoading: false,
          isLoggedIn: false,
          userId: null,
          supabaseUser: null,
        }
        notifyListeners()
        return
      }

      if (session?.user) {
        // User is logged in - set all auth fields atomically
        state = {
          ...state,
          isLoggedIn: true,
          username: session.user.user_metadata?.username || session.user.email?.split("@")[0] || "User",
          email: session.user.email || null,
          userId: session.user.id,
          supabaseUser: session.user,
          isLoading: false, // Set loading to false AFTER all fields are set
        }
        notifyListeners()
        // Load additional user data asynchronously (favorites, recent chats)
        loadUserDataFromSupabase(session.user.id).catch((err) => {
          console.error("[USER_STORE] Error loading user data:", err)
          // Don't crash - user data loading failure shouldn't break auth
        })
      } else {
        // No session - user is definitely not logged in
        state = {
          ...state,
          isLoading: false,
          isLoggedIn: false,
          userId: null,
          supabaseUser: null,
        }
        notifyListeners()
      }
    })
    .catch((error) => {
      console.error("[USER_STORE] Failed to get session:", error)
      // Always set loading to false even on error, and ensure all fields are cleared
      state = {
        ...state,
        isLoading: false,
        isLoggedIn: false,
        userId: null,
        supabaseUser: null,
      }
      notifyListeners()
    })
    .finally(() => {
      // Safety net: ensure isLoading is always false after session check completes
      // This prevents infinite loading states
      if (state.isLoading) {
        state = {
          ...state,
          isLoading: false,
          // If we're still loading and have no userId, we're not logged in
          isLoggedIn: false,
          userId: state.userId || null,
          supabaseUser: state.supabaseUser || null,
        }
        notifyListeners()
      }
    })

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      // Set all auth fields atomically to prevent race conditions
      state = {
        ...state,
        isLoggedIn: true,
        username: session.user.user_metadata?.username || session.user.email?.split("@")[0] || "User",
        email: session.user.email || null,
        userId: session.user.id,
        supabaseUser: session.user,
        isLoading: false, // Set loading to false AFTER all fields are set
      }
      notifyListeners()
      // Load additional user data asynchronously (doesn't affect auth state)
      loadUserDataFromSupabase(session.user.id).catch((err) => {
        console.error("[USER_STORE] Error loading user data:", err)
        // Don't crash - user data loading failure shouldn't break auth
      })
    } else if (event === "SIGNED_OUT") {
      // Clear all auth fields atomically
      state = {
        ...state,
        isLoggedIn: false,
        username: `guest_${Math.random().toString(36).substring(2, 8)}`,
        email: null,
        userId: null,
        supabaseUser: null,
        favorites: [],
        recentChats: [],
        isLoading: false,
      }
      notifyListeners()
    }
  })
}

export const userStore = {
  getState: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  logout: async () => {
    const supabase = getBrowserSupabase()
    await supabase.auth.signOut()
    state = {
      ...state,
      isLoggedIn: false,
      username: `guest_${Math.random().toString(36).substring(2, 8)}`,
      email: null,
      userId: null,
      supabaseUser: null,
      favorites: [],
      recentChats: [],
    }
    notifyListeners()
  },

  toggleFavorite: async (characterId: string) => {
    if (!state.userId) {
      // Not logged in - just update local state temporarily
      const favorites = state.favorites.includes(characterId)
        ? state.favorites.filter((id) => id !== characterId)
        : [...state.favorites, characterId]
      state = { ...state, favorites }
      notifyListeners()
      return
    }

    const supabase = getBrowserSupabase()
    const isFavorite = state.favorites.includes(characterId)

    if (isFavorite) {
      // Remove from favorites
      await supabase.from("collections").delete().eq("user_id", state.userId).eq("character_id", characterId)

      state = {
        ...state,
        favorites: state.favorites.filter((id) => id !== characterId),
      }
    } else {
      // Add to favorites
      await supabase.from("collections").insert({ user_id: state.userId, character_id: characterId })

      state = {
        ...state,
        favorites: [...state.favorites, characterId],
      }
    }
    notifyListeners()
  },

  isFavorite: (characterId: string) => {
    return state.favorites.includes(characterId)
  },

  addRecentChat: async (characterId: string) => {
    const recentChats = [characterId, ...state.recentChats.filter((id) => id !== characterId)].slice(0, 20)
    state = { ...state, recentChats }
    notifyListeners()
  },

  refreshUserData: async () => {
    if (state.userId) {
      await loadUserDataFromSupabase(state.userId)
    }
  },
}

export function useUserStore() {
  return useSyncExternalStore(userStore.subscribe, userStore.getState, userStore.getState)
}
