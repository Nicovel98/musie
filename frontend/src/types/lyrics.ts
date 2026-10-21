export type LyricsSource = 'manual' | 'automatic';
export type LyricsFormat = 'plain' | 'synced';

export interface LyricsLine {
  text: string;
  startTimeMs?: number;
}

export interface LyricsDocument {
  version: 1;
  source: LyricsSource;
  format: LyricsFormat;
  language?: string;
  lines: LyricsLine[];
  updatedAt: number;
  provider?: string;
}

export const parseLyricsText = (
  text: string,
  source: LyricsSource,
  provider?: string
): LyricsDocument => {
  const lines: LyricsLine[] = [];
  const timestampPattern = /^\[(\d{1,3}):([0-5]\d)(?:[.:](\d{1,3}))?\]\s*(.*)$/;

  text.split(/\r?\n/).forEach((rawLine) => {
    const match = rawLine.match(timestampPattern);
    if (!match) {
      if (rawLine.trim()) lines.push({ text: rawLine.trim() });
      return;
    }

    const [, minutes, seconds, fraction = '0', lineText] = match;
    const fractionMs = fraction.length === 1 ? Number(fraction) * 100 : Number(fraction);
    lines.push({
      text: lineText.trim(),
      startTimeMs: Number(minutes) * 60_000 + Number(seconds) * 1_000 + fractionMs,
    });
  });

  const hasTimestamps = lines.some((line) => line.startTimeMs !== undefined);
  return {
    version: 1,
    source,
    format: hasTimestamps ? 'synced' : 'plain',
    lines,
    updatedAt: Date.now(),
    ...(provider ? { provider } : {}),
  };
};

export const lyricsToText = (lyrics: LyricsDocument) =>
  lyrics.lines
    .map((line) => {
      if (lyrics.format !== 'synced' || line.startTimeMs === undefined) return line.text;
      const totalCentiseconds = Math.floor(line.startTimeMs / 10);
      const minutes = Math.floor(totalCentiseconds / 6000);
      const seconds = Math.floor((totalCentiseconds % 6000) / 100);
      const centiseconds = totalCentiseconds % 100;
      return `[${minutes}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}] ${line.text}`;
    })
    .join('\n');

export const normalizeLyricsDocument = (value: unknown): LyricsDocument | null => {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<LyricsDocument>;
  if (
    candidate.version !== 1 ||
    (candidate.source !== 'manual' && candidate.source !== 'automatic') ||
    (candidate.format !== 'plain' && candidate.format !== 'synced') ||
    !Array.isArray(candidate.lines)
  ) {
    return null;
  }

  const lines = candidate.lines
    .filter((line): line is LyricsLine => {
      if (!line || typeof line !== 'object' || typeof line.text !== 'string') return false;
      return (
        line.startTimeMs === undefined ||
        (typeof line.startTimeMs === 'number' &&
          Number.isFinite(line.startTimeMs) &&
          line.startTimeMs >= 0)
      );
    })
    .map((line) => ({
      text: line.text.slice(0, 2000),
      ...(line.startTimeMs === undefined ? {} : { startTimeMs: line.startTimeMs }),
    }));

  if (typeof candidate.updatedAt !== 'number' || !Number.isFinite(candidate.updatedAt)) {
    return null;
  }

  return {
    version: 1,
    source: candidate.source,
    format: candidate.format,
    language: typeof candidate.language === 'string' ? candidate.language.slice(0, 16) : undefined,
    lines,
    updatedAt: candidate.updatedAt,
    provider: typeof candidate.provider === 'string' ? candidate.provider.slice(0, 80) : undefined,
  };
};
