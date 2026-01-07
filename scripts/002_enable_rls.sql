-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_characters ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_select_public" ON public.profiles 
  FOR SELECT USING (true);

-- Characters policies (public characters visible to all, own characters editable)
CREATE POLICY "characters_select_public" ON public.characters 
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());
CREATE POLICY "characters_insert_own" ON public.characters 
  FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "characters_update_own" ON public.characters 
  FOR UPDATE USING (creator_id = auth.uid());
CREATE POLICY "characters_delete_own" ON public.characters 
  FOR DELETE USING (creator_id = auth.uid());

-- Chat sessions policies (users can only access their own)
CREATE POLICY "chat_sessions_select_own" ON public.chat_sessions 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "chat_sessions_insert_own" ON public.chat_sessions 
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "chat_sessions_update_own" ON public.chat_sessions 
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "chat_sessions_delete_own" ON public.chat_sessions 
  FOR DELETE USING (user_id = auth.uid());

-- Chat messages policies (users can access messages from their sessions)
CREATE POLICY "chat_messages_select_own" ON public.chat_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );
CREATE POLICY "chat_messages_insert_own" ON public.chat_messages 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );
CREATE POLICY "chat_messages_delete_own" ON public.chat_messages 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Collections policies
CREATE POLICY "collections_select_own" ON public.collections 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "collections_insert_own" ON public.collections 
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "collections_delete_own" ON public.collections 
  FOR DELETE USING (user_id = auth.uid());

-- Character likes policies
CREATE POLICY "character_likes_select_all" ON public.character_likes 
  FOR SELECT USING (true);
CREATE POLICY "character_likes_insert_own" ON public.character_likes 
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "character_likes_delete_own" ON public.character_likes 
  FOR DELETE USING (user_id = auth.uid());

-- User characters policies
CREATE POLICY "user_characters_select_own" ON public.user_characters 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_characters_insert_own" ON public.user_characters 
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_characters_delete_own" ON public.user_characters 
  FOR DELETE USING (user_id = auth.uid());
