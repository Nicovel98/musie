import { Plus, Clock3, Play, Pause, Heart, Trash2 } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

interface LibraryProps {
  useThemeAudioColors?: boolean;
}

export const Library = ({ useThemeAudioColors = true }: LibraryProps) => {
  const { songs, addSongs, clearSongs, setTrack, currentTrack, isPlaying, togglePlay } =
    usePlayerStore();
  const addMusicButtonClass = useThemeAudioColors
    ? 'bg-[var(--accent-primary)] text-[var(--bg-main)] hover:bg-[var(--accent-secondary)]'
    : 'bg-[var(--text-main)] text-[var(--bg-main)]';
  const clearListButtonClass = useThemeAudioColors
    ? 'text-[var(--accent-secondary)] bg-[var(--accent-secondary)]/12 hover:bg-[var(--accent-secondary)]/22 border border-[var(--accent-secondary)]/24'
    : 'text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20';
  const selectedRowClass = useThemeAudioColors
    ? 'bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] border-[var(--glass-border)]'
    : 'bg-blue-600/10 border-[var(--glass-border)]';
  const selectedAccentClass = useThemeAudioColors
    ? 'text-[var(--accent-primary)]'
    : 'text-blue-500';
  const selectedHeartClass = useThemeAudioColors
    ? 'text-[var(--accent-secondary)]'
    : 'text-blue-500';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addSongs(Array.from(files));
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full animate-view-entry">
      {/* 1. CABECERA CON GLASSMORPHISM SUTIL */}
      <header className="p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-b from-[var(--glass-bg)] to-transparent">
        <div>
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-[var(--text-main)]">
            Library
          </h2>
          <p className="text-[var(--text-muted)] font-medium mt-2 text-sm md:text-base uppercase tracking-widest">
            {songs.length} Tracks en el dispositivo
          </p>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <label
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-black cursor-pointer hover:scale-105 transition-all shadow-xl active:scale-95 ${addMusicButtonClass}`}
          >
            <Plus size={18} strokeWidth={3} />
            <span>ADD MUSIC</span>
            <input
              type="file"
              multiple
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          {songs.length > 0 && (
            <button
              onClick={clearSongs}
              className={`p-3 rounded-full transition-all ${clearListButtonClass}`}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </header>

      {/* 2. LISTA DE CANCIONES */}
      <div className="px-4 md:px-10 flex-1">
        {/* Cabecera de la tabla */}
        <div className="grid grid-cols-[40px_1fr_40px] md:grid-cols-[50px_1fr_120px_50px] gap-4 px-4 py-3 text-[var(--text-muted)] text-[10px] uppercase tracking-[0.3em] font-black border-b border-[var(--glass-border)]">
          <span className="text-center">#</span>
          <span>Título / Artista</span>
          <span className="hidden md:flex justify-end pr-4 text-sm font-mono">
            <Clock3 size={14} />
          </span>
          <span></span>
        </div>

        {/* LISTADO: El padding inferior 'pb-72' asegura que el scroll no choque con la PlayerBar + MobileTabs */}
        <div className="flex flex-col mt-4 gap-1 pb-72 md:pb-40">
          {songs.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-[var(--glass-border)] rounded-[40px] flex flex-col items-center gap-4">
              <p className="text-[var(--text-muted)] font-medium">
                Sube archivos MP3 para empezar.
              </p>
            </div>
          ) : (
            songs.map((track, index) => {
              const isSelected = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => (isSelected ? togglePlay() : setTrack(track))}
                  className={`group grid grid-cols-[40px_1fr_40px] md:grid-cols-[50px_1fr_120px_50px] items-center gap-4 px-4 py-3 rounded-2xl transition-all border border-transparent cursor-pointer ${
                    isSelected ? selectedRowClass : 'hover:bg-[var(--glass-bg)]'
                  }`}
                >
                  {/* Número / Indicador */}
                  <div className="flex justify-center items-center relative w-6 h-6 mx-auto">
                    {isSelected && isPlaying ? (
                      <div className="flex gap-0.5 items-end h-3 group-hover:opacity-0 transition-opacity">
                        <div
                          className={`w-1 animate-bounce [animation-duration:0.6s] ${
                            useThemeAudioColors ? 'bg-[var(--accent-primary)]' : 'bg-blue-500'
                          }`}
                        />
                        <div
                          className={`w-1 animate-bounce [animation-duration:0.9s] ${
                            useThemeAudioColors ? 'bg-[var(--accent-primary)]' : 'bg-blue-500'
                          }`}
                        />
                        <div
                          className={`w-1 animate-bounce [animation-duration:0.7s] ${
                            useThemeAudioColors ? 'bg-[var(--accent-primary)]' : 'bg-blue-500'
                          }`}
                        />
                      </div>
                    ) : (
                      <span
                        className={`text-xs font-mono transition-opacity ${
                          isSelected
                            ? selectedAccentClass
                            : 'text-[var(--text-muted)] group-hover:opacity-0'
                        }`}
                      >
                        {index + 1}
                      </span>
                    )}
                    <div
                      className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 ${isSelected ? 'opacity-100' : ''}`}
                    >
                      {isSelected && isPlaying ? (
                        <Pause size={16} fill="currentColor" />
                      ) : (
                        <Play size={16} fill="currentColor" />
                      )}
                    </div>
                  </div>

                  {/* Info Canción */}
                  <div className="flex items-center gap-4 overflow-hidden">
                    <img
                      src={track.coverUrl}
                      className="w-12 h-12 md:w-11 md:h-11 rounded-xl object-cover bg-white/5 border border-[var(--glass-border)]"
                      alt=""
                    />
                    <div className="truncate">
                      <p
                        className={`text-sm md:text-base font-bold truncate ${
                          isSelected ? selectedAccentClass : 'text-[var(--text-main)]'
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-[10px] md:text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-widest truncate group-hover:text-[var(--text-main)] transition-colors">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* Duración (Mono y grande como pediste) */}
                  <span className="hidden md:block text-sm font-mono text-right pr-4 tracking-tighter text-[var(--text-muted)]">
                    --:--
                  </span>

                  {/* Favorito */}
                  <button
                    className={`flex justify-end transition-all ${
                      isSelected
                        ? selectedHeartClass
                        : 'text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-red-500'
                    }`}
                  >
                    <Heart size={18} fill={isSelected ? 'currentColor' : 'none'} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
