import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CalendarClock, Link2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError, createShortUrl } from '../lib/api'
import { addDays, parseTime, toDateInputValue, toLocalDateTime } from '../lib/dates'
import { cx } from '../lib/cx'
import { DatePicker } from './DatePicker'
import { TimeInput } from './TimeInput'
import { useNow } from '../hooks/useNow'
import type { RecentLink } from '../hooks/useRecentLinks'

const PRESETS = [
  { id: '1d', label: '1 day', days: 1 },
  { id: '7d', label: '1 week', days: 7 },
  { id: '30d', label: '1 month', days: 30 },
  { id: 'custom', label: 'Custom', days: null },
] as const

type PresetId = (typeof PRESETS)[number]['id']

interface Props {
  onCreated: (link: RecentLink) => void
}

/** Adds https:// when the user leaves the scheme off, e.g. "example.com/page". */
function normaliseUrl(input: string): string {
  const trimmed = input.trim()
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function ShortenForm({ onCreated }: Props) {
  const [url, setUrl] = useState('')
  const [preset, setPreset] = useState<PresetId>('7d')
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('00:00')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const now = useNow()

  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!(field in prev)) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })

  const mutation = useMutation({
    mutationFn: createShortUrl,
    onSuccess: (shortUrl, request) => {
      onCreated({
        shortUrl,
        originalUrl: request.originalUrl,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(request.expiryDate).toISOString(),
      })
      setUrl('')
      setErrors({})
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        setErrors(Object.fromEntries(error.fieldErrors.map((e) => [e.field, e.message])))
      } else {
        toast.error(error.message)
      }
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!url.trim()) {
      setErrors({ originalUrl: 'Enter a URL to shorten' })
      return
    }

    if (preset === 'custom' && !customDate) {
      setErrors({ expiryDate: 'Enter or pick an expiry date' })
      return
    }

    // An empty time means midnight; anything else must be a complete, valid time
    const time = customTime === '' ? '00:00' : parseTime(customTime)
    if (preset === 'custom' && !time) {
      setErrors({ expiryDate: 'Enter a valid time (hh:mm)' })
      return
    }

    const selected = PRESETS.find((p) => p.id === preset)!
    const expiry =
      selected.days !== null ? addDays(new Date(), selected.days) : new Date(`${customDate}T${time}`)
    if (Number.isNaN(expiry.getTime()) || expiry <= new Date()) {
      setErrors({ expiryDate: 'Expiry must be in the future' })
      return
    }

    setErrors({})
    mutation.mutate({ originalUrl: normaliseUrl(url), expiryDate: toLocalDateTime(expiry) })
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="fade-card z-10 p-5 sm:p-6"
    >
      <label htmlFor="url" className="mb-2 block text-sm font-medium">
        Long URL
      </label>
      {/* Shared grid so the expiry row lines up with the URL input, not the button */}
      <div className="grid gap-x-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Link2 className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-zinc-400" />
          <input
            id="url"
            type="url"
            inputMode="url"
            autoComplete="off"
            autoFocus
            placeholder="https://example.com/a/very/long/link"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              clearError('originalUrl')
            }}
            aria-invalid={!!errors.originalUrl}
            aria-describedby={errors.originalUrl ? 'url-error' : undefined}
            className={cx(
              'h-12 w-full rounded-xl border bg-zinc-50 pr-3 pl-10 text-base outline-none transition',
              'placeholder:text-zinc-400 focus:bg-white focus:ring-4 dark:bg-zinc-950 dark:focus:bg-zinc-950',
              errors.originalUrl
                ? 'border-red-400 focus:ring-red-500/15 dark:border-red-500/60'
                : 'border-zinc-200 focus:border-red-500 focus:ring-red-500/15 dark:border-zinc-700',
            )}
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className={cx(
            'mt-3 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 font-semibold text-white sm:mt-0',
            'shadow-sm shadow-red-600/20 transition hover:bg-red-500 active:scale-[0.98]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500',
            'disabled:cursor-not-allowed disabled:opacity-70',
          )}
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Shorten
        </button>
        {errors.originalUrl && (
          <p id="url-error" role="alert" className="mt-2 text-sm text-red-600 sm:col-start-1 dark:text-red-400">
            {errors.originalUrl}
          </p>
        )}

        <fieldset className="mt-5 sm:col-start-1">
          <legend className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <CalendarClock className="size-4 text-zinc-400" />
            Expires in
          </legend>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPreset(p.id)
                  clearError('expiryDate')
                }}
                aria-pressed={preset === p.id}
                className={cx(
                  'rounded-lg border px-3.5 py-1.5 text-sm font-medium transition',
                  preset === p.id
                    ? 'border-red-600 bg-red-600 text-white'
                    : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800',
                )}
              >
                {p.label}
              </button>
            ))}
            {preset === 'custom' && (
              <div className="relative ml-auto flex items-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm transition focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/15 dark:border-zinc-700 dark:bg-zinc-950">
                <DatePicker
                  aria-label="Custom expiry date"
                  value={customDate}
                  min={toDateInputValue(now)}
                  onChange={(value) => {
                    setCustomDate(value)
                    clearError('expiryDate')
                  }}
                />
                <TimeInput
                  aria-label="Custom expiry time"
                  value={customTime}
                  onChange={(value) => {
                    setCustomTime(value)
                    clearError('expiryDate')
                  }}
                />
              </div>
            )}
          </div>
          {errors.expiryDate && (
            <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.expiryDate}
            </p>
          )}
        </fieldset>
      </div>
    </form>
  )
}
