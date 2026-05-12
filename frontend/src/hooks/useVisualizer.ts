import { useEffect, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export const useVisualizer = () => {
  // Obtenemos el analizador y el estado de reproducción del Store de Zustand
  const { analyzer, isPlaying } = usePlayerStore();

  // Guardamos los datos de las frecuencias en un array de bytes (0 a 255)
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));

  useEffect(() => {
    // Si no hay música sonando o no hay analizador, no hacemos nada
    if (!analyzer || !isPlaying) return;

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      // 1. Obtenemos los datos actuales de la frecuencia
      analyzer.getByteFrequencyData(dataArray);

      // 2. Actualizamos el estado con una copia de los datos para que React redibuje
      setAudioData(new Uint8Array(dataArray));

      // 3. Solicitamos el siguiente frame de animación (aprox. 60fps)
      requestAnimationFrame(update);
    };

    const animationId = requestAnimationFrame(update);

    // Limpieza al desmontar el componente o pausar
    return () => cancelAnimationFrame(animationId);
  }, [analyzer, isPlaying]);

  return audioData;
};
