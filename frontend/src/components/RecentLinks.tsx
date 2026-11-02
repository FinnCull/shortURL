import { Trash2 } from 'lucide-react'
import { CopyButton } from './CopyButton'
import { formatRelative } from '../lib/dates'
import { cx } from '../lib/cx'
import { useNow } from '../hooks/useNow'
import type { RecentLink } from '../hooks/useRecentLinks'

interface Props {
  links: RecentLink[]
  onRemove: (shortUrl: string) => void
  onClear: () => void
}

export function RecentLinks({ links, onRemove, onClear }: Props) {
  const now = useNow()
  if (links.length === 0) return null

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Recent links
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Clear all
        </button>
      </div>

      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {links.map((link) => {
          const expiresAt = new Date(link.expiresAt)
          const expired = expiresAt <= now
          return (
            <li key={link.shortUrl} className="group flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cx(
                      'truncate font-medium',
                      expired
                        ? 'text-zinc-400 line-through dark:text-zinc-500'
                        : 'text-red-600 hover:underline dark:text-red-400',
                    )}
                  >
                    {link.shortUrl.replace(/^https?:\/\//, '')}
                  </a>
                  <span
                    title={expiresAt.toLocaleString()}
                    className={cx(
                      'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                      expired
                        ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
                    )}
                  >
                    {expired ? 'Expired' : `Expires ${formatRelative(expiresAt, now)}`}
                  </span>
                </div>
                <p className="truncate text-sm text-zinc-500 dark:text-zinc-400" title={link.originalUrl}>
                  {link.originalUrl}
                </p>
              </div>
              {!expired && <CopyButton value={link.shortUrl} />}
              <button
                type="button"
                onClick={() => onRemove(link.shortUrl)}
                aria-label="Remove from history"
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">Stored only in this browser.</p>
    </section>
  )
}
