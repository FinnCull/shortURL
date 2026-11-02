import { useState } from 'react'
import { ExternalLink, QrCode, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { CopyButton } from './CopyButton'
import { formatRelative } from '../lib/dates'
import { useNow } from '../hooks/useNow'
import type { RecentLink } from '../hooks/useRecentLinks'

interface Props {
  link: RecentLink
  onDismiss: () => void
}

export function ResultCard({ link, onDismiss }: Props) {
  const [showQr, setShowQr] = useState(false)
  const now = useNow()
  const display = link.shortUrl.replace(/^https?:\/\//, '')

  return (
    <section
      aria-live="polite"
      className="animate-in relative rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm sm:p-6 dark:border-red-500/30 dark:from-red-500/10 dark:to-zinc-900"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <X className="size-4" />
      </button>

      <p className="text-sm font-medium text-red-700 dark:text-red-300">Your short link is ready</p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href={link.shortUrl}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 truncate text-2xl font-semibold tracking-tight text-zinc-900 hover:text-red-600 dark:text-white dark:hover:text-red-400"
        >
          {display}
        </a>
        <div className="flex items-center gap-1">
          <CopyButton value={link.shortUrl} label />
          <a
            href={link.shortUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open link"
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <ExternalLink className="size-4" />
          </a>
          <button
            type="button"
            onClick={() => setShowQr((s) => !s)}
            aria-label={showQr ? 'Hide QR code' : 'Show QR code'}
            aria-pressed={showQr}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 aria-pressed:bg-zinc-100 aria-pressed:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:aria-pressed:bg-zinc-800 dark:aria-pressed:text-zinc-100"
          >
            <QrCode className="size-4" />
          </button>
        </div>
      </div>

      <dl className="mt-4 grid gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="flex gap-2">
          <dt className="shrink-0">Points to</dt>
          <dd className="truncate text-zinc-900 dark:text-zinc-200" title={link.originalUrl}>
            {link.originalUrl}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt>Expires</dt>
          <dd className="text-zinc-900 dark:text-zinc-200" title={new Date(link.expiresAt).toLocaleString()}>
            {formatRelative(new Date(link.expiresAt), now)}
          </dd>
        </div>
      </dl>

      {showQr && (
        <div className="mt-5 flex justify-center">
          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-zinc-200">
            <QRCodeSVG value={link.shortUrl} size={160} marginSize={0} />
          </div>
        </div>
      )}
    </section>
  )
}
