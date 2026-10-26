import { useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export const useProgress = () => {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const updateProgress = usePlayerStore((state) => state.updateProgress);

  useEffect(() => {
    if (!isPlaying) return;

    let interval: number | undefined;

    const stopInterval = () => {
      if (interval !== undefined) {
        window.clearInterval(interval);
        interval = undefined;
      }
    };

    const startInterval = () => {
      stopInterval();
      if (document.visibilityState !== 'visible') return;

      updateProgress();
      interval = window.setInterval(updateProgress, 1000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startInterval();
      } else {
        stopInterval();
      }
    };

    startInterval();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopInterval();
    };
  }, [isPlaying, updateProgress]);
};
