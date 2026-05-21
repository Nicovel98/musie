import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

const downsampleAudioData = (source: Uint8Array, targetBars: number) => {
  if (source.length === 0 || targetBars <= 0) return new Uint8Array(0);

  const output = new Uint8Array(targetBars);
  const segmentSize = source.length / targetBars;

  for (let bar = 0; bar < targetBars; bar += 1) {
    const start = Math.floor(bar * segmentSize);
    const end = Math.max(start + 1, Math.floor((bar + 1) * segmentSize));

    let total = 0;
    let samples = 0;

    for (let index = start; index < end && index < source.length; index += 1) {
      total += source[index];
      samples += 1;
    }

    output[bar] = samples > 0 ? Math.round(total / samples) : source[start] || 0;
  }

  return output;
};

const clampByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const averageRange = (source: Uint8Array, startRatio: number, endRatio: number) => {
  if (source.length === 0) return 0;

  const start = Math.max(0, Math.floor(source.length * startRatio));
  const end = Math.min(source.length, Math.max(start + 1, Math.floor(source.length * endRatio)));

  let total = 0;
  let samples = 0;

  for (let index = start; index < end; index += 1) {
    total += source[index];
    samples += 1;
  }

  return samples > 0 ? total / samples : 0;
};

export const useVisualizer = (targetBars = 48) => {
  // Obtenemos el analizador y el estado de reproducción del Store de Zustand
  const { analyzer, isPlaying } = usePlayerStore();

  // Guardamos los datos de las frecuencias en un array de bytes (0 a 255)
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
  const previousFrameRef = useRef<Uint8Array>(new Uint8Array(0));
  const previousSourceRef = useRef<Uint8Array>(new Uint8Array(0));
  const pulseRef = useRef(0);

  useEffect(() => {
    // Si no hay música sonando o no hay analizador, no hacemos nada
    if (!analyzer || !isPlaying) return;

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const attackFactor = 0.68;
    const releaseFactor = 0.48;
    const pulseAttack = 0.46;
    const pulseRelease = 0.64;
    let isActive = true;
    let animationFrameId = 0;

    const update = () => {
      if (!isActive) return;

      // 1. Obtenemos los datos actuales de la frecuencia
      analyzer.getByteFrequencyData(dataArray);

      const previousSource = previousSourceRef.current;
      let flux = 0;

      if (previousSource.length === dataArray.length && previousSource.length > 0) {
        for (let index = 0; index < dataArray.length; index += 1) {
          const delta = dataArray[index] - previousSource[index];
          if (delta > 0) flux += delta;
        }
      }

      previousSourceRef.current = new Uint8Array(dataArray);

      const lowEnergy = averageRange(dataArray, 0, 0.28);
      const highEnergy = averageRange(dataArray, 0.72, 1);
      const tonalEnergy = Math.min(1, (lowEnergy + highEnergy) / (2 * 255));

      const normalizedFlux = Math.min(1, flux / Math.max(1, dataArray.length * 16));
      const nextPulse =
        normalizedFlux > pulseRef.current
          ? pulseRef.current + (normalizedFlux - pulseRef.current) * pulseAttack
          : pulseRef.current + (normalizedFlux - pulseRef.current) * pulseRelease;

      pulseRef.current = Math.max(0, Math.min(1, nextPulse));

      // 2. Reducimos la resolución al número de barras visible y suavizamos el salto entre frames
      const nextFrame = downsampleAudioData(dataArray, targetBars);
      const previousFrame = previousFrameRef.current;

      if (previousFrame.length === nextFrame.length && previousFrame.length > 0) {
        const blendedFrame = new Uint8Array(nextFrame.length);
        const pulseBoost = pulseRef.current * 20;
        const tonalBoost = tonalEnergy * 14;

        for (let index = 0; index < nextFrame.length; index += 1) {
          const position = index / Math.max(1, nextFrame.length - 1);
          const edgeWeight = 0.9 + Math.abs(position * 2 - 1) * 0.22;
          const bassWeight = position < 0.28 ? 1 + (0.28 - position) * 1.2 : 1;
          const trebleWeight = position > 0.72 ? 1 + (position - 0.72) * 1.2 : 1;
          const shapedTarget = Math.min(
            220,
            clampByte(
              nextFrame[index] * edgeWeight * bassWeight * trebleWeight +
                pulseBoost * edgeWeight +
                tonalBoost * edgeWeight
            )
          );
          const current = previousFrame[index];
          const smoothing = shapedTarget > current ? attackFactor : releaseFactor;

          blendedFrame[index] = clampByte(current + (shapedTarget - current) * smoothing);
        }

        previousFrameRef.current = blendedFrame;
        setAudioData(blendedFrame);
      } else {
        previousFrameRef.current = nextFrame;
        setAudioData(nextFrame);
      }

      // 3. Solicitamos el siguiente frame de animación (aprox. 60fps)
      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    // Limpieza al desmontar el componente o pausar
    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyzer, isPlaying, targetBars]);

  return audioData;
};
