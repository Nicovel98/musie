const queueItems = ['In Circles', 'Signals', 'The Spine']

export function QueuePanel() {
  return (
    <section>
      <header className="section-header">
        <h2>Queue</h2>
        <button type="button">Clear</button>
      </header>

      <ol className="queue-list" aria-label="Playback queue">
        {queueItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  )
}
