-- Allow inserting collections with any character_id (since we use mock data IDs)
-- Drop the foreign key constraint on collections.character_id if it exists
-- This allows us to save mock character IDs that don't exist in the characters table

-- First, check if collections table exists and modify it
DO $$
BEGIN
  -- Drop the foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'collections_character_id_fkey' 
    AND table_name = 'collections'
  ) THEN
    ALTER TABLE public.collections DROP CONSTRAINT collections_character_id_fkey;
  END IF;
  
  -- Also drop from chat_sessions if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chat_sessions_character_id_fkey' 
    AND table_name = 'chat_sessions'
  ) THEN
    ALTER TABLE public.chat_sessions DROP CONSTRAINT chat_sessions_character_id_fkey;
  END IF;
END $$;

-- Make character_id a simple TEXT field to store mock IDs
ALTER TABLE public.collections 
  ALTER COLUMN character_id TYPE TEXT USING character_id::TEXT;

ALTER TABLE public.chat_sessions 
  ALTER COLUMN character_id TYPE TEXT USING character_id::TEXT;
