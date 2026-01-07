"use client"

import { useState, useEffect } from "react"

export function PromoBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 19, minutes: 56, seconds: 18 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
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
        }
        return { hours, minutes, seconds }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed top-2 right-20 z-50 animate-in slide-in-from-top duration-300">
      
    </div>
  )
}
