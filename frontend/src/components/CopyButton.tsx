import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cx } from '../lib/cx'

interface Props {
  value: string
  className?: string
  /** Show a "Copy" label next to the icon */
  label?: boolean
}

export function CopyButton({ value, className, label = false }: Props) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(id)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Copied to clipboard')
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.")
    }
  }

  const Icon = copied ? Check : Copy
  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy link"
      className={cx(
        'inline-flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500',
        label
          ? 'bg-red-600 px-3.5 py-2 text-white hover:bg-red-500'
          : 'p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
        className,
      )}
    >
      <Icon className="size-4" />
      {label && (copied ? 'Copied' : 'Copy')}
    </button>
  )
}
