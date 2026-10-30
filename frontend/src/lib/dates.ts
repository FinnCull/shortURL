/** Formats a Date as a zone-less ISO-8601 local date-time, matching Java's LocalDateTime. */
export function toLocalDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

/** Value for a <input type="date"> or a date-only string: YYYY-MM-DD in local time. */
export function toDateInputValue(date: Date): string {
  return toLocalDateTime(date).slice(0, 10)
}

/** Parses YYYY-MM-DD as local midnight (new Date('YYYY-MM-DD') would use UTC). */
export function parseDateInputValue(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

/** Human-friendly relative time, e.g. "in 3 days" or "2 hours ago". */
export function formatRelative(date: Date, now = new Date()): string {
  const seconds = (date.getTime() - now.getTime()) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return rtf.format(Math.round(seconds), 'second')
}
