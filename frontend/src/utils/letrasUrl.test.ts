import { describe, expect, it } from 'vitest';
import { buildLetrasSearchUrl, buildYouTubeSearchUrl } from './letrasUrl';

describe('buildLetrasSearchUrl', () => {
  it('builds an artist path and encoded song query', () => {
    expect(buildLetrasSearchUrl('Stevie Wonder', 'Isn’t She Lovely')).toBe(
      'https://www.letras.com/stevie-wonder/?q=Isn%E2%80%99t%20She%20Lovely'
    );
  });

  it('normalizes accents, punctuation, and repeated separators in artists', () => {
    expect(buildLetrasSearchUrl('Beyoncé & Jay-Z', 'Crazy in Love?')).toBe(
      'https://www.letras.com/beyonce-jay-z/?q=Crazy%20in%20Love%3F'
    );
  });

  it('uses the artist included in a compound track title', () => {
    expect(buildLetrasSearchUrl('Unknown Artist', 'Metallica - Whiskey In The Jar')).toBe(
      'https://www.letras.com/metallica/?q=Whiskey%20In%20The%20Jar'
    );
  });

  it('supports en and em dash separators in compound track titles', () => {
    expect(buildLetrasSearchUrl('Unknown Artist', 'Beyoncé – Halo')).toBe(
      'https://www.letras.com/beyonce/?q=Halo'
    );
  });

  it('falls back to global search when the artist cannot form a slug', () => {
    expect(buildLetrasSearchUrl('!!!', 'Song')).toBe('https://www.letras.com/search/?q=!!!%20Song');
  });

  it('uses the artist from the compound title in YouTube cover searches', () => {
    expect(buildYouTubeSearchUrl('Unknown Artist', 'Metallica - Whiskey In The Jar')).toBe(
      'https://www.youtube.com/results?search_query=Metallica%20Whiskey%20In%20The%20Jar'
    );
  });
});
