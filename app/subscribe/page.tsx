"use client"

import { useState } from "react"
import { TopBar } from "@/components/top-bar"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

const plans = ["Basic", "Premium", "Ultimate"]

const features = {
  models: [
    { name: "Permanent Memory(PM)", new: true, basic: false, premium: false, ultimate: true },
    { name: "Passion model(P)", basic: false, premium: true, ultimate: true },
    { name: "Tale model(T)", basic: false, premium: true, ultimate: true },
    { name: "Long Memory", basic: true, premium: true, ultimate: true },
    { name: "Standard model(S)", basic: true, premium: true, ultimate: true },
  ],
  experience: [
    { name: "Ad-free", basic: true, premium: true, ultimate: true },
    { name: "Unlimited voice listening on chat page", basic: false, premium: true, ultimate: true },
    { name: "Unlimited chats", basic: true, premium: true, ultimate: true },
    { name: "Respond faster and chat more smoothly", basic: true, premium: true, ultimate: true },
    { name: "Skip the queue and have priority chat rights", basic: true, premium: true, ultimate: true },
  ],
  personalize: [
    { name: "Custom character voices", basic: false, premium: true, ultimate: true },
    { name: "Priority support", basic: false, premium: false, ultimate: true },
  ],
}

const pricing = {
  Basic: { monthly: 9.99, yearly: 79.99, monthlyOriginal: 59.7 },
  Premium: { monthly: 14.99, yearly: 119.99, monthlyOriginal: 89.7 },
  Ultimate: { monthly: 24.99, yearly: 199.99, monthlyOriginal: 149.7 },
}

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState("Basic")

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <TopBar />

      <div className="px-6 py-8">
        {/* Plan tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full bg-white/5 p-1">
            {plans.map((plan) => (
              <button
                key={plan}
                onClick={() => setSelectedPlan(plan)}
                className={cn(
                  "rounded-full px-8 py-2 text-sm font-medium transition-all",
                  selectedPlan === plan ? "bg-white text-black" : "text-gray-400 hover:text-white",
                )}
              >
                {plan}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing cards */}
        <div className="flex justify-center gap-6 mb-8">
          {/* Monthly */}
          <div className="w-72 rounded-2xl border-2 border-violet-500 bg-[#1a1a1a] p-6">
            <p className="text-sm text-gray-400 mb-2">Per Month</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-white">
                €{pricing[selectedPlan as keyof typeof pricing].monthly}
              </span>
              <span className="text-sm text-gray-500 line-through">
                €{pricing[selectedPlan as keyof typeof pricing].monthlyOriginal}
              </span>
            </div>
            <button className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-semibold text-white hover:opacity-90 transition-opacity">
              Subscribe
            </button>
          </div>

          {/* Yearly */}
          <div className="w-72 rounded-2xl bg-[#1a1a1a] p-6">
            <p className="text-sm text-gray-400 mb-2">Per Year</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold text-white">
                €{(pricing[selectedPlan as keyof typeof pricing].yearly / 12).toFixed(2)}
              </span>
              <span className="text-sm text-gray-400">/Month</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              | €{pricing[selectedPlan as keyof typeof pricing].yearly} Total
            </p>
            <button className="w-full rounded-lg bg-white/10 py-3 font-semibold text-white hover:bg-white/20 transition-colors">
              Subscribe
            </button>
          </div>
        </div>

        {/* Feature matrix */}
        <div className="max-w-3xl mx-auto">
          {/* Models section */}
          <div className="rounded-xl bg-[#1a1a1a] overflow-hidden mb-4">
            <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-white/5">
              <div className="text-sm font-medium text-gray-400">Models</div>
              <div className="text-sm font-medium text-gray-400 text-center">Ultimate</div>
              <div className="text-sm font-medium text-gray-400 text-center">Premium</div>
              <div className="text-sm font-medium text-white text-center">Basic</div>
            </div>
            {features.models.map((feature) => (
              <div
                key={feature.name}
                className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-violet-400">{feature.name}</span>
                  {feature.new && (
                    <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">New</span>
                  )}
                </div>
                <div className="flex justify-center">
                  {feature.ultimate ? (
                    <Check className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div className="flex justify-center">
                  {feature.premium ? (
                    <Check className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div className="flex justify-center">
                  {feature.basic ? (
                    <Check className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Experience section */}
          <div className="rounded-xl bg-[#1a1a1a] overflow-hidden mb-4">
            <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-white/5">
              <div className="text-sm font-medium text-gray-400">Experience</div>
              <div className="text-sm font-medium text-gray-400 text-center">Ultimate</div>
              <div className="text-sm font-medium text-gray-400 text-center">Premium</div>
              <div className="text-sm font-medium text-white text-center">Basic</div>
            </div>
            {features.experience.map((feature) => (
              <div
                key={feature.name}
                className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-white/5 last:border-0"
              >
                <div className="text-sm text-gray-300">{feature.name}</div>
                <div className="flex justify-center">
                  {feature.ultimate ? (
                    <Check className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div className="flex justify-center">
                  {feature.premium ? (
                    <Check className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div className="flex justify-center">
                  {feature.basic ? (
                    <Check className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Personalize section */}
          <div className="rounded-xl bg-[#1a1a1a] overflow-hidden">
            <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-white/5">
              <div className="text-sm font-medium text-gray-400">Personalize</div>
              <div className="text-sm font-medium text-gray-400 text-center">Ultimate</div>
              <div className="text-sm font-medium text-gray-400 text-center">Premium</div>
              <div className="text-sm font-medium text-white text-center">Basic</div>
            </div>
            {features.personalize.map((feature) => (
              <div
                key={feature.name}
                className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-white/5 last:border-0"
              >
                <div className="text-sm text-gray-300">{feature.name}</div>
                <div className="flex justify-center">
                  {feature.ultimate ? (
                    <Check className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div className="flex justify-center">
                  {feature.premium ? (
                    <Check className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div className="flex justify-center">
                  {feature.basic ? (
                    <Check className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
