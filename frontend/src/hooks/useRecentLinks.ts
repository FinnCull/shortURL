import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

export interface RecentLink {
  shortUrl: string
  originalUrl: string
  /** ISO timestamps; expiresAt is null for links that never expire */
  createdAt: string
  expiresAt: string | null
}

const MAX_LINKS = 20

export function useRecentLinks() {
  const [links, setLinks] = useLocalStorage<RecentLink[]>('recent-links', [])

  const add = useCallback(
    (link: RecentLink) =>
      setLinks((prev) => [link, ...prev.filter((l) => l.shortUrl !== link.shortUrl)].slice(0, MAX_LINKS)),
    [setLinks],
  )

  const remove = useCallback(
    (shortUrl: string) => setLinks((prev) => prev.filter((l) => l.shortUrl !== shortUrl)),
    [setLinks],
  )

  const clear = useCallback(() => setLinks([]), [setLinks])

  return { links, add, remove, clear }
}
