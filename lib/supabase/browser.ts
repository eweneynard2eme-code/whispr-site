// Singleton to avoid Multiple GoTrueClient instances warning
import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

let browserClient: SupabaseClient | null = null

/**
 * Returns a singleton Supabase browser client.
 * This ensures only ONE GoTrueClient exists in the browser,
 * avoiding the "Multiple GoTrueClient instances detected" warning.
 */
export function getBrowserSupabase(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return browserClient
}
