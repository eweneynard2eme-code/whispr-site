import Link from "next/link"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-zinc-400 mb-2">We encountered an error during authentication.</p>
          {params?.error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
              Error: {params.error}
            </p>
          )}

          <Button asChild className="w-full bg-zinc-800 hover:bg-zinc-700 text-white">
            <Link href="/auth/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Try again
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
