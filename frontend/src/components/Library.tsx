import { Plus, Clock3, Play, Pause, Heart, Trash2 } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

export const Library = () => {
  const { songs, addSongs, clearSongs, setTrack, currentTrack, isPlaying, togglePlay } =
    usePlayerStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addSongs(Array.from(files));
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700">
      {/* 1. CABECERA RESPONSIVA */}
      <header className="p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-b from-blue-900/10 to-transparent">
        <div>
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white">Library</h2>
          <p className="text-gray-500 font-medium mt-2 text-sm md:text-base">
            {songs.length} canciones guardadas en tu base de datos local
          </p>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <label className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold cursor-pointer hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95">
            <Plus size={20} strokeWidth={3} />
            <span className="text-sm md:text-base">Add Music</span>
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
              className="p-4 text-red-500 bg-red-500/10 rounded-full hover:bg-red-500/20 border border-red-500/20 transition-all"
              title="Limpiar biblioteca"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </header>

      {/* 2. TABLA DE CANCIONES */}
      <div className="px-4 md:px-10 flex-1">
        {/* Cabecera de columnas (Oculta en móvil la duración) */}
        <div className="grid grid-cols-[40px_1fr_40px] md:grid-cols-[50px_1fr_120px_50px] gap-4 px-4 py-3 text-gray-600 text-sm uppercase tracking-[0.3em] font-black border-b border-white/5">
          <span className="text-center">#</span>
          <span>Título / Artista</span>
          <span className="hidden md:flex justify-end pr-4">
            <Clock3 size={14} />
          </span>
          <span></span>
        </div>

        {/* LISTA DE PISTAS */}
        <div className="flex flex-col mt-4 gap-1">
          {songs.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
                <Plus size={32} />
              </div>
              <p className="text-gray-500 font-medium">
                Tu biblioteca está vacía.
                <br />
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
                  className={`group grid grid-cols-[40px_1fr_40px] md:grid-cols-[50px_1fr_120px_50px] items-center gap-4 px-4 py-3 rounded-2xl transition-all border border-transparent ${
                    isSelected
                      ? 'bg-blue-600/15 border-white/5 shadow-inner'
                      : 'hover:bg-white/5 active:bg-white/10'
                  }`}
                >
                  {/* INDICADOR DINÁMICO (El que se perdió antes) */}
                  <div className="flex justify-center items-center relative w-6 h-6 mx-auto">
                    {/* Caso 1: Sonando (Barritas) */}
                    {isSelected && isPlaying ? (
                      <div className="flex gap-0.5 items-end h-3 group-hover:opacity-0 transition-opacity">
                        <div className="w-1 bg-blue-500 animate-bounce [animation-duration:0.6s]" />
                        <div className="w-1 bg-blue-500 animate-bounce [animation-duration:0.9s]" />
                        <div className="w-1 bg-blue-500 animate-bounce [animation-duration:0.7s]" />
                      </div>
                    ) : (
                      /* Caso 2: Número normal */
                      <span
                        className={`text-xs font-mono transition-opacity ${
                          isSelected
                            ? 'text-blue-400 font-bold'
                            : 'text-gray-600 group-hover:opacity-0'
                        }`}
                      >
                        {index + 1}
                      </span>
                    )}

                    {/* Botón Play/Pause (Aparece en hover o si está seleccionado) */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${isSelected ? 'opacity-100' : ''}`}
                    >
                      {isSelected && isPlaying ? (
                        <Pause size={16} fill="currentColor" className="text-blue-400" />
                      ) : (
                        <Play
                          size={16}
                          fill="currentColor"
                          className={isSelected ? 'text-blue-400' : 'text-white'}
                        />
                      )}
                    </div>
                  </div>

                  {/* INFO DE CANCIÓN */}
                  <div className="flex items-center gap-4 overflow-hidden">
                    <img
                      src={track.coverUrl}
                      className="w-12 h-12 md:w-11 md:h-11 rounded-xl object-cover bg-white/5 shadow-lg border border-white/5"
                      alt=""
                    />
                    <div className="truncate">
                      <p
                        className={`text-sm md:text-base font-bold truncate ${isSelected ? 'text-blue-400' : 'text-white'}`}
                      >
                        {track.title}
                      </p>
                      <p className="text-[10px] md:text-[11px] text-gray-500 font-semibold uppercase tracking-widest truncate group-hover:text-gray-400 transition-colors">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* DURACIÓN (Solo Desktop) */}
                  <span className="hidden md:block text-xs text-gray-500 font-mono text-right pr-4 tracking-tighter">
                    --:--
                  </span>

                  {/* BOTÓN FAVORITO */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); /* lógica favoritos */
                    }}
                    className={`flex justify-end transition-all ${isSelected ? 'text-blue-400 opacity-100' : 'text-gray-700 opacity-0 group-hover:opacity-100 hover:text-red-500'}`}
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
