export function NowPlayingCard() {
  return (
    <article className="now-playing-card">
      <header>
        <p className="eyebrow">Now Playing</p>
        <h1>Musie</h1>
      </header>

      <div className="cover" role="img" aria-label="Album cover placeholder" />

      <div className="track-meta">
        <h2>Sin pista cargada</h2>
        <p>Importa canciones para empezar a reproducir.</p>
      </div>

      <div className="controls" aria-label="Playback controls">
        <button type="button">Prev</button>
        <button type="button">Play</button>
        <button type="button">Next</button>
      </div>
    </article>
  )
}
