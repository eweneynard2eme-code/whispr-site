import { TopBar } from "@/components/top-bar"
import { ImageIcon, Sparkles } from "lucide-react"

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <TopBar />

      <div className="flex flex-col items-center justify-center px-6 py-20">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 mb-6">
          <ImageIcon className="h-12 w-12 text-violet-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Generate Image</h1>
        <p className="text-gray-400 text-center max-w-md mb-8">
          Create stunning AI-generated images for your characters and scenarios
        </p>

        <div className="w-full max-w-2xl">
          <div className="relative">
            <textarea
              placeholder="Describe the image you want to generate..."
              className="w-full h-32 rounded-xl bg-white/5 border border-white/10 p-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
            <button className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 font-medium text-white hover:opacity-90 transition-opacity">
              <Sparkles className="h-4 w-4" />
              Generate
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {["Portrait", "Anime", "Realistic", "Fantasy"].map((style) => (
              <button
                key={style}
                className="rounded-lg bg-white/5 border border-white/10 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
