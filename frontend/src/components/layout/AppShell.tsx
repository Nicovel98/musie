import { LibraryPanel } from '../library/LibraryPanel'
import { QueuePanel } from '../library/QueuePanel'
import { NowPlayingCard } from '../player/NowPlayingCard'

export function AppShell() {
  return (
    <main className="app-shell">
      <aside className="panel panel-library" aria-label="Library">
        <LibraryPanel />
      </aside>

      <section className="panel panel-player" aria-label="Now playing">
        <NowPlayingCard />
      </section>

      <aside className="panel panel-queue" aria-label="Queue">
        <QueuePanel />
      </aside>
    </main>
  )
}
