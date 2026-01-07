import { TopBar } from "@/components/top-bar"
import { Bell } from "lucide-react"

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <TopBar />

      <div className="flex flex-col items-center justify-center px-6 py-20">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/5 mb-6">
          <Bell className="h-12 w-12 text-gray-500" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Notifications</h1>
        <p className="text-gray-400 text-center max-w-md">
          No notifications yet. Start chatting with characters to receive updates!
        </p>
      </div>
    </div>
  )
}
