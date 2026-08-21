import { formatDuration, getDurationInputMax } from '../utils/time';

interface VisualizerBarsProps {
  audioData: Uint8Array;
  seek: number;
  duration: number;
  progressPercent: number;
  minBarHeight: number;
  onSeekChange: (value: string) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
  wrapperClassName: string;
  barsRowClassName: string;
  barTransitionClassName: string;
  playedBarClassName: string;
  inactiveBarClassName: string;
  inputClassName: string;
  progressRowClassName: string;
  progressTrackClassName: string;
  progressFillClassName: string;
  timeClassName: string;
}

export const VisualizerBars = ({
  audioData,
  seek,
  duration,
  progressPercent,
  minBarHeight,
  onSeekChange,
  onScrubStart,
  onScrubEnd,
  wrapperClassName,
  barsRowClassName,
  barTransitionClassName,
  playedBarClassName,
  inactiveBarClassName,
  inputClassName,
  progressRowClassName,
  progressTrackClassName,
  progressFillClassName,
  timeClassName,
}: VisualizerBarsProps) => {
  const playedBars = Math.min(
    audioData.length,
    Math.ceil((progressPercent / 100) * audioData.length)
  );

  return (
    <div className={wrapperClassName}>
      <div className={barsRowClassName}>
        <input
          type="range"
          min="0"
          max={getDurationInputMax(duration)}
          step="0.1"
          value={seek}
          onPointerDown={onScrubStart}
          onPointerUp={onScrubEnd}
          onPointerCancel={onScrubEnd}
          onChange={(e) => onSeekChange(e.target.value)}
          aria-label="Seek"
          className={inputClassName}
        />
        {Array.from(audioData).map((v, i) => {
          const isPlayed = i < playedBars;
          const normalized = Math.max(0, Math.min(1, v / 255));
          const shaped = Math.pow(normalized, 1.35);
          const barHeight = minBarHeight + shaped * (100 - minBarHeight);

          return (
            <div
              key={i}
              className={`flex-1 rounded-full ${barTransitionClassName} ${
                isPlayed ? playedBarClassName : inactiveBarClassName
              }`}
              style={{ height: `${barHeight}%` }}
            />
          );
        })}
      </div>

      <div className={progressRowClassName}>
        <span className={timeClassName}>{formatDuration(seek)}</span>
        <div className={progressTrackClassName}>
          <div className={progressFillClassName} style={{ width: `${progressPercent}%` }} />
        </div>
        <span className={timeClassName}>{formatDuration(duration)}</span>
      </div>
    </div>
  );
};
