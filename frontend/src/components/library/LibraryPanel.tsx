const sampleTracks = [
  { title: 'Transistor - In Circles', artist: 'Red' },
  { title: 'Transistor - Signals', artist: 'Red' },
  { title: 'Transistor - The Spine', artist: 'Red' },
]

export function LibraryPanel() {
  return (
    <section>
      <header className="section-header">
        <h2>Library</h2>
        <button type="button">Import</button>
      </header>

      <ul className="track-list" aria-label="Track list">
        {sampleTracks.map((track) => (
          <li key={track.title} className="track-item">
            <p>{track.title}</p>
            <span>{track.artist}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
