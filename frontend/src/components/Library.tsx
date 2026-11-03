import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Clock3,
  Disc3,
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
  ImagePlus,
  FileText,
  Shuffle,
  Repeat,
  Repeat1,
  SkipForward,
  Pencil,
  ListPlus,
  Copy,
  MoreHorizontal,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { readTrackDuration } from '../store/trackMetadata';
import type { Track } from '../types/track';
import type { PlaylistCollection } from '../types/playlist';
import { formatDuration } from '../utils/time';
import { filterLibraryTracksByMode, mergeTracksById, sortLibraryTracks } from './libraryHelpers';
import { CoverSearchModal } from './CoverSearchModal';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface LibraryProps {
  useThemeAudioColors?: boolean;
  activeTab: 'library' | 'favorites' | 'playlist';
  setActiveTab: (tab: 'library' | 'favorites' | 'playlist') => void;
  onOpenLyrics: () => void;
  section?: LibrarySection;
  setSection?: (section: LibrarySection) => void;
}

const LIBRARY_SECTION_STORAGE_KEY = 'musie:library-section';
type LibrarySection = 'tracks' | 'albums' | 'lyrics';

export const Library = ({
  useThemeAudioColors = true,
  activeTab,
  setActiveTab,
  onOpenLyrics,
  section,
  setSection,
}: LibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'recent' | 'title' | 'artist'>('recent');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [localLibrarySection, setLocalLibrarySection] = useState<LibrarySection>(() => {
    if (typeof window === 'undefined') return 'tracks';

    try {
      const storedSection = window.localStorage.getItem(LIBRARY_SECTION_STORAGE_KEY);
      return storedSection === 'albums' || storedSection === 'lyrics' ? storedSection : 'tracks';
    } catch {
      return 'tracks';
    }
  });
  const librarySection = section ?? localLibrarySection;
  const updateLibrarySection = (nextSection: LibrarySection) => {
    setLocalLibrarySection(nextSection);
    setSection?.(nextSection);
  };
  const [pendingRemoveTrackId, setPendingRemoveTrackId] = useState<string | null>(null);
  const [draggedPlaylistTrackId, setDraggedPlaylistTrackId] = useState<string | null>(null);
  const [dropTargetTrackId, setDropTargetTrackId] = useState<string | null>(null);
  const [coverSearchTrack, setCoverSearchTrack] = useState<Track | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [playlistPickerTrack, setPlaylistPickerTrack] = useState<Track | null>(null);
  const [playlistCoverTargetId, setPlaylistCoverTargetId] = useState<string | null>(null);
  const [playlistDeleteTargetId, setPlaylistDeleteTargetId] = useState<string | null>(null);
  const [deletedPlaylistUndo, setDeletedPlaylistUndo] = useState<PlaylistCollection | null>(null);
  const [openPlaylistActionsId, setOpenPlaylistActionsId] = useState<string | null>(null);
  const playlistActionsButtonRef = useRef<HTMLButtonElement | null>(null);
  const playlistMenuRef = useRef<HTMLDivElement | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [playlistSeedTrackId, setPlaylistSeedTrackId] = useState<string | null>(null);
  const [albumName, setAlbumName] = useState('');
  const [albumArtist, setAlbumArtist] = useState('');
  const [albumTrackIds, setAlbumTrackIds] = useState<string[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [playlistTrackIds, setPlaylistTrackIds] = useState<string[]>([]);
  const albumDialogRef = useRef<HTMLDivElement>(null);
  const playlistDialogRef = useRef<HTMLDivElement>(null);
  const playlistPickerDialogRef = useRef<HTMLDivElement>(null);
  const playlistDeleteDialogRef = useRef<HTMLDivElement>(null);
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
  const addTrackNext = usePlayerStore((state) => state.addTrackNext);
  const removeFromPlaylist = usePlayerStore((state) => state.removeFromPlaylist);
  const movePlaylistTrack = usePlayerStore((state) => state.movePlaylistTrack);
  const movePlaylistTrackToEnd = usePlayerStore((state) => state.movePlaylistTrackToEnd);
  const toggleTrackFavorite = usePlayerStore((state) => state.toggleTrackFavorite);
  const setTrack = usePlayerStore((state) => state.setTrack);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const albums = usePlayerStore((state) => state.albums);
  const createAlbum = usePlayerStore((state) => state.createAlbum);
  const deleteAlbum = usePlayerStore((state) => state.deleteAlbum);
  const playlists = usePlayerStore((state) => state.playlists);
  const createPlaylist = usePlayerStore((state) => state.createPlaylist);
  const updatePlaylist = usePlayerStore((state) => state.updatePlaylist);
  const deletePlaylist = usePlayerStore((state) => state.deletePlaylist);
  const restorePlaylist = usePlayerStore((state) => state.restorePlaylist);
  const duplicatePlaylist = usePlayerStore((state) => state.duplicatePlaylist);
  const loadPlaylist = usePlayerStore((state) => state.loadPlaylist);
  const appendPlaylistToQueue = usePlayerStore((state) => state.appendPlaylistToQueue);
  const addPlaylistNext = usePlayerStore((state) => state.addPlaylistNext);
  const removeUnavailableFromPlaylist = usePlayerStore(
    (state) => state.removeUnavailableFromPlaylist
  );
  const movePlaylistCollectionTrack = usePlayerStore((state) => state.movePlaylistCollectionTrack);
  const clearUpcomingTracks = usePlayerStore((state) => state.clearUpcomingTracks);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const playbackContext = usePlayerStore((state) => state.playbackContext);
  const shuffleEnabled = usePlayerStore((state) => state.shuffleEnabled);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const seek = usePlayerStore((state) => state.seek);
  const duration = usePlayerStore((state) => state.duration);

  const playNextTrack = usePlayerStore((state) => state.playNextTrack);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const cycleRepeatMode = usePlayerStore((state) => state.cycleRepeatMode);
  useFocusTrap(albumDialogRef, isAlbumModalOpen);
  useFocusTrap(playlistDialogRef, isPlaylistModalOpen);
  useFocusTrap(playlistPickerDialogRef, playlistPickerTrack !== null);
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

  useEffect(() => {
    const handleStorageError = () => setStorageError(true);
    window.addEventListener('musie-storage-error', handleStorageError);
    return () => window.removeEventListener('musie-storage-error', handleStorageError);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(LIBRARY_SECTION_STORAGE_KEY, librarySection);
    } catch {
      // Storage may be unavailable in private browsing or restricted environments.
    }
  }, [librarySection]);

  useEffect(() => {
    albumDialogRef.current?.focus({ preventScroll: true });
  }, [isAlbumModalOpen]);

  useEffect(() => {
    if (!isAlbumModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAlbumModalOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAlbumModalOpen]);

  useEffect(() => {
    playlistDialogRef.current?.focus({ preventScroll: true });
  }, [isPlaylistModalOpen]);

  useEffect(() => {
    if (!isPlaylistModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPlaylistModalOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaylistModalOpen]);

  useEffect(() => {
    playlistPickerDialogRef.current?.focus({ preventScroll: true });
  }, [playlistPickerTrack]);

  useEffect(() => {
    if (!playlistPickerTrack) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPlaylistPickerTrack(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playlistPickerTrack]);

  const playlistTrackIdSet = useMemo(
    () => new Set(playlistTracks.map((track) => track.id)),
    [playlistTracks]
  );
  const favoriteTrackIdSet = useMemo(() => new Set(favoriteTrackIds), [favoriteTrackIds]);
  const favoriteSourceTracks = useMemo(
    () => mergeTracksById(libraryTracks, playlistTracks),
    [libraryTracks, playlistTracks]
  );
  const sourceLibraryTracks = useMemo(
    () =>
      filterLibraryTracksByMode(
        activeTab === 'favorites' ? favoriteSourceTracks : libraryTracks,
        favoriteTrackIds,
        showFavoritesOnly,
        activeTab
      ),
    [activeTab, favoriteSourceTracks, favoriteTrackIds, libraryTracks, showFavoritesOnly]
  );

  useEffect(() => {
    let isActive = true;
    const abortController = new AbortController();
    const tracksWithoutDuration = libraryTracks.filter(
      (track) => track.durationSeconds === undefined && (track.fileData || track.audioUrl)
    );
    const pendingTracks = tracksWithoutDuration.filter((track) => {
      if (pendingDurationReadsRef.current.has(track.id)) return false;

      pendingDurationReadsRef.current.add(track.id);
      return true;
    });
    let nextTrackIndex = 0;

    const readNextDuration = async () => {
      while (nextTrackIndex < pendingTracks.length) {
        const track = pendingTracks[nextTrackIndex];
        nextTrackIndex += 1;
        const source = track.fileData || track.audioUrl;

        await readTrackDuration(source, abortController.signal)
          .then((durationSeconds) => {
            if (isActive && durationSeconds !== undefined) {
              updateTrackMetadata(track.id, { durationSeconds });
            }
          })
          .catch(() => undefined)
          .finally(() => pendingDurationReadsRef.current.delete(track.id));
      }
    };

    void Promise.all([readNextDuration(), readNextDuration()]);

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [libraryTracks, updateTrackMetadata]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleLibraryTracks = useMemo(
    () =>
      sourceLibraryTracks.filter((track) => {
        if (!normalizedQuery) return true;

        return (
          track.title.toLowerCase().includes(normalizedQuery) ||
          track.artist.toLowerCase().includes(normalizedQuery)
        );
      }),
    [normalizedQuery, sourceLibraryTracks]
  );
  const librarySongs = useMemo(
    () => sortLibraryTracks(visibleLibraryTracks, sortMode, favoriteTrackIds, activeTab),
    [activeTab, favoriteTrackIds, sortMode, visibleLibraryTracks]
  );
  const savedLyricsSongs = useMemo(() => {
    const filteredTracks = libraryTracks.filter((track) => {
      if (!track.lyrics) return false;
      if (!normalizedQuery) return true;
      return (
        track.title.toLowerCase().includes(normalizedQuery) ||
        track.artist.toLowerCase().includes(normalizedQuery)
      );
    });

    return sortLibraryTracks(filteredTracks, sortMode, favoriteTrackIds, 'library');
  }, [favoriteTrackIds, libraryTracks, normalizedQuery, sortMode]);
  const longTracks = useMemo(
    () =>
      libraryTracks
        .filter((track) => (track.durationSeconds ?? 0) > 15 * 60)
        .sort((a, b) => (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0)),
    [libraryTracks]
  );
  const albumTracksById = useMemo(
    () => new Map(libraryTracks.map((track) => [track.id, track])),
    [libraryTracks]
  );

  const currentPlaylistIndex = playlistTracks.findIndex((track) => track.id === currentTrack?.id);
  const isPlaylistContext = playbackContext === 'playlist';
  const currentQueueIndex = isPlaylistContext ? currentPlaylistIndex : -1;
  const upcomingPlaylistTracks =
    currentQueueIndex >= 0
      ? playlistTracks.slice(currentQueueIndex + 1, currentQueueIndex + 4)
      : playlistTracks.slice(0, 3);
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (seek / duration) * 100)) : 0;
  const repeatLabel =
    repeatMode === 'one' ? 'Repeat once' : repeatMode === 'all' ? 'Repeat all' : 'Repeat off';
  const upcomingTrackCount =
    isPlaylistContext && currentQueueIndex >= 0
      ? Math.max(0, playlistTracks.length - currentQueueIndex - 1)
      : 0;

  const playFirstTrack = () => {
    if (playlistTracks.length === 0) return;
    setTrack(playlistTracks[0], 'playlist');
  };

  const playRandomTrack = () => {
    if (playlistTracks.length === 0) return;
    const randomIndex = Math.floor(Math.random() * playlistTracks.length);
    setTrack(playlistTracks[randomIndex], 'playlist');
  };

  const handleLibraryTrackAdd = (track: (typeof libraryTracks)[number]) => {
    addToPlaylist(track);
    setPendingRemoveTrackId(null);
  };

  const handleTrackAddNext = (track: Track) => {
    addTrackNext(track);
    setPendingRemoveTrackId(null);
  };

  const handlePlayFavorites = () => {
    const tracks = favoriteSourceTracks.filter((track) => favoriteTrackIdSet.has(track.id));
    if (tracks.length === 0) return;

    clearPlaylist();
    tracks.forEach((track) => addToPlaylist(track));
    setTrack(tracks[0], 'playlist');
  };

  const handleLibraryTrackPlay = (track: (typeof libraryTracks)[number], isSelected: boolean) => {
    clearPendingRemove();
    if (isSelected) {
      togglePlay();
    } else {
      setTrack(track, 'library');
    }
  };

  const clearPendingRemove = () => {
    setPendingRemoveTrackId(null);
  };

  const handleTabChange = (tab: LibraryProps['activeTab']) => {
    clearPendingRemove();
    setActiveTab(tab);
  };

  const openAlbumModal = () => {
    setAlbumName('');
    setAlbumArtist('');
    setAlbumTrackIds([]);
    setIsAlbumModalOpen(true);
  };

  const openPlaylistModal = (track?: Track) => {
    setEditingPlaylistId(null);
    setPlaylistSeedTrackId(track?.id ?? null);
    setPlaylistName('');
    setPlaylistDescription('');
    setPlaylistTrackIds(track ? [track.id] : playlistTracks.map((item) => item.id));
    setIsPlaylistModalOpen(true);
  };

  const openEditPlaylistModal = (playlistId: string) => {
    const playlist = playlists.find((item) => item.id === playlistId);
    if (!playlist) return;

    setEditingPlaylistId(playlist.id);
    setPlaylistSeedTrackId(null);
    setPlaylistName(playlist.name);
    setPlaylistDescription(playlist.description);
    setPlaylistTrackIds(playlist.trackIds);
    setIsPlaylistModalOpen(true);
  };

  const savePlaylist = () => {
    const name = playlistName.trim();
    if (!name) return;

    const description = playlistDescription.trim();
    const selectedTracks = playlistTrackIds
      .map((trackId) => libraryTracks.find((track) => track.id === trackId))
      .filter((track): track is Track => Boolean(track));
    const coverUrl = selectedTracks[0]?.coverUrl ?? playlistTracks[0]?.coverUrl ?? '';

    if (editingPlaylistId) {
      updatePlaylist(editingPlaylistId, {
        name,
        description,
        coverUrl,
        trackIds: playlistTrackIds,
      });
    } else {
      createPlaylist({ name, description, coverUrl, trackIds: playlistTrackIds });
    }
    setIsPlaylistModalOpen(false);
  };

  const playSavedPlaylist = (playlistId: string) => {
    loadPlaylist(playlistId);
    const tracks = usePlayerStore.getState().playlistTracks;
    if (tracks[0]) setTrack(tracks[0], 'playlist');
  };

  const toggleTrackInSavedPlaylist = (playlistId: string, trackId: string) => {
    const playlist = playlists.find((item) => item.id === playlistId);
    if (!playlist) return;

    const hasTrack = playlist.trackIds.includes(trackId);
    updatePlaylist(playlistId, {
      trackIds: hasTrack
        ? playlist.trackIds.filter((id) => id !== trackId)
        : [...playlist.trackIds, trackId],
    });
  };

  const playlistDeleteTarget = playlists.find((playlist) => playlist.id === playlistDeleteTargetId);
  useFocusTrap(playlistDeleteDialogRef, playlistDeleteTarget !== undefined);

  useEffect(() => {
    if (!playlistDeleteTarget) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPlaylistDeleteTargetId(null);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [playlistDeleteTarget]);

  useEffect(() => {
    if (!deletedPlaylistUndo) return;

    const timeoutId = window.setTimeout(() => setDeletedPlaylistUndo(null), 6000);
    return () => window.clearTimeout(timeoutId);
  }, [deletedPlaylistUndo]);

  useEffect(() => {
    if (!openPlaylistActionsId) return;

    playlistMenuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])')
      ?.focus({ preventScroll: true });

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && !target.closest('[data-playlist-actions]')) {
        setOpenPlaylistActionsId(null);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenPlaylistActionsId(null);
        playlistActionsButtonRef.current?.focus({ preventScroll: true });
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [openPlaylistActionsId]);

  const saveAlbum = () => {
    const name = albumName.trim();
    if (!name || albumTrackIds.length === 0) return;
    const firstTrack = albumTracksById.get(albumTrackIds[0]);
    createAlbum({
      name,
      artist: albumArtist.trim() || firstTrack?.artist || 'Artista desconocido',
      coverUrl: firstTrack?.coverUrl ?? '',
      trackIds: albumTrackIds,
    });
    setIsAlbumModalOpen(false);
  };

  const playAlbum = (album: (typeof albums)[number]) => {
    const tracks = album.trackIds
      .map((trackId) => albumTracksById.get(trackId))
      .filter((track): track is (typeof libraryTracks)[number] => Boolean(track));
    if (tracks.length === 0) return;

    clearPlaylist();
    tracks.forEach((track) => addToPlaylist(track));
    setTrack(tracks[0], 'playlist');
  };

  const getAlbumDuration = (album: (typeof albums)[number]) =>
    album.trackIds.reduce(
      (total, trackId) => total + (albumTracksById.get(trackId)?.durationSeconds ?? 0),
      0
    );

  const playlistSummaries = useMemo(
    () =>
      new Map(
        playlists.map((playlist) => {
          const availableTracks = playlist.trackIds
            .map((trackId) => albumTracksById.get(trackId))
            .filter((track): track is Track => Boolean(track));

          return [
            playlist.id,
            {
              availableCount: availableTracks.length,
              duration: availableTracks.reduce(
                (total, track) => total + (track.durationSeconds ?? 0),
                0
              ),
            },
          ] as const;
        })
      ),
    [albumTracksById, playlists]
  );
  const normalizedPlaylistSearchQuery = playlistSearchQuery.trim().toLowerCase();
  const visiblePlaylists = useMemo(
    () =>
      playlists.filter((playlist) => {
        if (!normalizedPlaylistSearchQuery) return true;
        return (
          playlist.name.toLowerCase().includes(normalizedPlaylistSearchQuery) ||
          playlist.description.toLowerCase().includes(normalizedPlaylistSearchQuery)
        );
      }),
    [normalizedPlaylistSearchQuery, playlists]
  );

  const formatPlaylistUpdatedAt = (timestamp: number) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(timestamp);

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

  const handleSavedPlaylistDragStart = (
    event: React.DragEvent<HTMLLabelElement>,
    trackId: string
  ) => {
    if (!editingPlaylistId || !playlistTrackIds.includes(trackId)) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', trackId);
    setDraggedPlaylistTrackId(trackId);
  };

  const handleSavedPlaylistDrop = (
    event: React.DragEvent<HTMLLabelElement>,
    targetTrackId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const sourceTrackId = draggedPlaylistTrackId ?? event.dataTransfer.getData('text/plain');
    const sourceIndex = playlistTrackIds.indexOf(sourceTrackId);
    const targetIndex = playlistTrackIds.indexOf(targetTrackId);

    if (!editingPlaylistId || sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      setDraggedPlaylistTrackId(null);
      setDropTargetTrackId(null);
      return;
    }

    const nextTrackIds = [...playlistTrackIds];
    const [draggedTrackId] = nextTrackIds.splice(sourceIndex, 1);
    nextTrackIds.splice(targetIndex, 0, draggedTrackId);
    setPlaylistTrackIds(nextTrackIds);
    updatePlaylist(editingPlaylistId, { trackIds: nextTrackIds });
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
    activeTab === 'library' && librarySection === 'albums'
      ? albums.length
      : activeTab === 'library' && librarySection === 'lyrics'
        ? savedLyricsSongs.length
        : activeTab === 'library'
          ? libraryTracks.length
          : activeTab === 'favorites'
            ? sourceLibraryTracks.length
            : playlistTracks.length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setStorageError(false);
    try {
      await addSongs(Array.from(files));
    } catch (error) {
      console.error('[library] failed to add songs', error);
      setStorageError(true);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full animate-view-entry" onClick={clearPendingRemove}>
      {coverSearchTrack && (
        <CoverSearchModal
          track={coverSearchTrack}
          onClose={() => {
            setCoverSearchTrack(null);
            setPlaylistCoverTargetId(null);
          }}
          updateTrackMetadata={playlistCoverTargetId ? () => undefined : updateTrackMetadata}
          onCoverSelected={
            playlistCoverTargetId
              ? (coverUrl) => {
                  updatePlaylist(playlistCoverTargetId, { coverUrl });
                  setPlaylistCoverTargetId(null);
                }
              : undefined
          }
        />
      )}
      {/* 1. CABECERA CON GLASSMORPHISM SUTIL */}
      <header className="p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-b from-[var(--glass-bg)] to-transparent">
        <div className="space-y-4">
          <div>
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-[var(--text-main)]">
              {activeTab === 'playlist'
                ? 'Playlist'
                : activeTab === 'favorites'
                  ? 'Favorites'
                  : activeTab === 'library' && librarySection === 'albums'
                    ? 'Albums'
                    : activeTab === 'library' && librarySection === 'lyrics'
                      ? 'Lyrics guardadas'
                      : 'Library'}
            </h2>
            <p className="text-[var(--text-muted)] font-medium mt-2 text-sm md:text-base uppercase tracking-widest">
              {activeCount}{' '}
              {activeTab === 'library' && librarySection === 'albums'
                ? 'colecciones'
                : activeTab === 'library' && librarySection === 'lyrics'
                  ? 'canciones con lyrics'
                  : activeTab === 'playlist'
                    ? 'tracks en playlist'
                    : activeTab === 'favorites'
                      ? 'tracks favoritos'
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
                  onClick={() => handleTabChange(tab.id)}
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

          {activeTab === 'library' && (
            <div
              aria-label="Sección de biblioteca"
              role="tablist"
              className="inline-flex w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1 shadow-[var(--glass-shadow)] backdrop-blur-xl md:w-auto"
            >
              {[
                { id: 'tracks' as const, label: 'Canciones', icon: LibraryIcon },
                { id: 'albums' as const, label: 'Álbumes', icon: Disc3 },
                { id: 'lyrics' as const, label: 'Lyrics', icon: FileText },
              ].map((section) => {
                const isActive = librarySection === section.id;
                const Icon = section.icon;

                return (
                  <button
                    key={section.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => updateLibrarySection(section.id)}
                    className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-black tracking-wide transition-all md:flex-none md:text-sm ${
                      isActive
                        ? useThemeAudioColors
                          ? 'bg-[var(--accent-primary)] text-[var(--bg-main)] shadow-lg'
                          : 'bg-[var(--text-main)] text-[var(--bg-main)] shadow-lg'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </div>
          )}

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

          {activeCount > 0 &&
            (activeTab !== 'library' || librarySection === 'tracks') &&
            !(activeTab === 'library' && librarySection === 'lyrics') && (
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

      {storageError && (
        <p
          role="alert"
          className="mx-6 -mt-2 mb-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 md:mx-10"
        >
          No se pudo guardar la biblioteca en este dispositivo. Libera espacio del navegador y
          vuelve a intentarlo; las canciones mostradas podrían perderse al recargar.
        </p>
      )}

      {activeTab === 'library' && librarySection === 'tracks' && (
        <section className="mx-4 mb-5 grid gap-4 md:mx-10 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="rounded-[28px] border border-[var(--accent-secondary)]/25 bg-[var(--accent-secondary)]/8 p-4 shadow-[var(--glass-shadow)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--accent-secondary)]">
                  Archivos largos
                </p>
                <h3 className="mt-1 text-lg font-black text-[var(--text-main)]">
                  {longTracks.length} pistas de más de 15 minutos
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Pueden ser álbumes completos, conciertos, mixes o podcasts.
                </p>
              </div>
              <Clock3 className="shrink-0 text-[var(--accent-secondary)]" size={22} />
            </div>
            {longTracks.length > 0 ? (
              <div className="mt-4 space-y-2">
                {longTracks.slice(0, 5).map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => setTrack(track, 'library')}
                    className="flex w-full items-center gap-3 rounded-2xl border border-transparent p-2 text-left transition hover:border-[var(--glass-border)] hover:bg-[var(--glass-bg)]"
                  >
                    <img
                      src={track.coverUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--text-main)]">
                      {track.title}
                    </span>
                    <span className="text-xs tabular-nums text-[var(--text-muted)]">
                      {formatDuration(track.durationSeconds)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                Aquí aparecerán archivos largos cuando los importes.
              </p>
            )}
          </div>
        </section>
      )}

      {activeTab === 'library' && librarySection === 'lyrics' && (
        <section className="mx-4 mb-5 md:mx-10">
          <div className="rounded-[28px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 shadow-[var(--glass-shadow)] md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">
                  Colección de letras
                </p>
                <h3 className="mt-1 text-lg font-black text-[var(--text-main)]">
                  {savedLyricsSongs.length} canciones con lyrics
                </h3>
              </div>
              <FileText className="shrink-0 text-[var(--accent-primary)]" size={22} />
            </div>

            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Buscar
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Título o artista"
                className="w-full bg-transparent text-sm font-semibold text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
              />
              {playlistSearchQuery && (
                <button
                  type="button"
                  onClick={() => setPlaylistSearchQuery('')}
                  aria-label="Limpiar búsqueda de playlists"
                  className="shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]"
                >
                  Limpiar
                </button>
              )}
            </label>

            {savedLyricsSongs.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-3xl border-2 border-dashed border-[var(--glass-border)] px-5 py-10 text-center">
                <FileText size={30} className="text-[var(--accent-primary)]" />
                <p className="mt-3 text-lg font-black text-[var(--text-main)]">
                  No hay lyrics guardadas
                </p>
                <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">
                  Las canciones con letras guardadas aparecerán aquí para encontrarlas rápidamente.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {savedLyricsSongs.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={onOpenLyrics}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] p-2 text-left transition hover:bg-[var(--glass-bg)]"
                  >
                    <img
                      src={track.coverUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[var(--text-main)]">
                        {track.title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-[var(--text-muted)]">
                        {track.artist} ·{' '}
                        {track.lyrics?.format === 'synced' ? 'Lyrics sincronizadas' : 'Texto plano'}
                      </span>
                    </span>
                    <Play size={15} className="shrink-0 text-[var(--accent-primary)]" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'library' && librarySection === 'albums' && (
        <section className="mx-4 mb-5 md:mx-10">
          <div className="rounded-[28px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 shadow-[var(--glass-shadow)] md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--text-muted)]">
                  Colección local
                </p>
                <h3 className="mt-1 text-lg font-black text-[var(--text-main)]">
                  {albums.length} álbumes
                </h3>
              </div>
              <button
                type="button"
                onClick={openAlbumModal}
                disabled={libraryTracks.length === 0}
                className="rounded-full bg-[var(--accent-primary)] px-3 py-2 text-[10px] font-black text-[var(--bg-main)] disabled:opacity-40"
              >
                Crear álbum
              </button>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {albums.length === 0 ? (
                <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-[var(--glass-border)] px-5 py-10 text-center md:col-span-2">
                  <Disc3 size={30} className="text-[var(--accent-primary)]" />
                  <p className="mt-3 text-lg font-black text-[var(--text-main)]">
                    Todavía no tienes álbumes
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">
                    Crea una colección usando las canciones que ya importaste.
                  </p>
                  <button
                    type="button"
                    onClick={() => updateLibrarySection('tracks')}
                    disabled={libraryTracks.length === 0}
                    className="mt-4 rounded-full border border-[var(--glass-border)] px-4 py-2 text-xs font-black text-[var(--text-main)] disabled:opacity-40"
                  >
                    {libraryTracks.length === 0 ? 'Agrega música primero' : 'Ver canciones'}
                  </button>
                </div>
              ) : (
                albums.map((album) => (
                  <div
                    key={album.id}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] p-2"
                  >
                    <img
                      src={album.coverUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--text-main)]">
                        {album.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {album.artist} ·{' '}
                        {getAlbumDuration(album) > 0
                          ? `${formatDuration(getAlbumDuration(album))} · `
                          : ''}
                        {album.trackIds.filter((trackId) => albumTracksById.has(trackId)).length}{' '}
                        canciones
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => playAlbum(album)}
                      disabled={!album.trackIds.some((trackId) => albumTracksById.has(trackId))}
                      aria-label={`Reproducir álbum ${album.name}`}
                      className="rounded-full p-2 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 disabled:opacity-40"
                    >
                      <Play size={15} fill="currentColor" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAlbum(album.id)}
                      aria-label={`Eliminar álbum ${album.name}`}
                      className="rounded-full p-2 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {playlistPickerTrack && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPlaylistPickerTrack(null);
          }}
        >
          <div
            ref={playlistPickerDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="playlist-picker-title"
            tabIndex={-1}
            className="w-full max-w-md rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-main)] p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--text-muted)]">
                  Guardar canción
                </p>
                <h3
                  id="playlist-picker-title"
                  className="mt-1 truncate text-xl font-black text-[var(--text-main)]"
                >
                  {playlistPickerTrack.title}
                </h3>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {playlistPickerTrack.artist}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlaylistPickerTrack(null)}
                aria-label="Cerrar"
                className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 space-y-2">
              {playlists.map((playlist) => {
                const selected = playlist.trackIds.includes(playlistPickerTrack.id);
                return (
                  <label
                    key={playlist.id}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--glass-border)] p-3 transition-colors hover:bg-[var(--bg-elevated)]"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        toggleTrackInSavedPlaylist(playlist.id, playlistPickerTrack.id)
                      }
                      className="accent-[var(--accent-primary)]"
                    />
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-elevated)]">
                      {playlist.coverUrl ? (
                        <img
                          src={playlist.coverUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ListMusic size={16} className="text-[var(--accent-primary)]" />
                      )}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--text-main)]">
                      {playlist.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {playlist.trackIds.length}
                    </span>
                  </label>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                const selectedTrack = playlistPickerTrack;
                openPlaylistModal(selectedTrack);
                setPlaylistPickerTrack(null);
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--glass-border)] px-4 py-3 text-xs font-black text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)]"
            >
              <Plus size={15} />
              Crear nueva playlist
            </button>
          </div>
        </div>
      )}

      {playlistDeleteTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPlaylistDeleteTargetId(null);
          }}
        >
          <div
            ref={playlistDeleteDialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-playlist-title"
            tabIndex={-1}
            className="w-full max-w-sm rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-main)] p-5 shadow-2xl"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--text-muted)]">
              Eliminar playlist
            </p>
            <h3
              id="delete-playlist-title"
              className="mt-2 text-lg font-black text-[var(--text-main)]"
            >
              ¿Eliminar “{playlistDeleteTarget.name}”?
            </h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Esta acción elimina la playlist guardada, pero no detiene la reproducción ni borra tus
              canciones.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPlaylistDeleteTargetId(null)}
                className="rounded-full border border-[var(--glass-border)] px-4 py-2 text-xs font-black text-[var(--text-muted)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeletedPlaylistUndo(playlistDeleteTarget);
                  deletePlaylist(playlistDeleteTarget.id);
                  setPlaylistDeleteTargetId(null);
                }}
                className="rounded-full bg-red-500 px-4 py-2 text-xs font-black text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {deletedPlaylistUndo && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-[calc(var(--mobile-playerbar-height)+var(--mobile-tabs-height)+1rem)] z-[75] flex items-center justify-between gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-3 shadow-2xl lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-96"
        >
          <p className="min-w-0 truncate text-xs font-semibold text-[var(--text-main)]">
            Playlist eliminada: {deletedPlaylistUndo.name}
          </p>
          <button
            type="button"
            onClick={() => {
              restorePlaylist(deletedPlaylistUndo);
              setDeletedPlaylistUndo(null);
            }}
            className="shrink-0 rounded-full bg-[var(--accent-primary)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--bg-main)]"
          >
            Deshacer
          </button>
        </div>
      )}

      {isPlaylistModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsPlaylistModalOpen(false);
          }}
        >
          <div
            ref={playlistDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="playlist-dialog-title"
            tabIndex={-1}
            className="w-full max-w-lg rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-main)] p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--text-muted)]">
                  Colección reutilizable
                </p>
                <h3
                  id="playlist-dialog-title"
                  className="mt-1 text-xl font-black text-[var(--text-main)]"
                >
                  {editingPlaylistId ? 'Editar playlist' : 'Crear playlist'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPlaylistModalOpen(false)}
                aria-label="Cerrar"
                className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              <input
                autoFocus
                value={playlistName}
                onChange={(event) => setPlaylistName(event.target.value)}
                placeholder="Nombre de la playlist"
                className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
              />
              <textarea
                value={playlistDescription}
                onChange={(event) => setPlaylistDescription(event.target.value)}
                placeholder="Descripción opcional"
                rows={3}
                className="resize-none rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
              />
              <p className="text-xs text-[var(--text-muted)]">
                {editingPlaylistId
                  ? 'Los cambios solo afectan esta playlist guardada, no la cola que estás escuchando.'
                  : playlistSeedTrackId
                    ? 'La canción seleccionada se añadirá a la nueva playlist. Crear la playlist no cambiará lo que estás escuchando.'
                    : `Se guardarán las ${playlistTrackIds.length} canciones de la cola actual. Crear la playlist no cambiará lo que estás escuchando.`}
              </p>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Canciones · {playlistTrackIds.length}
                </p>
                {editingPlaylistId && playlistTrackIds.length > 1 && (
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    Arrastra las canciones seleccionadas para cambiar su orden.
                  </p>
                )}
                <div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-2xl border border-[var(--glass-border)] p-2">
                  {libraryTracks.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                      No hay canciones disponibles.
                    </p>
                  ) : (
                    libraryTracks.map((track) => {
                      const selected = playlistTrackIds.includes(track.id);
                      const selectedIndex = playlistTrackIds.indexOf(track.id);
                      return (
                        <label
                          key={track.id}
                          draggable={Boolean(editingPlaylistId && selected)}
                          onDragStart={(event) => handleSavedPlaylistDragStart(event, track.id)}
                          onDragOver={(event) => {
                            if (!draggedPlaylistTrackId || !selected) return;
                            event.preventDefault();
                            setDropTargetTrackId(track.id);
                          }}
                          onDrop={(event) => handleSavedPlaylistDrop(event, track.id)}
                          onDragEnd={() => {
                            setDraggedPlaylistTrackId(null);
                            setDropTargetTrackId(null);
                          }}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-2 py-2 transition-colors hover:bg-[var(--bg-elevated)] ${
                            dropTargetTrackId === track.id
                              ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)]'
                              : 'border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setPlaylistTrackIds((ids) =>
                                selected ? ids.filter((id) => id !== track.id) : [...ids, track.id]
                              )
                            }
                            className="accent-[var(--accent-primary)]"
                          />
                          {selected && editingPlaylistId && (
                            <span className="flex items-center gap-1" title="Reordenar canción">
                              <span
                                aria-hidden="true"
                                className="min-w-4 text-center text-[10px] font-black text-[var(--text-muted)]"
                              >
                                {selectedIndex + 1}
                              </span>
                              <GripVertical
                                aria-hidden="true"
                                size={13}
                                className="text-[var(--text-muted)]"
                              />
                              <button
                                type="button"
                                disabled={selectedIndex === 0}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  movePlaylistCollectionTrack(editingPlaylistId, track.id, 'up');
                                  setPlaylistTrackIds((ids) => {
                                    const next = [...ids];
                                    [next[selectedIndex - 1], next[selectedIndex]] = [
                                      next[selectedIndex],
                                      next[selectedIndex - 1],
                                    ];
                                    return next;
                                  });
                                }}
                                aria-label={`Move ${track.title} up`}
                                className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)] disabled:invisible"
                              >
                                <ChevronUp size={13} />
                              </button>
                              <button
                                type="button"
                                disabled={selectedIndex === playlistTrackIds.length - 1}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  movePlaylistCollectionTrack(editingPlaylistId, track.id, 'down');
                                  setPlaylistTrackIds((ids) => {
                                    const next = [...ids];
                                    [next[selectedIndex], next[selectedIndex + 1]] = [
                                      next[selectedIndex + 1],
                                      next[selectedIndex],
                                    ];
                                    return next;
                                  });
                                }}
                                aria-label={`Move ${track.title} down`}
                                className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)] disabled:invisible"
                              >
                                <ChevronDown size={13} />
                              </button>
                            </span>
                          )}
                          <img
                            src={track.coverUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-8 w-8 rounded-lg object-cover"
                          />
                          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--text-main)]">
                            {track.title}
                          </span>
                          <span className="max-w-24 truncate text-[10px] text-[var(--text-muted)]">
                            {track.artist}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPlaylistModalOpen(false)}
                className="rounded-full border border-[var(--glass-border)] px-4 py-2 text-xs font-black text-[var(--text-muted)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={savePlaylist}
                disabled={!playlistName.trim()}
                className="rounded-full bg-[var(--accent-primary)] px-4 py-2 text-xs font-black text-[var(--bg-main)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {editingPlaylistId ? 'Guardar cambios' : 'Guardar playlist'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAlbumModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsAlbumModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-album-title"
            ref={albumDialogRef}
            tabIndex={-1}
            className="my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-main)] shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-[var(--glass-border)] p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--text-muted)]">
                  Colección local
                </p>
                <h3 id="create-album-title" className="text-xl font-black text-[var(--text-main)]">
                  Crear álbum
                </h3>
              </div>
              <button type="button" onClick={() => setIsAlbumModalOpen(false)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </header>
            <div className="min-h-0 overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={albumName}
                  onChange={(event) => setAlbumName(event.target.value)}
                  placeholder="Nombre del álbum"
                  className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
                />
                <input
                  value={albumArtist}
                  onChange={(event) => setAlbumArtist(event.target.value)}
                  placeholder="Artista (opcional)"
                  className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Añadir canciones en orden
              </p>
              <div className="mt-3 space-y-2">
                {libraryTracks.map((track) => {
                  const selected = albumTrackIds.includes(track.id);
                  return (
                    <label
                      key={track.id}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--glass-border)] p-2"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          setAlbumTrackIds((ids) =>
                            selected ? ids.filter((id) => id !== track.id) : [...ids, track.id]
                          )
                        }
                        className="accent-[var(--accent-primary)]"
                      />
                      <img
                        src={track.coverUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-9 w-9 rounded-lg object-cover"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--text-main)]">
                        {track.title}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatDuration(track.durationSeconds)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t border-[var(--glass-border)] p-4">
              <button
                type="button"
                onClick={() => setIsAlbumModalOpen(false)}
                className="rounded-full px-4 py-2 text-xs font-bold text-[var(--text-muted)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveAlbum}
                disabled={!albumName.trim() || albumTrackIds.length === 0}
                className="rounded-full bg-[var(--accent-primary)] px-4 py-2 text-xs font-black text-[var(--bg-main)] disabled:opacity-40"
              >
                Guardar álbum
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* 2. LISTA DE CANCIONES */}
      <div className="flex-1 px-4 md:px-10">
        {(activeTab !== 'library' || librarySection === 'tracks') &&
          (activeTab !== 'playlist' ? (
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
                      onClick={() => handleTabChange('library')}
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
                        className={`library-track-row group grid grid-cols-[32px_minmax(0,1fr)] md:grid-cols-[50px_minmax(0,1fr)_auto] items-center gap-3 md:gap-4 px-3 md:px-4 py-3 rounded-2xl transition-all border border-transparent cursor-pointer ${
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
                        <div className="flex min-w-0 items-center gap-3 md:gap-4">
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
                          <div className="min-w-0 flex-1">
                            <p
                              className={`line-clamp-2 text-sm leading-tight md:text-base font-bold ${
                                isSelected ? selectedAccentClass : 'text-[var(--text-main)]'
                              }`}
                            >
                              {track.title}
                            </p>
                            <p className="line-clamp-2 text-[10px] leading-tight md:text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-widest group-hover:text-[var(--text-main)] transition-colors">
                              {track.artist}
                              {track.album ? ` · ${track.album}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-2 flex min-w-0 flex-wrap items-center justify-end gap-1 md:col-span-1 md:flex-nowrap md:gap-3">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setCoverSearchTrack(track);
                            }}
                            aria-label={`Find cover for ${track.title}`}
                            title="Find cover automatically"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-all hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] md:opacity-0 md:group-hover:opacity-100"
                          >
                            <ImagePlus size={17} />
                          </button>
                          {playlists.length > 0 && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setPlaylistPickerTrack(track);
                              }}
                              onKeyDown={(event) => event.stopPropagation()}
                              aria-label={`Add ${track.title} to a saved playlist`}
                              title="Manage saved playlists"
                              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-all hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] md:opacity-0 md:group-hover:opacity-100"
                            >
                              <ListPlus size={17} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleTrackAddNext(track);
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                            aria-label={`Play ${track.title} next`}
                            title="Play next"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-all hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-primary)] md:opacity-0 md:group-hover:opacity-100"
                          >
                            <SkipForward size={16} />
                          </button>
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
              <section className="mx-4 mt-4 rounded-[28px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 shadow-[var(--glass-shadow)] backdrop-blur-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                      Saved playlists
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                      Guarda esta cola para reutilizarla sin perder tu sesión actual.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openPlaylistModal()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-primary)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bg-main)] transition-transform hover:scale-105"
                  >
                    <Plus size={14} />
                    Nueva playlist
                  </button>
                </div>
                <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Buscar
                  </span>
                  <input
                    type="search"
                    value={playlistSearchQuery}
                    onChange={(event) => setPlaylistSearchQuery(event.target.value)}
                    placeholder="Nombre o descripción"
                    aria-label="Buscar playlists guardadas"
                    className="w-full bg-transparent text-sm font-semibold text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
                  />
                </label>
                {playlists.length > 0 && visiblePlaylists.length > 0 ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {visiblePlaylists.map((playlist) =>
                      (() => {
                        const summary = playlistSummaries.get(playlist.id);
                        const availableCount = summary?.availableCount ?? 0;
                        const unavailableCount = Math.max(
                          0,
                          playlist.trackIds.length - availableCount
                        );
                        return (
                          <article
                            key={playlist.id}
                            className="relative flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-3"
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-main)]">
                              {playlist.coverUrl ? (
                                <img
                                  src={playlist.coverUrl}
                                  alt=""
                                  decoding="async"
                                  className="h-full w-full object-cover"
                                />
                              ) : playlists.length > 0 ? (
                                <p className="mt-4 rounded-2xl border border-dashed border-[var(--glass-border)] px-4 py-3 text-center text-xs text-[var(--text-muted)]">
                                  No hay playlists que coincidan con la búsqueda.
                                </p>
                              ) : (
                                <ListMusic size={18} className="text-[var(--accent-primary)]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-[var(--text-main)]">
                                {playlist.name}
                              </p>
                              <p className="truncate text-[11px] text-[var(--text-muted)]">
                                {availableCount} de {playlist.trackIds.length} canciones ·{' '}
                                {summary && summary.duration > 0
                                  ? formatDuration(summary.duration)
                                  : 'Duración pendiente'}
                              </p>
                              {unavailableCount > 0 && (
                                <p className="truncate text-[10px] text-amber-400">
                                  {unavailableCount} no disponible
                                  {unavailableCount === 1 ? '' : 's'}
                                </p>
                              )}
                              <p className="truncate text-[10px] text-[var(--text-muted)]">
                                Actualizada{' '}
                                {formatPlaylistUpdatedAt(playlist.updatedAt ?? playlist.createdAt)}
                              </p>
                              {playlist.description && (
                                <p className="truncate text-[10px] text-[var(--text-muted)]">
                                  {playlist.description}
                                </p>
                              )}
                            </div>
                            <div className="hidden min-w-full flex-wrap items-center justify-end gap-1 border-t border-[var(--glass-border)] pt-2 sm:flex sm:min-w-0 sm:border-t-0 sm:pt-0">
                              <button
                                type="button"
                                onClick={() => removeUnavailableFromPlaylist(playlist.id)}
                                disabled={unavailableCount === 0}
                                aria-label={`Limpiar pistas no disponibles de ${playlist.name}`}
                                title="Limpiar pistas no disponibles"
                                className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-amber-500/10 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Trash2 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => playSavedPlaylist(playlist.id)}
                                aria-label={`Reproducir playlist ${playlist.name}`}
                                title="Reproducir playlist"
                                className="rounded-full p-2 text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)]/10"
                              >
                                <Play size={15} fill="currentColor" />
                              </button>
                              <button
                                type="button"
                                onClick={() => appendPlaylistToQueue(playlist.id)}
                                aria-label={`Añadir playlist ${playlist.name} a la cola`}
                                title="Añadir a la cola"
                                className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-main)] hover:text-[var(--accent-primary)]"
                              >
                                <ListPlus size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => addPlaylistNext(playlist.id)}
                                disabled={!currentTrack}
                                aria-label={`Reproducir playlist ${playlist.name} después`}
                                title="Reproducir después"
                                className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-main)] hover:text-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <SkipForward size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const coverTrack = playlist.trackIds
                                    .map((trackId) =>
                                      libraryTracks.find((track) => track.id === trackId)
                                    )
                                    .find((track): track is Track => Boolean(track));
                                  if (!coverTrack) return;
                                  setPlaylistCoverTargetId(playlist.id);
                                  setCoverSearchTrack(coverTrack);
                                }}
                                disabled={
                                  !playlist.trackIds.some((trackId) => albumTracksById.has(trackId))
                                }
                                aria-label={`Cambiar portada de ${playlist.name}`}
                                title="Cambiar portada"
                                className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-main)] hover:text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <ImagePlus size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => duplicatePlaylist(playlist.id)}
                                aria-label={`Duplicar playlist ${playlist.name}`}
                                title="Duplicar playlist"
                                className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]"
                              >
                                <Copy size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditPlaylistModal(playlist.id)}
                                aria-label={`Editar playlist ${playlist.name}`}
                                title="Editar playlist"
                                className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPlaylistDeleteTargetId(playlist.id)}
                                aria-label={`Eliminar playlist ${playlist.name}`}
                                title="Eliminar playlist"
                                className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => playSavedPlaylist(playlist.id)}
                              aria-label={`Reproducir playlist ${playlist.name}`}
                              className="rounded-full p-2 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 sm:hidden"
                            >
                              <Play size={15} fill="currentColor" />
                            </button>
                            <div className="relative ml-auto sm:hidden">
                              <button
                                type="button"
                                ref={playlistActionsButtonRef}
                                data-playlist-actions
                                onClick={(event) => {
                                  playlistActionsButtonRef.current = event.currentTarget;
                                  setOpenPlaylistActionsId((id) =>
                                    id === playlist.id ? null : playlist.id
                                  );
                                }}
                                aria-label={`Más acciones para ${playlist.name}`}
                                aria-expanded={openPlaylistActionsId === playlist.id}
                                className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]"
                              >
                                <MoreHorizontal size={18} />
                              </button>
                              {openPlaylistActionsId === playlist.id && (
                                <div
                                  role="menu"
                                  data-playlist-actions
                                  ref={playlistMenuRef}
                                  aria-label={`Acciones de ${playlist.name}`}
                                  className="absolute right-0 top-11 z-20 flex min-w-48 flex-col rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-main)] p-1 shadow-2xl"
                                >
                                  <button
                                    type="button"
                                    role="menuitem"
                                    disabled={unavailableCount === 0}
                                    onClick={() => {
                                      removeUnavailableFromPlaylist(playlist.id);
                                      setOpenPlaylistActionsId(null);
                                    }}
                                    className="rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-elevated)] disabled:opacity-40"
                                  >
                                    Limpiar no disponibles
                                  </button>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      appendPlaylistToQueue(playlist.id);
                                      setOpenPlaylistActionsId(null);
                                    }}
                                    className="rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                                  >
                                    Añadir a la cola
                                  </button>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      addPlaylistNext(playlist.id);
                                      setOpenPlaylistActionsId(null);
                                    }}
                                    disabled={!currentTrack}
                                    className="rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-elevated)] disabled:opacity-40"
                                  >
                                    Reproducir después
                                  </button>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    disabled={
                                      !playlist.trackIds.some((trackId) =>
                                        albumTracksById.has(trackId)
                                      )
                                    }
                                    onClick={() => {
                                      const coverTrack = playlist.trackIds
                                        .map((trackId) => albumTracksById.get(trackId))
                                        .find((track): track is Track => Boolean(track));
                                      if (coverTrack) {
                                        setPlaylistCoverTargetId(playlist.id);
                                        setCoverSearchTrack(coverTrack);
                                      }
                                      setOpenPlaylistActionsId(null);
                                    }}
                                    className="rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-elevated)] disabled:opacity-40"
                                  >
                                    Cambiar portada
                                  </button>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      duplicatePlaylist(playlist.id);
                                      setOpenPlaylistActionsId(null);
                                    }}
                                    className="rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                                  >
                                    Duplicar
                                  </button>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      openEditPlaylistModal(playlist.id);
                                      setOpenPlaylistActionsId(null);
                                    }}
                                    className="rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      setPlaylistDeleteTargetId(playlist.id);
                                      setOpenPlaylistActionsId(null);
                                    }}
                                    className="rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-500/10"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })()
                    )}
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl border border-dashed border-[var(--glass-border)] px-4 py-3 text-center text-xs text-[var(--text-muted)]">
                    Todavía no tienes playlists guardadas. Crea una a partir de la cola actual.
                  </p>
                )}
              </section>

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
                    title="Start the playlist from a random track"
                  >
                    Play random
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
                  <button
                    type="button"
                    onClick={clearUpcomingTracks}
                    aria-label="Limpiar canciones próximas de la cola"
                    disabled={upcomingTrackCount === 0}
                    title="Remove only upcoming tracks"
                    className="rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] transition-all hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Clear upcoming
                  </button>
                  <button
                    type="button"
                    onClick={toggleShuffle}
                    aria-label={
                      shuffleEnabled
                        ? 'Desactivar reproducción aleatoria'
                        : 'Activar reproducción aleatoria'
                    }
                    aria-pressed={shuffleEnabled}
                    title={shuffleEnabled ? 'Disable shuffle' : 'Enable shuffle'}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                      shuffleEnabled
                        ? 'border-[var(--accent-primary)] bg-[color-mix(in_srgb,var(--accent-primary)_16%,var(--bg-main))] text-[var(--accent-primary)]'
                        : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Shuffle size={14} />
                    Shuffle
                  </button>
                  <button
                    type="button"
                    onClick={cycleRepeatMode}
                    aria-label={repeatLabel}
                    title={repeatLabel}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                      repeatMode !== 'off'
                        ? 'border-[var(--accent-secondary)] bg-[color-mix(in_srgb,var(--accent-secondary)_16%,var(--bg-main))] text-[var(--accent-secondary)]'
                        : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {repeatMode === 'one' ? <Repeat1 size={14} /> : <Repeat size={14} />}
                    {repeatMode === 'one' ? 'Once' : repeatMode === 'all' ? 'All' : 'Repeat'}
                  </button>
                </div>
              </div>

              <div className="mx-4 mt-4 rounded-[28px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 shadow-[var(--glass-shadow)] backdrop-blur-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-[var(--text-muted)]">
                      Now playing
                    </p>
                    {currentTrack && isPlaylistContext ? (
                      <>
                        <p className={`mt-2 truncate text-lg font-black ${selectedAccentClass}`}>
                          {currentTrack.title}
                        </p>
                        <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                          {currentTrack.artist}
                        </p>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                          <div
                            className="h-full rounded-full bg-[var(--accent-primary)] transition-[width]"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                          <span>{formatDuration(seek)}</span>
                          <span>{formatDuration(duration)}</span>
                        </div>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Reproduce una pista desde esta playlist para ver aquí el estado de la cola.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      disabled={!currentTrack || !isPlaylistContext}
                      aria-label={
                        isPlaying ? 'Pause current playlist track' : 'Play current playlist track'
                      }
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[var(--bg-main)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isPlaying ? <Pause size={17} /> : <Play size={17} />}
                    </button>
                    <button
                      type="button"
                      onClick={playNextTrack}
                      disabled={!currentTrack || !isPlaylistContext}
                      aria-label="Play next playlist track"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--glass-border)] text-[var(--text-main)] transition-colors hover:bg-[var(--bg-elevated)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <SkipForward size={17} />
                    </button>
                  </div>
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
                        {currentQueueIndex >= 0 ? currentQueueIndex + 1 : 0}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-4">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                        Up next
                      </p>
                      <p className="mt-2 text-2xl font-black text-[var(--text-main)]">
                        {upcomingTrackCount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-dashed border-[var(--glass-border)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    {currentTrack && isPlaylistContext
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
                    const isSelected = isPlaylistContext && currentTrack?.id === track.id;
                    const isDropTarget = dropTargetTrackId === track.id;

                    return (
                      <div
                        key={track.id}
                        draggable
                        onClick={() => (isSelected ? togglePlay() : setTrack(track, 'playlist'))}
                        onDragStart={(event) => handlePlaylistDragStart(event, track.id)}
                        onDragOver={(event) => handlePlaylistDragOver(event, track.id)}
                        onDrop={(event) => handlePlaylistDrop(event, track.id)}
                        onDragEnd={() => {
                          setDraggedPlaylistTrackId(null);
                          setDropTargetTrackId(null);
                        }}
                        className={`library-track-row group grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all cursor-grab active:cursor-grabbing ${
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
                          className={`${queueActionButtonBaseClass} border-transparent text-[var(--text-muted)] opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500`}
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
          ))}
      </div>
    </div>
  );
};
