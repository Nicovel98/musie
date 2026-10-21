import { describe, expect, it } from 'vitest';
import { normalizeLyricsDocument } from './lyrics';

describe('lyrics document normalization', () => {
  it('keeps valid synced lyrics and bounds untrusted text fields', () => {
    const lyrics = normalizeLyricsDocument({
      version: 1,
      source: 'automatic',
      format: 'synced',
      language: 'es-ES-with-extra-data',
      provider: 'provider'.repeat(30),
      updatedAt: 123,
      lines: [{ text: 'Line 1', startTimeMs: 1200 }],
    });

    expect(lyrics).toMatchObject({
      version: 1,
      source: 'automatic',
      format: 'synced',
      language: 'es-ES-with-extra',
      provider: 'provider'.repeat(10),
      lines: [{ text: 'Line 1', startTimeMs: 1200 }],
    });
  });

  it('rejects malformed documents and invalid timestamps', () => {
    expect(normalizeLyricsDocument({ version: 1, lines: [] })).toBeNull();
    expect(
      normalizeLyricsDocument({
        version: 1,
        source: 'manual',
        format: 'synced',
        updatedAt: Date.now(),
        lines: [{ text: 'Invalid', startTimeMs: -1 }],
      })
    ).toMatchObject({
      lines: [],
    });
  });
});
