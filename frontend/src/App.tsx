import { useState } from 'react'
import { Link2 } from 'lucide-react'
import { Toaster } from 'sonner'
import { HeroCut } from './components/HeroCut'
import { ShortenForm } from './components/ShortenForm'
import { ResultCard } from './components/ResultCard'
import { RecentLinks } from './components/RecentLinks'
import { ThemeToggle } from './components/ThemeToggle'
import { useRecentLinks, type RecentLink } from './hooks/useRecentLinks'
import { useTheme } from './hooks/useTheme'

function App() {
  const { links, add, remove, clear } = useRecentLinks()
  const [latest, setLatest] = useState<RecentLink | null>(null)
  const [cutCount, setCutCount] = useState(0)
  const { theme, toggle } = useTheme()

  const handleCreated = (link: RecentLink) => {
    add(link)
    setLatest(link)
    setCutCount((c) => c + 1)
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-red-600 text-white shadow-sm">
            <Link2 className="size-4.5" />
          </span>
          URL Shortener
        </a>
        <ThemeToggle theme={theme} onToggle={toggle} />
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 pt-4 pb-16 sm:px-6 sm:pt-8">
        <HeroCut key={cutCount} cutting={cutCount > 0} />

        <ShortenForm onCreated={handleCreated} />
        {latest && <ResultCard key={latest.shortUrl} link={latest} onDismiss={() => setLatest(null)} />}
        <RecentLinks links={links} onRemove={remove} onClear={clear} />
      </main>

      <Toaster position="bottom-center" theme={theme} richColors />
    </div>
  )
}

export default App
