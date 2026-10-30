import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, parseDateInputValue, toDateInputValue } from '../lib/dates'
import { cx } from '../lib/cx'
import { useNow } from '../hooks/useNow'

interface Props {
  /** Selected date as YYYY-MM-DD, or '' for none */
  value: string
  onChange: (value: string) => void
  /** Earliest selectable date as YYYY-MM-DD */
  min?: string
  'aria-label'?: string
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const monthFormat = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
const fullDateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'full' })

/** YYYY-MM-DD -> dd/mm/yyyy */
function formatDisplay(value: string): string {
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

/**
 * Normalises typed input into a partial dd/mm/yyyy string. Slashes are added automatically,
 * and a single-digit day or month followed by a separator is zero-padded ("5/" -> "05").
 */
function formatTyped(raw: string): string {
  const parts = raw.split(/\D+/)
  const digits = parts
    .map((part, i) => (i < 2 && i < parts.length - 1 && part.length === 1 ? `0${part}` : part))
    .join('')
    .slice(0, 8)
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/')
}

/** dd/mm/yyyy -> YYYY-MM-DD, or '' if incomplete or not a real date (e.g. 31/02). */
function parseTyped(text: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text)
  if (!match) return ''
  const [, d, m, y] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.getDate() === Number(d) && date.getMonth() === Number(m) - 1 ? `${y}-${m}-${d}` : ''
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, months: number): Date {
  // Clamp the day so e.g. 31 Jan + 1 month lands on 28/29 Feb, not 3 Mar
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(date.getDate(), lastDay))
  return target
}

/** The 6-week grid (Monday first) that contains the given month. */
function monthGrid(month: Date): Date[] {
  const first = startOfMonth(month)
  const offset = (first.getDay() + 6) % 7 // days since Monday
  const start = addDays(first, -offset)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

/**
 * Date field with a custom calendar popover.
 * The popover is absolutely positioned against the nearest `relative` ancestor, aligned to its right edge.
 */
export function DatePicker({ value, onChange, min, 'aria-label': ariaLabel = 'Date' }: Props) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(() => new Date())
  const [text, setText] = useState(() => (value ? formatDisplay(value) : ''))
  const [syncedValue, setSyncedValue] = useState(value)
  const fieldRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  if (value !== syncedValue) {
    setSyncedValue(value)
    if (value !== parseTyped(text)) setText(value ? formatDisplay(value) : '')
  }

  const today = toDateInputValue(useNow())
  const isDisabled = (iso: string) => (min ? iso < min : false)
  const clampToMin = (date: Date) => (min && toDateInputValue(date) < min ? parseDateInputValue(min) : date)

  const openCalendar = () => {
    setFocused(clampToMin(value ? parseDateInputValue(value) : new Date()))
    setOpen(true)
  }

  const close = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) inputRef.current?.focus()
  }

  const select = (iso: string) => {
    if (isDisabled(iso)) return
    onChange(iso)
    close()
  }

  // Close when clicking outside the trigger or popover
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!popoverRef.current?.contains(target) && !fieldRef.current?.contains(target)) close(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Keep keyboard focus on the focused day as it moves
  useEffect(() => {
    if (!open) return
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${toDateInputValue(focused)}"]`)?.focus()
  }, [open, focused])

  const onGridKeyDown = (e: KeyboardEvent) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, -1),
      PageDown: () => addMonths(focused, 1),
      Home: () => addDays(focused, -((focused.getDay() + 6) % 7)),
      End: () => addDays(focused, 6 - ((focused.getDay() + 6) % 7)),
    }
    const move = moves[e.key]
    if (move) {
      e.preventDefault()
      setFocused(clampToMin(move()))
    }
  }

  const viewMonth = startOfMonth(focused)
  const canGoBack = !min || toDateInputValue(addDays(viewMonth, -1)) >= min
  const focusedIso = toDateInputValue(focused)

  return (
    <>
      <div ref={fieldRef} className="flex h-full items-center">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/yyyy"
          aria-label={`${ariaLabel} (dd/mm/yyyy)`}
          value={text}
          onChange={(e) => {
            const formatted = formatTyped(e.target.value)
            setText(formatted)
            const parsed = parseTyped(formatted)
            if (parsed !== value) onChange(parsed)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && e.altKey) {
              e.preventDefault()
              openCalendar()
            }
          }}
          className="h-full w-[6.75rem] bg-transparent pl-3 tabular-nums outline-none placeholder:text-zinc-400"
        />
        <button
          type="button"
          onClick={() => (open ? close() : openCalendar())}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={value ? `Open calendar, ${fullDateFormat.format(parseDateInputValue(value))} selected` : 'Open calendar'}
          className="mr-1 rounded-md p-1 text-zinc-500 outline-none hover:bg-zinc-200/70 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-red-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <CalendarDays className="size-4" />
        </button>
      </div>

      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Choose a date"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              close()
            }
          }}
          className="animate-in absolute top-full right-0 z-20 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg shadow-zinc-950/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setFocused(clampToMin(addMonths(focused, -1)))}
              disabled={!canGoBack}
              aria-label="Previous month"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p aria-live="polite" className="text-sm font-semibold">
              {monthFormat.format(viewMonth)}
            </p>
            <button
              type="button"
              onClick={() => setFocused(addMonths(focused, 1))}
              aria-label="Next month"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div ref={gridRef} role="grid" onKeyDown={onGridKeyDown} className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((d) => (
              <div key={d} role="columnheader" className="pb-1 text-xs font-medium text-zinc-400">
                {d}
              </div>
            ))}
            {monthGrid(viewMonth).map((day) => {
              const iso = toDateInputValue(day)
              const inMonth = day.getMonth() === viewMonth.getMonth()
              const selected = iso === value
              const disabled = isDisabled(iso)
              return (
                <button
                  key={iso}
                  type="button"
                  role="gridcell"
                  data-date={iso}
                  tabIndex={iso === focusedIso ? 0 : -1}
                  disabled={disabled}
                  aria-selected={selected}
                  aria-label={fullDateFormat.format(day)}
                  onClick={() => select(iso)}
                  className={cx(
                    'relative grid size-9 place-items-center rounded-lg text-sm tabular-nums transition-colors outline-none',
                    'focus-visible:ring-2 focus-visible:ring-red-500',
                    selected
                      ? 'bg-red-600 font-semibold text-white'
                      : disabled
                        ? 'cursor-not-allowed text-zinc-300 dark:text-zinc-700'
                        : cx(
                            'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                            inMonth ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500',
                          ),
                    iso === today && !selected && 'font-semibold text-red-600 dark:text-red-400',
                  )}
                >
                  {day.getDate()}
                  {iso === today && (
                    <span
                      aria-hidden
                      className={cx(
                        'absolute bottom-1 size-1 rounded-full',
                        selected ? 'bg-white' : 'bg-red-600 dark:bg-red-400',
                      )}
                    />
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-2 flex justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                onChange('')
                close()
              }}
              className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => select(today)}
              disabled={isDisabled(today)}
              className="rounded-md px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </>
  )
}
