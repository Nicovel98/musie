import { useState } from 'react';

export const useMute = (currentVolume: number, setVolume: (v: number) => void) => {
  const [lastVolume, setLastVolume] = useState(0.8);

  const mute = () => {
    if (currentVolume > 0) {
      setLastVolume(currentVolume); // Guarda el nivel actual
      setVolume(0);
    } else {
      setVolume(lastVolume); // Recupera el nivel anterior
    }
  };

  const unmute = () => {
    if (currentVolume === 0) {
      setVolume(lastVolume);
    }
  };

  return { mute, unmute, lastVolume };
};
