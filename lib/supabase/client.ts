import { getBrowserSupabase } from "./browser"

// Singleton to avoid Multiple GoTrueClient instances warning
export { getBrowserSupabase as createClient }
