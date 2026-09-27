import { useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export const useProgress = () => {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const updateProgress = usePlayerStore((state) => state.updateProgress);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      updateProgress();
    }, 1000); // Se actualiza cada segundo

    return () => clearInterval(interval);
  }, [isPlaying, updateProgress]);
};
