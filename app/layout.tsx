import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Sidebar } from "@/components/sidebar"
import { MobileTopBar } from "@/components/mobile-topbar"
import { AuthModalProvider } from "@/components/auth-modal-provider"
import { I18nProvider } from "@/components/i18n-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WHISPR - AI Character Marketplace",
  description: "Chat with AI characters, create your own personas, and explore endless scenarios",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-[#0d0d0d] text-white overflow-x-hidden max-w-screen`}>
        <I18nProvider>
          <AuthModalProvider>
            {/* Mobile topbar (only on mobile) */}
            <MobileTopBar />
            
            <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
              {/* Desktop sidebar (only on md+) */}
              <Sidebar />
              
              {/* Main content - full width on mobile, with margin on desktop */}
              <main className="flex-1 min-w-0 md:ml-56 w-full md:max-w-[calc(100vw-14rem)] overflow-x-hidden">
                {children}
              </main>
            </div>
          </AuthModalProvider>
        </I18nProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
