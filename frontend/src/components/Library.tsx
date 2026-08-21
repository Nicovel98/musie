import { useState } from 'react';
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
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

import type { Track } from '../types/track';

interface LibraryProps {
  useThemeAudioColors?: boolean;
  activeTab: 'library' | 'favorites' | 'playlist';
  setActiveTab: (tab: 'library' | 'favorites' | 'playlist') => void;
}

export const filterLibraryTracksByMode = (
  tracks: readonly Track[],
  favoriteTrackIds: string[],
  showFavoritesOnly: boolean,
  activeTab: 'library' | 'favorites' | 'playlist'
) => {
  if (activeTab === 'favorites' || showFavoritesOnly) {
    return tracks.filter((track) => favoriteTrackIds.includes(track.id));
  }

  return tracks;
};

export const sortLibraryTracks = <T extends Track>(
  tracks: readonly T[],
  sortMode: 'recent' | 'title' | 'artist',
  favoriteTrackIds: string[],
  activeTab: 'library' | 'favorites' | 'playlist'
) => {
  const sortedTracks = [...tracks];

  if (sortMode === 'title') {
    return sortedTracks.sort((left, right) => left.title.localeCompare(right.title));
  }

  if (sortMode === 'artist') {
    return sortedTracks.sort((left, right) => left.artist.localeCompare(right.artist));
  }

  if (sortMode === 'recent') {
    if (activeTab === 'favorites') {
      const favoriteIndexMap = new Map(
        favoriteTrackIds.map((favoriteTrackId, index) => [favoriteTrackId, index])
      );

      return sortedTracks.sort((left, right) => {
        const leftIndex = favoriteIndexMap.get(left.id) ?? -1;
        const rightIndex = favoriteIndexMap.get(right.id) ?? -1;

        if (leftIndex === rightIndex) return 0;
        if (leftIndex === -1) return 1;
        if (rightIndex === -1) return -1;
        return rightIndex - leftIndex;
      });
    }

    return sortedTracks.sort((left, right) => {
      const leftIndex = tracks.findIndex((track) => track.id === left.id);
      const rightIndex = tracks.findIndex((track) => track.id === right.id);
      return rightIndex - leftIndex;
    });
  }

  return sortedTracks;
};

export const Library = ({ useThemeAudioColors = true, activeTab, setActiveTab }: LibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'recent' | 'title' | 'artist'>('recent');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [pendingRemoveTrackId, setPendingRemoveTrackId] = useState<string | null>(null);
  const [draggedPlaylistTrackId, setDraggedPlaylistTrackId] = useState<string | null>(null);
  const [dropTargetTrackId, setDropTargetTrackId] = useState<string | null>(null);
  const libraryTracks = usePlayerStore((state) => state.libraryTracks);
  const playlistTracks = usePlayerStore((state) => state.playlistTracks);
  const favoriteTrackIds = usePlayerStore((state) => state.favoriteTrackIds);
  const addSongs = usePlayerStore((state) => state.addSongs);
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
    'inline-flex h-9 min-w-[6.5rem] items-center justify-center gap-2 rounded-full border px-3 text-[10px] font-black uppercase tracking-[0.24em] transition-all';
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
            <div className="mt-4 grid grid-cols-[40px_1fr_40px] md:grid-cols-[50px_1fr_120px_50px] gap-4 px-4 py-3 text-[var(--text-muted)] text-[10px] uppercase tracking-[0.3em] font-black border-b border-[var(--glass-border)]">
              <span className="text-center">#</span>
              <span>Título / Artista</span>
              <span className="hidden md:flex justify-end pr-4 text-sm font-mono">
                <Clock3 size={14} />
              </span>
              <span></span>
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
                      onClick={() => {
                        clearPendingRemove();
                        if (isSelected) {
                          togglePlay();
                        } else {
                          setTrack(track);
                        }
                      }}
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
                          loading="lazy"
                          decoding="async"
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
                        {!isInPlaylist
                          ? 'Add'
                          : pendingRemoveTrackId === track.id
                            ? 'Remove'
                            : 'In queue'}
                      </button>

                      {/* Duración (Mono y grande como pediste) */}
                      <span className="hidden md:block text-sm font-mono text-right pr-4 tracking-tighter text-[var(--text-muted)]">
                        --:--
                      </span>

                      {/* Favorito */}
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleTrackFavorite(track.id);
                        }}
                        type="button"
                        aria-label={
                          isFavorite
                            ? `Remove ${track.title} from favorites`
                            : `Add ${track.title} to favorites`
                        }
                        aria-pressed={isFavorite}
                        className={`flex justify-end transition-all ${
                          isFavorite
                            ? selectedHeartClass
                            : 'text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-red-500'
                        }`}
                      >
                        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                      </button>
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
                      className={`group grid grid-cols-[42px_1fr_auto_auto] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all cursor-grab active:cursor-grabbing ${
                        isSelected
                          ? selectedRowClass
                          : isDropTarget
                            ? 'border-[var(--glass-border)] bg-[var(--glass-bg)]'
                            : 'border-transparent hover:bg-[var(--glass-bg)]'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[11px] font-black text-[var(--text-muted)]">
                        <GripVertical size={14} />
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
