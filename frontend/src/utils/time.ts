export const formatDuration = (seconds?: number) => {
  if (!Number.isFinite(seconds) || seconds === undefined || seconds < 0) return '--:--';

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(totalSeconds % 60).padStart(2, '0');

  return hours > 0
    ? `${hours}:${paddedMinutes}:${paddedSeconds}`
    : `${paddedMinutes}:${paddedSeconds}`;
};

export const getProgressPercent = (seek: number, duration: number) => {
  if (!Number.isFinite(seek) || !Number.isFinite(duration) || duration <= 0) return 0;

  return Math.min(100, Math.max(0, (seek / duration) * 100));
};

export const getDurationInputMax = (duration: number) =>
  Number.isFinite(duration) && duration > 0 ? duration : 0;
