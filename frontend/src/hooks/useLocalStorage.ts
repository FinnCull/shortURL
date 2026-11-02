import { useEffect, useState } from 'react'

/** useState that persists to localStorage. Falls back to in-memory state if storage is unavailable. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? (JSON.parse(stored) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or blocked (e.g. private mode); keep working in memory
    }
  }, [key, value])

  return [value, setValue] as const
}
