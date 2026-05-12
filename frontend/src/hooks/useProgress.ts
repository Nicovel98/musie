import { useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export const useProgress = () => {
  const { updateProgress, isPlaying } = usePlayerStore();

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      updateProgress();
    }, 1000); // Se actualiza cada segundo

    return () => clearInterval(interval);
  }, [isPlaying, updateProgress]);
};
