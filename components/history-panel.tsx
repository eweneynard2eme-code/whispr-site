"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/components/i18n-provider"
import { getBrowserSupabase } from "@/lib/supabase/browser"
import { useUserStore } from "@/lib/user-store"

interface ChatSession {
  id: string
  character_id: string
  title: string | null
  message_count: number
  last_message_at: string
  created_at: string
}

interface HistoryPanelProps {
  isOpen: boolean
  onClose: () => void
  characterId?: string
  characterName?: string
}

export function HistoryPanel({ isOpen, onClose, characterId, characterName }: HistoryPanelProps) {
  const { t } = useI18n()
  const user = useUserStore()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSessions() {
      if (!isOpen || !user.isLoggedIn) {
        setLoading(false)
        return
      }

      const supabase = getBrowserSupabase()
      let query = supabase.from("chat_sessions").select("*").order("last_message_at", { ascending: false })

      if (characterId) {
        query = query.eq("character_id", characterId)
      }

      const { data, error } = await query

      if (!error && data) {
        setSessions(data)
      }
      setLoading(false)
    }

    if (isOpen) {
      setLoading(true)
      loadSessions()
    }
  }, [isOpen, user.isLoggedIn, characterId])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-[#1a1a1a] border-l border-white/10 z-50 flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">
            {t("history")} {characterName && `- ${characterName}`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!user.isLoggedIn ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <p className="text-sm text-gray-500 text-center mb-4">Log in to see your chat history</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500 text-center">{t("noConversationYet")}</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/chat/${session.character_id}?session=${session.id}`}
                  onClick={onClose}
                  className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <p className="text-sm text-white truncate">
                    {session.title || `Chat ${new Date(session.created_at).toLocaleDateString()}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {session.message_count} messages · {new Date(session.last_message_at).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
