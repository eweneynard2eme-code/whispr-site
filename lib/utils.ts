import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parses a JSON string from localStorage.
 * If parsing fails, removes the corrupted key and returns null.
 * @param value - The string value from localStorage (or null)
 * @returns Parsed value or null if parsing fails
 */
export function safeParse<T>(value: string | null, storageKey?: string): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch (error) {
    // Remove corrupted value from localStorage if key is provided
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey)
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[safeParse] Removed corrupted localStorage key: ${storageKey}`)
        }
      } catch {
        // Ignore localStorage errors
      }
    }
    return null
  }
}
