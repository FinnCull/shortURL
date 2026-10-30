interface Props {
  /** Typed text, possibly partial, e.g. "14:3" */
  value: string
  onChange: (value: string) => void
  'aria-label'?: string
}

/**
 * Normalises typed input into a partial hh:mm string. The colon is added automatically,
 * and a single-digit hour followed by a separator is zero-padded ("9:" -> "09").
 */
function formatTyped(raw: string): string {
  const parts = raw.split(/\D+/)
  const digits = parts
    .map((part, i) => (i === 0 && parts.length > 1 && part.length === 1 ? `0${part}` : part))
    .join('')
    .slice(0, 4)
  return [digits.slice(0, 2), digits.slice(2)].filter(Boolean).join(':')
}

/** Plain text time field (24-hour) that formats as you type, matching the DatePicker field. */
export function TimeInput({ value, onChange, 'aria-label': ariaLabel = 'Time' }: Props) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="hh:mm"
      aria-label={`${ariaLabel} (hh:mm, 24-hour)`}
      value={value}
      onChange={(e) => onChange(formatTyped(e.target.value))}
      className="h-full w-[3.75rem] bg-transparent pr-3 tabular-nums outline-none placeholder:text-zinc-400"
    />
  )
}
