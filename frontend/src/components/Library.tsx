import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Clock3,
  Play,
  Pause,
  Heart,
  Trash2,
  Check,
  ListMusic,
  Library as LibraryIcon,
  GripVertical,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { readTrackDuration } from '../store/trackMetadata';
import { formatDuration } from '../utils/time';
import { filterLibraryTracksByMode, sortLibraryTracks } from './libraryHelpers';

interface LibraryProps {
  useThemeAudioColors?: boolean;
  activeTab: 'library' | 'favorites' | 'playlist';
  setActiveTab: (tab: 'library' | 'favorites' | 'playlist') => void;
}

export const Library = ({ useThemeAudioColors = true, activeTab, setActiveTab }: LibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'recent' | 'title' | 'artist'>('recent');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [pendingRemoveTrackId, setPendingRemoveTrackId] = useState<string | null>(null);
  const [draggedPlaylistTrackId, setDraggedPlaylistTrackId] = useState<string | null>(null);
  const [dropTargetTrackId, setDropTargetTrackId] = useState<string | null>(null);
  const pendingDurationReadsRef = useRef(new Set<string>());
  const libraryTracks = usePlayerStore((state) => state.libraryTracks);
  const playlistTracks = usePlayerStore((state) => state.playlistTracks);
  const favoriteTrackIds = usePlayerStore((state) => state.favoriteTrackIds);
  const addSongs = usePlayerStore((state) => state.addSongs);
  const updateTrackMetadata = usePlayerStore((state) => state.updateTrackMetadata);
  const clearLibrary = usePlayerStore((state) => state.clearLibrary);
  const clearPlaylist = usePlayerStore((state) => state.clearPlaylist);
  const clearFavorites = usePlayerStore((state) => state.clearFavorites);
  const addToPlaylist = usePlayerStore((state) => state.addToPlaylist);
  const removeFromPlaylist = usePlayerStore((state) => state.removeFromPlaylist);
  const movePlaylistTrack = usePlayerStore((state) => state.movePlaylistTrack);
  const movePlaylistTrackToEnd = usePlayerStore((state) => state.movePlaylistTrackToEnd);
  const toggleTrackFavorite = usePlayerStore((state) => state.toggleTrackFavorite);
  const setTrack = usePlayerStore((state) => state.setTrack);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
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
  const queueActionButtonBaseClass =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full border px-0 text-[10px] font-black uppercase tracking-[0.24em] transition-all md:w-auto md:min-w-[6.5rem] md:px-3';
  const queueActionIconClass = 'shrink-0';

  const tabs = [
    { id: 'library' as const, label: 'Library', icon: LibraryIcon },
    { id: 'favorites' as const, label: 'Favorites', icon: Heart },
    { id: 'playlist' as const, label: 'Playlist', icon: ListMusic },
  ];

  const playlistTrackIdSet = new Set(playlistTracks.map((track) => track.id));
  const favoriteTrackIdSet = new Set(favoriteTrackIds);
  const sourceLibraryTracks = filterLibraryTracksByMode(
    libraryTracks,
    favoriteTrackIds,
    showFavoritesOnly,
    activeTab
  );

  useEffect(() => {
    let isActive = true;
    const tracksWithoutDuration = libraryTracks.filter(
      (track) => track.durationSeconds === undefined && (track.fileData || track.audioUrl)
    );

    tracksWithoutDuration.forEach((track) => {
      if (pendingDurationReadsRef.current.has(track.id)) return;

      pendingDurationReadsRef.current.add(track.id);
      const source = track.fileData || track.audioUrl;
      void readTrackDuration(source)
        .then((durationSeconds) => {
          if (isActive && durationSeconds !== undefined) {
            updateTrackMetadata(track.id, { durationSeconds });
          }
        })
        .catch(() => undefined)
        .finally(() => pendingDurationReadsRef.current.delete(track.id));
    });

    return () => {
      isActive = false;
    };
  }, [libraryTracks, updateTrackMetadata]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleLibraryTracks = sourceLibraryTracks.filter((track) => {
    if (!normalizedQuery) return true;

    return (
      track.title.toLowerCase().includes(normalizedQuery) ||
      track.artist.toLowerCase().includes(normalizedQuery)
    );
  });

  const librarySongs = sortLibraryTracks(
    visibleLibraryTracks,
    sortMode,
    favoriteTrackIds,
    activeTab
  );

  const currentPlaylistIndex = playlistTracks.findIndex((track) => track.id === currentTrack?.id);
  const upcomingPlaylistTracks =
    currentPlaylistIndex >= 0
      ? playlistTracks.slice(currentPlaylistIndex + 1, currentPlaylistIndex + 4)
      : playlistTracks.slice(0, 3);

  const playFirstTrack = () => {
    if (playlistTracks.length === 0) return;
    setTrack(playlistTracks[0]);
  };

  const playRandomTrack = () => {
    if (playlistTracks.length === 0) return;
    const randomIndex = Math.floor(Math.random() * playlistTracks.length);
    setTrack(playlistTracks[randomIndex]);
  };

  const handleLibraryTrackAdd = (track: (typeof libraryTracks)[number]) => {
    addToPlaylist(track);
    setPendingRemoveTrackId(null);
  };

  const handlePlayFavorites = () => {
    const tracks = libraryTracks.filter((track) => favoriteTrackIdSet.has(track.id));
    if (tracks.length === 0) return;

    clearPlaylist();
    tracks.forEach((track) => addToPlaylist(track));
    setTrack(tracks[0]);
  };

  const handleLibraryTrackPlay = (track: (typeof libraryTracks)[number], isSelected: boolean) => {
    clearPendingRemove();
    if (isSelected) {
      togglePlay();
    } else {
      setTrack(track);
    }
  };

  const clearPendingRemove = () => {
    setPendingRemoveTrackId(null);
  };

  const handlePlaylistDragStart = (event: React.DragEvent<HTMLDivElement>, trackId: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', trackId);
    setDraggedPlaylistTrackId(trackId);
  };

  const handlePlaylistDragOver = (event: React.DragEvent<HTMLDivElement>, trackId: string) => {
    event.preventDefault();
    if (draggedPlaylistTrackId) setDropTargetTrackId(trackId);
  };

  const handlePlaylistDrop = (event: React.DragEvent<HTMLDivElement>, trackId: string) => {
    event.preventDefault();
    const sourceTrackId = draggedPlaylistTrackId ?? event.dataTransfer.getData('text/plain');
    if (sourceTrackId) movePlaylistTrack(sourceTrackId, trackId);
    setDraggedPlaylistTrackId(null);
    setDropTargetTrackId(null);
  };

  const handlePlaylistDropToEnd = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const sourceTrackId = draggedPlaylistTrackId ?? event.dataTransfer.getData('text/plain');
    if (sourceTrackId) movePlaylistTrackToEnd(sourceTrackId);
    setDraggedPlaylistTrackId(null);
    setDropTargetTrackId(null);
  };

  const handlePlaylistKeyboardMove = (trackId: string, direction: 'up' | 'down') => {
    const trackIndex = playlistTracks.findIndex((track) => track.id === trackId);
    const targetIndex = direction === 'up' ? trackIndex - 1 : trackIndex + 1;

    if (trackIndex < 0 || targetIndex < 0 || targetIndex >= playlistTracks.length) return;
    movePlaylistTrack(trackId, playlistTracks[targetIndex].id);
  };

  const clearAction =
    activeTab === 'library'
      ? clearLibrary
      : activeTab === 'favorites'
        ? clearFavorites
        : clearPlaylist;
  const clearActionLabel =
    activeTab === 'library'
      ? 'Clear library'
      : activeTab === 'favorites'
        ? 'Clear favorites'
        : 'Clear playlist';
  const activeCount =
    activeTab === 'library'
      ? libraryTracks.length
      : activeTab === 'favorites'
        ? sourceLibraryTracks.length
        : playlistTracks.length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addSongs(Array.from(files));
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full animate-view-entry" onClick={clearPendingRemove}>
      {/* 1. CABECERA CON GLASSMORPHISM SUTIL */}
      <header className="p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-b from-[var(--glass-bg)] to-transparent">
        <div className="space-y-4">
          <div>
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-[var(--text-main)]">
              {activeTab === 'playlist'
                ? 'Playlist'
                : activeTab === 'favorites'
                  ? 'Favorites'
                  : 'Library'}
            </h2>
            <p className="text-[var(--text-muted)] font-medium mt-2 text-sm md:text-base uppercase tracking-widest">
              {activeCount} Tracks en{' '}
              {activeTab === 'playlist'
                ? 'playlist'
                : activeTab === 'favorites'
                  ? 'favoritos'
                  : 'biblioteca'}
            </p>
          </div>

          <div className="inline-flex rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1 shadow-[var(--glass-shadow)] backdrop-blur-xl">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    clearPendingRemove();
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm font-black tracking-wide transition-all ${
                    isActive
                      ? useThemeAudioColors
                        ? 'bg-[var(--accent-primary)] text-[var(--bg-main)] shadow-lg'
                        : 'bg-[var(--text-main)] text-[var(--bg-main)] shadow-lg'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'favorites' && favoriteTrackIds.length > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_24%,var(--glass-border))] bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">
              <Heart size={12} fill="currentColor" />
              <span>{favoriteTrackIds.length} guardados</span>
            </div>
          )}
        </div>

        <div className="flex w-full md:w-auto flex-wrap gap-3">
          {activeTab === 'favorites' && sourceLibraryTracks.length > 0 && (
            <button
              onClick={handlePlayFavorites}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.28em] shadow-xl transition-all hover:scale-[1.02] ${addMusicButtonClass}`}
            >
              <Play size={16} fill="currentColor" />
              <span>Play favorites</span>
            </button>
          )}

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

          {activeCount > 0 && (
            <button
              onClick={clearAction}
              title={clearActionLabel}
              aria-label={clearActionLabel}
              className={`p-3 rounded-full transition-all ${clearListButtonClass}`}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </header>

      {/* 2. LISTA DE CANCIONES */}
      <div className="px-4 md:px-10 flex-1">
        {activeTab !== 'playlist' ? (
          <>
            <div className="flex flex-col gap-4 px-4 pt-4 md:px-0 md:pt-6 md:flex-row md:items-center md:justify-between">
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 shadow-[var(--glass-shadow)] backdrop-blur-xl md:max-w-md md:flex-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                  Buscar
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Título o artista"
                  className="w-full bg-transparent text-sm font-semibold text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
                />
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {activeTab !== 'favorites' && (
                  <div className="inline-flex flex-wrap gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1 shadow-[var(--glass-shadow)] backdrop-blur-xl">
                    {[
                      { id: 'all' as const, label: 'Todos' },
                      { id: 'favorites' as const, label: 'Solo favoritos' },
                    ].map((option) => {
                      const isActive =
                        option.id === 'favorites' ? showFavoritesOnly : !showFavoritesOnly;

                      return (
                        <button
                          key={option.id}
                          onClick={() => setShowFavoritesOnly(option.id === 'favorites')}
                          className={`rounded-full px-3 py-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.28em] transition-all ${
                            isActive
                              ? useThemeAudioColors
                                ? 'bg-[var(--accent-primary)] text-[var(--bg-main)] shadow-lg'
                                : 'bg-[var(--text-main)] text-[var(--bg-main)] shadow-lg'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="inline-flex flex-wrap gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1 shadow-[var(--glass-shadow)] backdrop-blur-xl">
                  {[
                    { id: 'recent' as const, label: 'Recientes' },
                    { id: 'title' as const, label: 'Título' },
                    { id: 'artist' as const, label: 'Artista' },
                  ].map((option) => {
                    const isActive = sortMode === option.id;

                    return (
                      <button
                        key={option.id}
                        onClick={() => setSortMode(option.id)}
                        className={`rounded-full px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-[0.28em] transition-all ${
                          isActive
                            ? useThemeAudioColors
                              ? 'bg-[var(--accent-primary)] text-[var(--bg-main)] shadow-lg'
                              : 'bg-[var(--text-main)] text-[var(--bg-main)] shadow-lg'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cabecera de la tabla */}
            <div className="mt-4 grid grid-cols-[40px_1fr_auto] md:grid-cols-[50px_1fr_auto] gap-4 px-4 py-3 text-[var(--text-muted)] text-[10px] uppercase tracking-[0.3em] font-black border-b border-[var(--glass-border)]">
              <span className="text-center">#</span>
              <span>Título / Artista</span>
              <span className="hidden md:flex justify-end pr-4 text-sm font-mono">
                <Clock3 size={14} />
              </span>
              <span className="hidden md:block" />
            </div>

            {/* LISTADO: El padding inferior 'pb-72' asegura que el scroll no choque con la PlayerBar + MobileTabs */}
            <div className="flex flex-col mt-4 gap-1 pb-72 md:pb-40">
              {libraryTracks.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-[var(--glass-border)] rounded-[40px] flex flex-col items-center gap-4">
                  <p className="text-[var(--text-muted)] font-medium">
                    Sube archivos MP3 para empezar.
                  </p>
                </div>
              ) : (activeTab === 'favorites' || showFavoritesOnly) &&
                sourceLibraryTracks.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-[var(--glass-border)] rounded-[40px] flex flex-col items-center gap-5 bg-[var(--glass-bg)]/70">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] text-[var(--accent-primary)] shadow-[0_18px_38px_rgba(0,0,0,0.12)]">
                    <Heart size={28} fill="currentColor" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-black tracking-tight text-[var(--text-main)]">
                      {activeTab === 'favorites'
                        ? 'Tu lista de favoritos está vacía'
                        : 'No tienes favoritos en esta vista'}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {activeTab === 'favorites'
                        ? 'Marca tus pistas con el corazón para guardarlas aquí.'
                        : 'Activa la vista de favoritos para concentrarte en tus pistas guardadas.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('library')}
                    className="rounded-full bg-[var(--accent-primary)] px-5 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-[var(--bg-main)] shadow-lg transition-all hover:scale-[1.02]"
                  >
                    {activeTab === 'favorites' ? 'Ir a la biblioteca' : 'Volver a la biblioteca'}
                  </button>
                </div>
              ) : visibleLibraryTracks.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-[var(--glass-border)] rounded-[40px] flex flex-col items-center gap-4">
                  <p className="text-[var(--text-muted)] font-medium">
                    No hay resultados para esa búsqueda.
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-[var(--text-main)] transition-all hover:scale-105"
                  >
                    Limpiar filtro
                  </button>
                </div>
              ) : (
                librarySongs.map((track, index) => {
                  const isSelected = currentTrack?.id === track.id;
                  const isInPlaylist = playlistTrackIdSet.has(track.id);
                  const isFavorite = favoriteTrackIds.includes(track.id);

                  return (
                    <div
                      key={track.id}
                      role="group"
                      aria-label={`${track.title} by ${track.artist}`}
                      onClick={() => {
                        handleLibraryTrackPlay(track, isSelected);
                      }}
                      className={`group grid grid-cols-[32px_minmax(0,1fr)_auto] md:grid-cols-[50px_minmax(0,1fr)_auto] items-center gap-3 md:gap-4 px-3 md:px-4 py-3 rounded-2xl transition-all border border-transparent cursor-pointer ${
                        isSelected
                          ? `${selectedRowClass} border-l-[3px] shadow-[0_8px_24px_color-mix(in_srgb,var(--accent-primary)_10%,transparent)]`
                          : 'hover:bg-[var(--glass-bg)] hover:-translate-y-px'
                      }`}
                    >
                      {/* Número / Indicador */}
                      <button
                        type="button"
                        aria-label={
                          isSelected && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          handleLibraryTrackPlay(track, isSelected);
                        }}
                        className="flex justify-center items-center relative w-6 h-6 mx-auto rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
                      >
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
                      </button>

                      {/* Info Canción */}
                      <div className="flex items-center gap-4 overflow-hidden">
                        <img
                          src={track.coverUrl}
                          loading="lazy"
                          decoding="async"
                          className={`h-12 w-12 rounded-xl object-cover bg-white/5 border transition-all ${
                            isSelected
                              ? 'border-[var(--accent-primary)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_14%,transparent)]'
                              : 'border-[var(--glass-border)] group-hover:border-[var(--accent-secondary)]/40'
                          }`}
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
                            {track.album ? ` · ${track.album}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 md:gap-3">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!isInPlaylist) {
                              clearPendingRemove();
                              handleLibraryTrackAdd(track);
                              return;
                            }

                            if (pendingRemoveTrackId === track.id) {
                              removeFromPlaylist(track.id);
                              clearPendingRemove();
                              return;
                            }

                            setPendingRemoveTrackId(track.id);
                          }}
                          onKeyDown={(event) => event.stopPropagation()}
                          type="button"
                          title={
                            !isInPlaylist
                              ? `Add ${track.title} to playlist`
                              : pendingRemoveTrackId === track.id
                                ? `Remove ${track.title} from playlist`
                                : `Tap again to remove ${track.title}`
                          }
                          aria-label={
                            !isInPlaylist
                              ? `Add ${track.title} to playlist`
                              : pendingRemoveTrackId === track.id
                                ? `Remove ${track.title} from playlist`
                                : `Tap again to remove ${track.title}`
                          }
                          className={`${queueActionButtonBaseClass} ${
                            isInPlaylist
                              ? useThemeAudioColors
                                ? pendingRemoveTrackId === track.id
                                  ? 'border-[color-mix(in_srgb,var(--accent-secondary)_42%,transparent)] bg-[color-mix(in_srgb,var(--accent-secondary)_20%,var(--bg-main))] text-[var(--accent-light)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-secondary)_24%,transparent)]'
                                  : 'border-[color-mix(in_srgb,var(--accent-secondary)_28%,transparent)] bg-[color-mix(in_srgb,var(--accent-secondary)_12%,var(--bg-main))] text-[var(--accent-secondary)] hover:bg-[color-mix(in_srgb,var(--accent-secondary)_16%,var(--bg-main))]'
                                : 'cursor-default border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--text-main)_10%,var(--bg-main))] text-[var(--text-main)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--text-main)_10%,transparent)]'
                              : useThemeAudioColors
                                ? 'border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_18%,var(--bg-main))] text-[var(--accent-secondary)] hover:bg-[color-mix(in_srgb,var(--accent-primary)_22%,var(--bg-main))]'
                                : 'border-blue-500/20 bg-[color-mix(in_srgb,theme(colors.blue.500)_14%,var(--bg-main))] text-blue-300 hover:bg-[color-mix(in_srgb,theme(colors.blue.500)_20%,var(--bg-main))]'
                          }`}
                        >
                          {isInPlaylist && pendingRemoveTrackId === track.id ? (
                            <X size={12} strokeWidth={3} className={queueActionIconClass} />
                          ) : isInPlaylist ? (
                            <Check size={12} strokeWidth={3} className={queueActionIconClass} />
                          ) : (
                            <Plus size={12} strokeWidth={3} className={queueActionIconClass} />
                          )}
                          <span className="hidden md:inline">
                            {!isInPlaylist
                              ? 'Add'
                              : pendingRemoveTrackId === track.id
                                ? 'Remove'
                                : 'In queue'}
                          </span>
                        </button>

                        <span className="min-w-16 whitespace-nowrap text-right text-[10px] font-mono tabular-nums tracking-tighter text-[var(--text-muted)] md:min-w-20 md:text-sm">
                          {formatDuration(track.durationSeconds)}
                        </span>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleTrackFavorite(track.id);
                          }}
                          onKeyDown={(event) => event.stopPropagation()}
                          type="button"
                          aria-label={
                            isFavorite
                              ? `Remove ${track.title} from favorites`
                              : `Add ${track.title} to favorites`
                          }
                          aria-pressed={isFavorite}
                          className={`flex h-9 w-9 items-center justify-center rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] ${
                            isFavorite
                              ? selectedHeartClass
                              : 'text-[var(--text-muted)] md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500'
                          }`}
                        >
                          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="pb-72 md:pb-40">
            <div className="flex flex-col gap-4 px-4 py-3 border-b border-[var(--glass-border)] md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-[var(--text-muted)]">
                  Playlist
                </p>
                <p className="text-sm text-[var(--text-main)] font-semibold mt-1">
                  Cola optimizada sin miniaturas para reducir carga visual.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={playFirstTrack}
                  disabled={playlistTracks.length === 0}
                  className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] transition-all ${
                    playlistTracks.length === 0
                      ? 'cursor-not-allowed border border-[var(--glass-border)] text-[var(--text-muted)] opacity-50'
                      : useThemeAudioColors
                        ? 'bg-[var(--accent-primary)] text-[var(--bg-main)] shadow-lg hover:scale-105'
                        : 'bg-[var(--text-main)] text-[var(--bg-main)] shadow-lg hover:scale-105'
                  }`}
                >
                  Play queue
                </button>
                <button
                  onClick={playRandomTrack}
                  disabled={playlistTracks.length === 0}
                  className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] transition-all ${
                    playlistTracks.length === 0
                      ? 'cursor-not-allowed border-[var(--glass-border)] text-[var(--text-muted)] opacity-50'
                      : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-main)] hover:scale-105'
                  }`}
                >
                  Shuffle
                </button>
                <button
                  onClick={clearPlaylist}
                  disabled={playlistTracks.length === 0}
                  className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] transition-all ${
                    playlistTracks.length === 0
                      ? 'cursor-not-allowed border-[var(--glass-border)] text-[var(--text-muted)] opacity-50'
                      : useThemeAudioColors
                        ? 'border-[color-mix(in_srgb,var(--accent-secondary)_24%,transparent)] bg-[color-mix(in_srgb,var(--accent-secondary)_12%,var(--bg-main))] text-[var(--accent-light)] hover:scale-105 hover:bg-[color-mix(in_srgb,var(--accent-secondary)_16%,var(--bg-main))]'
                        : 'border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--text-main)_10%,var(--bg-main))] text-[var(--text-main)] hover:scale-105 hover:bg-[color-mix(in_srgb,var(--text-main)_14%,var(--bg-main))]'
                  }`}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid gap-3 px-4 pt-4 md:grid-cols-[1fr_0.8fr]">
              <div className="rounded-[28px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 shadow-[var(--glass-shadow)] backdrop-blur-xl">
                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-[var(--text-muted)]">
                  Queue stats
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-4">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                      Tracks
                    </p>
                    <p className="mt-2 text-2xl font-black text-[var(--text-main)]">
                      {playlistTracks.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-4">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                      Current
                    </p>
                    <p className="mt-2 text-2xl font-black text-[var(--text-main)]">
                      {currentPlaylistIndex >= 0 ? currentPlaylistIndex + 1 : 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-4">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                      Up next
                    </p>
                    <p className="mt-2 text-2xl font-black text-[var(--text-main)]">
                      {Math.max(0, playlistTracks.length - currentPlaylistIndex - 1)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-[var(--glass-border)] px-4 py-3 text-sm text-[var(--text-muted)]">
                  {currentTrack
                    ? `Ahora suena ${currentTrack.title} y la cola avanza con las siguientes pistas.`
                    : 'La playlist está lista para reproducirse de principio a fin o en modo shuffle.'}
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 shadow-[var(--glass-shadow)] backdrop-blur-xl">
                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-[var(--text-muted)]">
                  Up next
                </p>
                <div className="mt-4 space-y-2">
                  {upcomingPlaylistTracks.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[var(--glass-border)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                      No hay más pistas en la cola.
                    </p>
                  ) : (
                    upcomingPlaylistTracks.map((track, index) => (
                      <div
                        key={track.id}
                        className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-left transition-all hover:bg-[var(--bg-elevated)]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[11px] font-black text-[var(--text-muted)]">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[var(--text-main)]">
                            {track.title}
                          </p>
                          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 px-4">
              {playlistTracks.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-[var(--glass-border)] rounded-[40px] flex flex-col items-center gap-4">
                  <p className="text-[var(--text-muted)] font-medium">
                    La playlist todavía no tiene pistas.
                  </p>
                </div>
              ) : (
                playlistTracks.map((track) => {
                  const isSelected = currentTrack?.id === track.id;
                  const isDropTarget = dropTargetTrackId === track.id;

                  return (
                    <div
                      key={track.id}
                      draggable
                      onClick={() => (isSelected ? togglePlay() : setTrack(track))}
                      onDragStart={(event) => handlePlaylistDragStart(event, track.id)}
                      onDragOver={(event) => handlePlaylistDragOver(event, track.id)}
                      onDrop={(event) => handlePlaylistDrop(event, track.id)}
                      onDragEnd={() => {
                        setDraggedPlaylistTrackId(null);
                        setDropTargetTrackId(null);
                      }}
                      className={`group grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all cursor-grab active:cursor-grabbing ${
                        isSelected
                          ? selectedRowClass
                          : isDropTarget
                            ? 'border-[var(--glass-border)] bg-[var(--glass-bg)]'
                            : 'border-transparent hover:bg-[var(--glass-bg)]'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[11px] font-black text-[var(--text-muted)]">
                          <GripVertical size={14} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={
                              playlistTracks.findIndex((item) => item.id === track.id) === 0
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              handlePlaylistKeyboardMove(track.id, 'up');
                            }}
                            aria-label={`Move ${track.title} up`}
                            className="rounded p-0.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] disabled:invisible"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            type="button"
                            disabled={
                              playlistTracks.findIndex((item) => item.id === track.id) ===
                              playlistTracks.length - 1
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              handlePlaylistKeyboardMove(track.id, 'down');
                            }}
                            aria-label={`Move ${track.title} down`}
                            className="rounded p-0.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] disabled:invisible"
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-bold ${
                            isSelected ? selectedAccentClass : 'text-[var(--text-main)]'
                          }`}
                        >
                          {track.title}
                        </p>
                        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">
                          {track.artist}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        {isSelected ? (
                          <span className="rounded-full border border-[var(--glass-border)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]">
                            Playing
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono">--:--</span>
                        )}
                      </div>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          removeFromPlaylist(track.id);
                        }}
                        title={`Remove ${track.title} from playlist`}
                        aria-label={`Remove ${track.title} from playlist`}
                        className={`${queueActionButtonBaseClass} border-transparent text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500`}
                      >
                        <X size={12} strokeWidth={3} className={queueActionIconClass} />
                        Remove
                      </button>
                    </div>
                  );
                })
              )}

              {playlistTracks.length > 0 && (
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handlePlaylistDropToEnd}
                  className="mt-2 rounded-2xl border border-dashed border-[var(--glass-border)] px-4 py-4 text-center text-xs font-black uppercase tracking-[0.28em] text-[var(--text-muted)] transition-all hover:bg-[var(--glass-bg)]"
                >
                  Drop here to move track to the end
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
