import { getBrowserSupabase } from "@/lib/supabase/browser"

export interface ChatMessage {
  id: string
  session_id: string
  role: "user" | "assistant" | "system"
  content: string
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  character_id: string
  title: string | null
  message_count: number
  last_message_at: string
  created_at: string
}

export async function verifyAuth(): Promise<string | null> {
  const supabase = getBrowserSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user?.id) {
    console.log("[v0] No authenticated user found")
    return null
  }

  return session.user.id
}

export async function getOrCreateChatSession(userId: string, characterId: string): Promise<ChatSession | null> {
  const supabase = getBrowserSupabase()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user?.id || session.user.id !== userId) {
    console.log("[v0] Auth mismatch - session user:", session?.user?.id, "requested user:", userId)
    return null
  }

  // Try to get existing session
  const { data: existing, error: selectError } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("character_id", characterId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (selectError) {
    console.log("[v0] Error fetching existing session:", selectError.message)
  }

  if (existing) {
    console.log("[v0] Found existing session:", existing.id)
    return existing
  }

  // Create new session
  console.log("[v0] Creating new session for user:", userId, "character:", characterId)
  const { data: newSession, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      character_id: characterId,
    })
    .select()
    .single()

  if (error) {
    console.log("[v0] Error creating chat session:", error.message)
    return null
  }

  console.log("[v0] Created new session:", newSession.id)
  return newSession
}

export async function loadChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const supabase = getBrowserSupabase()

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error loading messages:", error)
    return []
  }

  return data || []
}

export async function saveChatMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
): Promise<ChatMessage | null> {
  const supabase = getBrowserSupabase()

  // Insert message
  const { data: message, error: messageError } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role,
      content,
    })
    .select()
    .single()

  if (messageError) {
    console.error("[v0] Error saving message:", messageError)
    return null
  }

  // Update session stats
  await supabase
    .from("chat_sessions")
    .update({
      last_message_at: new Date().toISOString(),
      message_count: await getMessageCount(sessionId),
    })
    .eq("id", sessionId)

  return message
}

async function getMessageCount(sessionId: string): Promise<number> {
  const supabase = getBrowserSupabase()
  const { count } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
  return count || 0
}

export async function getUserChatSessions(userId: string): Promise<ChatSession[]> {
  const supabase = getBrowserSupabase()

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false })

  if (error) {
    console.error("[v0] Error loading sessions:", error)
    return []
  }

  return data || []
}
