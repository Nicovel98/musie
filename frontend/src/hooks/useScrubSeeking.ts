import { useEffect, useRef } from 'react';

interface UseScrubSeekingOptions {
  isPlaying: boolean;
  togglePlay: () => void;
  fastSeek: (seek: number) => void;
}

export const useScrubSeeking = ({ isPlaying, togglePlay, fastSeek }: UseScrubSeekingOptions) => {
  const scrubResumeRef = useRef(false);
  const scrubActiveRef = useRef(false);
  const seekRafRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (seekRafRef.current !== null) {
        cancelAnimationFrame(seekRafRef.current);
      }
    };
  }, []);

  const handleSeekChange = (value: string) => {
    const nextSeek = Number(value);
    if (!Number.isFinite(nextSeek)) return;

    pendingSeekRef.current = nextSeek;

    if (seekRafRef.current !== null) return;

    seekRafRef.current = requestAnimationFrame(() => {
      seekRafRef.current = null;
      const seekValue = pendingSeekRef.current;
      if (seekValue !== null) fastSeek(seekValue);
    });
  };

  const handleScrubStart = () => {
    if (scrubActiveRef.current) return;

    scrubActiveRef.current = true;
    scrubResumeRef.current = isPlaying;

    if (isPlaying) {
      togglePlay();
    }
  };

  const handleScrubEnd = () => {
    if (!scrubActiveRef.current) return;

    scrubActiveRef.current = false;

    if (seekRafRef.current !== null) {
      cancelAnimationFrame(seekRafRef.current);
      seekRafRef.current = null;
    }

    const seekValue = pendingSeekRef.current;
    pendingSeekRef.current = null;

    if (seekValue !== null) {
      fastSeek(seekValue);
    }

    if (scrubResumeRef.current) {
      togglePlay();
    }

    scrubResumeRef.current = false;
  };

  return {
    handleSeekChange,
    handleScrubStart,
    handleScrubEnd,
  };
};
