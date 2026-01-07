// Singleton to avoid Multiple GoTrueClient instances warning
import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ENV_SUPABASE } from "@/lib/env"

let browserClient: SupabaseClient | null = null

/**
 * Returns a singleton Supabase browser client.
 * This ensures only ONE GoTrueClient exists in the browser,
 * avoiding the "Multiple GoTrueClient instances detected" warning.
 */
export function getBrowserSupabase(): SupabaseClient {
  if (!browserClient) {
    const url = ENV_SUPABASE.URL
    const key = ENV_SUPABASE.ANON_KEY
    
    if (!url || !key) {
      // Return a mock client in development to prevent crashes
      // In production, these should always be set
      console.warn("[SUPABASE] Missing env vars, using fallback client")
      browserClient = createBrowserClient(
        url || "https://placeholder.supabase.co",
        key || "placeholder-key"
      )
    } else {
      browserClient = createBrowserClient(url, key)
    }
  }
  return browserClient
}
