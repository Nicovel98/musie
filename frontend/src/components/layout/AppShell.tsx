import { useMemo, useState } from 'react'
import { LibraryPanel } from '../library/LibraryPanel'
import { QueuePanel } from '../library/QueuePanel'
import { NowPlayingCard } from '../player/NowPlayingCard'

type ScreenKey = 'library' | 'player' | 'queue'

export function AppShell() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>('player')

  const screenTitle = useMemo(() => {
    if (activeScreen === 'library') return 'Library'
    if (activeScreen === 'queue') return 'Queue'
    return 'Now Playing'
  }, [activeScreen])

  return (
    <main className="app-shell-wrap">
      <header className="mobile-header" aria-label="Current screen">
        <p className="mobile-header-eyebrow">Musie</p>
        <h1>{screenTitle}</h1>
      </header>

      <nav className="mobile-nav" aria-label="Primary navigation">
        <button
          type="button"
          className={activeScreen === 'library' ? 'is-active' : ''}
          onClick={() => setActiveScreen('library')}
        >
          Library
        </button>
        <button
          type="button"
          className={activeScreen === 'player' ? 'is-active' : ''}
          onClick={() => setActiveScreen('player')}
        >
          Player
        </button>
        <button
          type="button"
          className={activeScreen === 'queue' ? 'is-active' : ''}
          onClick={() => setActiveScreen('queue')}
        >
          Queue
        </button>
      </nav>

      <section
        className={`mobile-screen mobile-screen-library ${activeScreen === 'library' ? 'is-visible' : ''}`}
      >
        <aside className="panel panel-library" aria-label="Library">
          <LibraryPanel />
        </aside>
      </section>

      <section
        className={`mobile-screen mobile-screen-player ${activeScreen === 'player' ? 'is-visible' : ''}`}
      >
        <section className="panel panel-player" aria-label="Now playing">
          <NowPlayingCard />
        </section>
      </section>

      <section
        className={`mobile-screen mobile-screen-queue ${activeScreen === 'queue' ? 'is-visible' : ''}`}
      >
        <aside className="panel panel-queue" aria-label="Queue">
          <QueuePanel />
        </aside>
      </section>

      <section className="app-shell" aria-label="Desktop layout">
        <aside className="panel panel-library" aria-label="Library">
          <LibraryPanel />
        </aside>

        <section className="panel panel-player" aria-label="Now playing">
          <NowPlayingCard />
        </section>

        <aside className="panel panel-queue" aria-label="Queue">
          <QueuePanel />
        </aside>
      </section>
    </main>
  )
}
