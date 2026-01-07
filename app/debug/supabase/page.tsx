"use client"

import { useEffect, useState } from "react"
import { getBrowserSupabase } from "@/lib/supabase/browser"
import { useUserStore } from "@/lib/user-store"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface DebugData {
  sessionsCount: number
  favoritesCount: number
  messagesCount: number
}

export default function DebugSupabasePage() {
  const user = useUserStore()
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDebugData() {
      if (!user.isLoggedIn) {
        setLoading(false)
        return
      }

      const supabase = getBrowserSupabase()

      try {
        // Count chat sessions
        const { count: sessionsCount } = await supabase
          .from("chat_sessions")
          .select("*", { count: "exact", head: true })

        // Count favorites (collections)
        const { count: favoritesCount } = await supabase.from("collections").select("*", { count: "exact", head: true })

        // Count messages
        const { count: messagesCount } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })

        setDebugData({
          sessionsCount: sessionsCount || 0,
          favoritesCount: favoritesCount || 0,
          messagesCount: messagesCount || 0,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load debug data")
      }

      setLoading(false)
    }

    loadDebugData()
  }, [user.isLoggedIn])

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-8">
      <Link href="/discover" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8">
        <ArrowLeft className="h-4 w-4" />
        Back to Discover
      </Link>

      <h1 className="text-2xl font-bold mb-8">Supabase Debug Info</h1>

      {/* Environment Variables */}
      <section className="mb-8 p-4 rounded-lg bg-white/5 border border-white/10">
        <h2 className="text-lg font-semibold mb-4">Environment Variables</h2>
        <div className="space-y-2 font-mono text-sm">
          <p>
            <span className="text-gray-500">NEXT_PUBLIC_SUPABASE_URL:</span>{" "}
            <span className="text-green-400">{process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set ✓" : "Not set ✗"}</span>
          </p>
          <p>
            <span className="text-gray-500">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>{" "}
            <span className="text-green-400">{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set ✓" : "Not set ✗"}</span>
          </p>
        </div>
      </section>

      {/* User Info */}
      <section className="mb-8 p-4 rounded-lg bg-white/5 border border-white/10">
        <h2 className="text-lg font-semibold mb-4">Current User</h2>
        {user.isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : user.isLoggedIn ? (
          <div className="space-y-2 font-mono text-sm">
            <p>
              <span className="text-gray-500">Email:</span> <span className="text-cyan-400">{user.email}</span>
            </p>
            <p>
              <span className="text-gray-500">User ID:</span> <span className="text-cyan-400">{user.userId}</span>
            </p>
            <p>
              <span className="text-gray-500">Username:</span> <span className="text-cyan-400">{user.username}</span>
            </p>
            <p>
              <span className="text-gray-500">Auth Provider:</span>{" "}
              <span className="text-cyan-400">{user.supabaseUser?.app_metadata?.provider || "email"}</span>
            </p>
          </div>
        ) : (
          <p className="text-gray-500">Not logged in</p>
        )}
      </section>

      {/* Database Stats */}
      <section className="mb-8 p-4 rounded-lg bg-white/5 border border-white/10">
        <h2 className="text-lg font-semibold mb-4">Database Stats (Your Data)</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : !user.isLoggedIn ? (
          <p className="text-gray-500">Log in to see your database stats</p>
        ) : debugData ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <p className="text-2xl font-bold text-violet-400">{debugData.sessionsCount}</p>
              <p className="text-sm text-gray-400">Chat Sessions</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-2xl font-bold text-yellow-400">{debugData.favoritesCount}</p>
              <p className="text-sm text-gray-400">Favorites</p>
            </div>
            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-2xl font-bold text-cyan-400">{debugData.messagesCount}</p>
              <p className="text-sm text-gray-400">Messages</p>
            </div>
          </div>
        ) : null}
      </section>

      {/* Local State */}
      <section className="p-4 rounded-lg bg-white/5 border border-white/10">
        <h2 className="text-lg font-semibold mb-4">Local State</h2>
        <div className="space-y-2 font-mono text-sm">
          <p>
            <span className="text-gray-500">Favorites (local):</span>{" "}
            <span className="text-cyan-400">{user.favorites.length} items</span>
          </p>
          <p>
            <span className="text-gray-500">Recent Chats (local):</span>{" "}
            <span className="text-cyan-400">{user.recentChats.length} items</span>
          </p>
        </div>
      </section>
    </div>
  )
}
