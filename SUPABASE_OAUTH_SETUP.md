# WHISPR - Real Google OAuth with Supabase Implementation Guide

## ✅ What's Implemented

### 1. **Google OAuth Login**
- ✅ "Continue with Google" button in auth modal (`components/auth-modal.tsx`)
- ✅ Uses `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } })`
- ✅ OAuth callback handler at `/app/auth/callback/route.ts` exchanges code for session

### 2. **Session Persistence**
- ✅ Server-side session via `createServerClient` + cookies (`lib/supabase/server.ts`)
- ✅ Browser-side session via `createBrowserClient` (`lib/supabase/client.ts`)
- ✅ Middleware on every request: `proxy.ts` → `lib/supabase/proxy.ts` → `updateSession()`
- ✅ Client-side hydration: `lib/user-store.ts` calls `getSession()` on mount + subscribes to `onAuthStateChange`
- ✅ After refresh, user stays logged in across the entire app

### 3. **Database & RLS**
All tables have proper Row Level Security policies:
- ✅ `profiles` - Users can select/update their own profile
- ✅ `chat_sessions` - Users can CRUD only their own sessions
- ✅ `chat_messages` - Users can CRUD only messages in their sessions
- ✅ `collections` (favorites) - Users can toggle favorites they created
- ✅ `character_likes`, `user_characters`, `characters` - Full RLS policies in place

### 4. **UI Features Wired to Supabase**
- ✅ **Collect Button**: Toggle favorite in Supabase `collections` table (`app/c/[id]/page.tsx`)
- ✅ **History Panel**: Lists chat sessions from Supabase (`components/history-panel.tsx`)
- ✅ **Chat Page**: Loads/saves messages to Supabase, persists session (`app/chat/[id]/page.tsx`)
- ✅ **Debug Page**: Shows auth status, session count, favorites count (`app/debug/supabase/page.tsx`)

---

## 🔧 Required Environment Variables

Set these in your Vercel project settings (Vars section):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

These are auto-set by v0 when Supabase is connected. Find them at:
https://supabase.com/dashboard/project/_/settings/api

---

## 🚀 How It Works

### Auth Flow
1. User clicks "Continue with Google"
2. Redirected to Google OAuth consent screen
3. After approval, redirected to `/auth/callback?code=...`
4. Server exchanges `code` for session, sets cookies
5. Middleware (`proxy.ts`) refreshes session on every request
6. `useUserStore` hydrates on client with current auth state
7. After page refresh, user still logged in

### Favorites (Collect)
1. Click "Collect ★" on character detail page
2. Calls `userStore.toggleFavorite(characterId)`
3. Inserts/deletes row in `collections` table with `user_id = auth.uid()`
4. Button state reflects immediately (optimistic update)
5. RLS policy ensures only authenticated user can modify their collection

### Chat Sessions & Messages
1. User starts chat with character
2. `verifyAuth()` checks for Supabase session
3. If authenticated, calls `getOrCreateChatSession(userId, characterId)`
4. Loads existing messages from `chat_messages` table
5. Each message sent is persisted to Supabase
6. History panel queries `chat_sessions` and displays all past conversations

### Debug Dashboard
- Go to `/debug/supabase` to see:
  - Current user email/ID
  - Total chat sessions
  - Total favorites
  - Auth provider (Google/email)

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `proxy.ts` | Middleware entry point - refreshes session every request |
| `lib/supabase/server.ts` | Create server Supabase client with cookies |
| `lib/supabase/client.ts` | Create browser Supabase client |
| `lib/supabase/proxy.ts` | Session refresh logic for middleware |
| `lib/supabase/chat.ts` | Chat session & message functions |
| `lib/user-store.ts` | Global auth state with Supabase sync |
| `app/auth/callback/route.ts` | OAuth callback handler |
| `components/auth-modal.tsx` | Google OAuth + email/password forms |
| `app/c/[id]/page.tsx` | Character detail - Collect button |
| `app/chat/[id]/page.tsx` | Chat page - loads/saves sessions |
| `components/history-panel.tsx` | Lists past chat sessions |
| `app/debug/supabase/page.tsx` | Debug dashboard |

---

## ✨ Testing Checklist

- [ ] Click "Continue with Google" → Completes OAuth flow → Redirects to /discover
- [ ] Refresh page → User still logged in (check top bar shows email)
- [ ] Open character detail page → "Collect" button works → Updates Supabase
- [ ] Send message in chat → Appears immediately → Check `/debug/supabase` shows message count
- [ ] Click History → See past chat sessions from Supabase
- [ ] Logout → User state clears → "Collect" requires login again
- [ ] Login with email/password → Works the same as Google OAuth

---

## 🐛 Troubleshooting

**"Continue with Google" button not working?**
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Verify Google OAuth credentials in Supabase dashboard

**User not staying logged in after refresh?**
- Check middleware is running: Verify `proxy.ts` export matches `middleware` (not `proxy`)
- Check browser cookies: Look for `sb-*` cookies

**Collect button not saving?**
- Check user is authenticated (check `/debug/supabase`)
- Verify RLS policy on `collections` table allows INSERT for authenticated users
- Check browser console for errors

**Chat messages not saving?**
- Check user is authenticated
- Verify `chat_sessions` and `chat_messages` RLS policies
- Check message count in `/debug/supabase`

---

## 📝 Notes

- All data scoped by `auth.uid()` via RLS - no cross-user data leaks
- Session tokens refreshed automatically via middleware
- Favorites/chat history sync between browser and database in real-time
- Debug page useful for verifying Supabase connectivity
