interface ParsedTags {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  genre?: string;
  year?: number;
  coverUrl?: string;
}

interface MediaTags {
  title?: string;
  artist?: string;
  album?: string;
  albumartist?: string;
  genre?: string;
  year?: string | number;
  picture?: {
    data: number[];
    format: string;
  };
}

const getCoverUrl = (picture: MediaTags['picture']) => {
  if (!picture?.data?.length || !picture.format) return undefined;

  const binary = picture.data.reduce((result, byte) => result + String.fromCharCode(byte), '');
  return `data:${picture.format};base64,${btoa(binary)}`;
};

const readEmbeddedTags = async (file: File): Promise<ParsedTags> => {
  try {
    const { default: jsmediatags } = await import('jsmediatags/dist/jsmediatags.min.js');

    return await new Promise((resolve) => {
      jsmediatags.read(file, {
        onSuccess: ({ tags }) => {
          const mediaTags = tags as MediaTags;
          const parsedYear = Number(mediaTags.year);

          resolve({
            title: mediaTags.title?.trim() || undefined,
            artist: mediaTags.artist?.trim() || undefined,
            album: mediaTags.album?.trim() || undefined,
            albumArtist: mediaTags.albumartist?.trim() || undefined,
            genre: mediaTags.genre?.trim() || undefined,
            year: Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : undefined,
            coverUrl: getCoverUrl(mediaTags.picture),
          });
        },
        onError: () => resolve({}),
      });
    });
  } catch {
    return {};
  }
};

export const readTrackDuration = (source: Blob | string): Promise<number | undefined> =>
  new Promise((resolve) => {
    const objectUrl = typeof source === 'string' ? source : URL.createObjectURL(source);
    const audio = new Audio();
    let settled = false;

    function finish(duration?: number) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      if (typeof source !== 'string') URL.revokeObjectURL(objectUrl);
      audio.removeAttribute('src');
      resolve(duration);
    }

    const timeoutId = window.setTimeout(() => finish(), 15000);

    const handleDurationChange = () => {
      const duration =
        Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : undefined;
      if (duration !== undefined) finish(duration);
    };

    audio.preload = 'metadata';
    audio.onloadedmetadata = handleDurationChange;
    audio.ondurationchange = handleDurationChange;
    audio.onerror = () => finish();
    audio.src = objectUrl;
    audio.load();
  });

export const readTrackMetadata = async (
  file: File
): Promise<ParsedTags & { durationSeconds?: number }> => {
  const [tags, durationSeconds] = await Promise.all([
    readEmbeddedTags(file),
    readTrackDuration(file),
  ]);
  return { ...tags, durationSeconds };
};
