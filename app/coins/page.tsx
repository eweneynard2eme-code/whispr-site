"use client"

import { useState, useEffect } from "react"
import { TopBar } from "@/components/top-bar"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

const coinPackages = [
  { coins: 8000, price: 9.9, original: 59.8, discount: "83%OFF", recommended: true },
  { coins: 1000, price: 2.99, original: 7.48, label: "Newbie Perks" },
  { coins: 3000, price: 5.99, original: 22.4 },
  { coins: 20000, price: 22.9, original: 160 },
]

const features = [
  "Heart WhisperNew",
  "Generate Live Photos",
  "Regenerate AI Responses",
  "Inspiration Reply",
  "Unlock Moments",
  "Passion Model Rounds",
  "Tale Model Rounds",
]

export default function CoinsPage() {
  const [selected, setSelected] = useState(0)
  const [countdown, setCountdown] = useState({ hours: 19, minutes: 8, seconds: 42 })

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        let { hours, minutes, seconds } = prev
        seconds--
        if (seconds < 0) {
          seconds = 59
          minutes--
        }
        if (minutes < 0) {
          minutes = 59
          hours--
        }
        if (hours < 0) {
          hours = 23
          minutes = 59
          seconds = 59
        }
        return { hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <TopBar />

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Countdown banner */}
        <div className="rounded-xl bg-gradient-to-r from-amber-900/50 to-orange-900/50 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 relative">
                <Image src="/placeholder.svg?height=40&width=40" alt="Coins" fill className="object-contain" />
              </div>
              <span className="text-lg font-semibold text-amber-200">Today Only</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">⏱</span>
              <div className="flex items-center gap-1">
                <span className="bg-white/10 rounded px-2 py-1 text-white font-mono">
                  {String(countdown.hours).padStart(2, "0")}
                </span>
                <span className="text-white">:</span>
                <span className="bg-white/10 rounded px-2 py-1 text-white font-mono">
                  {String(countdown.minutes).padStart(2, "0")}
                </span>
                <span className="text-white">:</span>
                <span className="bg-white/10 rounded px-2 py-1 text-white font-mono">
                  {String(countdown.seconds).padStart(2, "0")}
                </span>
              </div>
              <div className="h-8 w-8 relative">
                <Image src="/placeholder.svg?height=32&width=32" alt="Gift" fill className="object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="rounded-xl bg-[#1a1a1a] p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-300 mb-4">
                Coins are the virtual cash of the Poly universe! With more coins, you can make your chat experience even
                more awesome:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-amber-400">✦</span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-24 w-24 shrink-0">
              <Image src="/placeholder.svg?height=100&width=100" alt="Coins" fill className="object-contain" />
            </div>
          </div>
        </div>

        {/* Coin packages */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {coinPackages.map((pkg, index) => (
            <button
              key={index}
              onClick={() => setSelected(index)}
              className={cn(
                "relative rounded-xl p-4 text-left transition-all",
                selected === index
                  ? "bg-gradient-to-br from-amber-200 to-amber-100 text-black"
                  : "bg-[#1a1a1a] text-white hover:bg-[#222]",
              )}
            >
              {pkg.discount && (
                <span className="absolute -top-2 left-4 rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  {pkg.discount}
                </span>
              )}
              {pkg.label && (
                <span className="absolute -top-2 left-4 rounded bg-violet-500 px-2 py-0.5 text-xs font-bold text-white">
                  {pkg.label}
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12">
                  <Image src="/placeholder.svg?height=48&width=48" alt="Coins" fill className="object-contain" />
                </div>
                <div>
                  <div className={cn("text-2xl font-bold", selected === index ? "text-amber-800" : "text-amber-400")}>
                    {pkg.coins.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-semibold", selected === index ? "text-black" : "text-white")}>
                      €{pkg.price}
                    </span>
                    <span
                      className={cn("text-sm line-through", selected === index ? "text-black/50" : "text-gray-500")}
                    >
                      €{pkg.original}
                    </span>
                  </div>
                </div>
              </div>
              {selected === index && (
                <div className="absolute bottom-2 right-2">
                  <Check className="h-5 w-5 text-amber-800" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Buy button */}
        <button className="w-full rounded-xl bg-gradient-to-r from-amber-200 to-amber-100 py-4 font-bold text-black text-lg hover:opacity-90 transition-opacity">
          Buy Now
        </button>

        <button className="w-full mt-4 text-sm text-gray-500 hover:text-gray-400 transition-colors">Refund</button>
      </div>
    </div>
  )
}
