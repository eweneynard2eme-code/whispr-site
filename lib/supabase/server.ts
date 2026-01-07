import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { ENV_SUPABASE } from "@/lib/env"

export async function createClient() {
  const cookieStore = await cookies()
  
  const url = ENV_SUPABASE.URL
  const key = ENV_SUPABASE.ANON_KEY

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. " +
      "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings."
    )
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from Server Component - can be ignored with proxy refresh
        }
      },
    },
  })
}
