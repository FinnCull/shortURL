import { cx } from '../lib/cx'

interface Props {
  /** When true, the scissors cut the word. Remount (via `key`) to replay. */
  cutting: boolean
}

/** Hero: the word "URL" with scissors waiting on a cut line; they snip it in half when `cutting` is set. */
export function HeroCut({ cutting }: Props) {
  return (
    <div className="flex justify-center py-4 sm:py-8">
      <h1 className="sr-only">URL Shortener</h1>
      <div
        aria-hidden
        className={cx(
          'hero-cut relative select-none text-[6rem] leading-none font-black tracking-tight sm:text-[9rem]',
          cutting && 'is-cutting',
        )}
      >
        {/* Invisible copy keeps the layout size; the halves are overlaid on top */}
        <span className="invisible">URL</span>
        <span className="hero-cut-top absolute inset-0">URL</span>
        <span className="hero-cut-bottom absolute inset-0">URL</span>
        <span className="hero-cut-line absolute inset-x-0 top-1/2" />
        <Scissors />
      </div>
    </div>
  )
}

function Scissors() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 64 40"
      className="hero-cut-scissors absolute top-1/2 h-[0.45em] w-auto text-red-600 dark:text-red-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g className="hero-cut-blade-top">
        <circle cx="10" cy="9" r="6.5" />
        <path d="M15.5 12.5 30 20" />
        <path d="M28 18.5 62 17 30.5 21.5Z" fill="currentColor" strokeWidth="1.5" />
      </g>
      <g className="hero-cut-blade-bottom">
        <circle cx="10" cy="31" r="6.5" />
        <path d="M15.5 27.5 30 20" />
        <path d="M28 21.5 62 23 30.5 18.5Z" fill="currentColor" strokeWidth="1.5" />
      </g>
      <circle cx="30" cy="20" r="1.8" stroke="none" className="fill-zinc-50 dark:fill-zinc-950" />
    </svg>
  )
}
