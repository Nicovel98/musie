/**
 * Predefined audio presets for Musie Equalizer
 */

import type { AudioPreset } from '../../types/audio'

export const PRESET_FLAT: AudioPreset = {
  id: 'flat',
  name: 'Flat',
  description: 'Neutral, no EQ modifications',
  bands: [
    { frequency: 60, gain: 0, Q: 1 },
    { frequency: 250, gain: 0, Q: 1 },
    { frequency: 1500, gain: 0, Q: 1 },
    { frequency: 8000, gain: 0, Q: 1 },
    { frequency: 12000, gain: 0, Q: 1 },
  ],
  preamp: 0,
  tags: ['neutral', 'default'],
}

export const PRESET_VOCAL_BOOST: AudioPreset = {
  id: 'vocal-boost',
  name: 'Vocal Boost',
  description: 'Enhances vocals and mid-range clarity',
  bands: [
    { frequency: 60, gain: 0, Q: 1 },
    { frequency: 250, gain: 2, Q: 1 },
    { frequency: 1500, gain: 3, Q: 1 },
    { frequency: 8000, gain: 2, Q: 1 },
    { frequency: 12000, gain: 0, Q: 1 },
  ],
  preamp: -2,
  tags: ['vocals', 'clarity'],
}

export const PRESET_BASS_BOOST: AudioPreset = {
  id: 'bass-boost',
  name: 'Bass Boost',
  description: 'Emphasizes low frequencies and bass',
  bands: [
    { frequency: 60, gain: 5, Q: 0.7 },
    { frequency: 250, gain: 3, Q: 1 },
    { frequency: 1500, gain: 0, Q: 1 },
    { frequency: 8000, gain: 0, Q: 1 },
    { frequency: 12000, gain: 0, Q: 1 },
  ],
  preamp: -3,
  tags: ['bass', 'low-end'],
}

export const PRESET_TREBLE_BOOST: AudioPreset = {
  id: 'treble-boost',
  name: 'Treble Boost',
  description: 'Brings out high frequencies and brilliance',
  bands: [
    { frequency: 60, gain: 0, Q: 1 },
    { frequency: 250, gain: 0, Q: 1 },
    { frequency: 1500, gain: 1, Q: 1 },
    { frequency: 8000, gain: 2, Q: 1 },
    { frequency: 12000, gain: 4, Q: 1 },
  ],
  preamp: -2,
  tags: ['treble', 'high-end', 'brilliance'],
}

export const PRESET_INSTRUMENTAL_FOCUS: AudioPreset = {
  id: 'instrumental',
  name: 'Instrumental Focus',
  description: 'Optimized for instrumental music with balanced instruments',
  bands: [
    { frequency: 60, gain: 2, Q: 1 },
    { frequency: 250, gain: -1, Q: 1 },
    { frequency: 1500, gain: -2, Q: 1 },
    { frequency: 8000, gain: 1, Q: 1 },
    { frequency: 12000, gain: 2, Q: 1 },
  ],
  preamp: 0,
  tags: ['instrumental', 'classical', 'jazz'],
}

export const PRESETS: Record<string, AudioPreset> = {
  flat: PRESET_FLAT,
  'vocal-boost': PRESET_VOCAL_BOOST,
  'bass-boost': PRESET_BASS_BOOST,
  'treble-boost': PRESET_TREBLE_BOOST,
  instrumental: PRESET_INSTRUMENTAL_FOCUS,
}

/**
 * Get all available presets
 */
export function getAllPresets(): AudioPreset[] {
  return Object.values(PRESETS)
}

/**
 * Get preset by ID
 */
export function getPreset(id: string): AudioPreset | undefined {
  return PRESETS[id]
}

/**
 * Search presets by tag
 */
export function searchPresetsByTag(tag: string): AudioPreset[] {
  return Object.values(PRESETS).filter((preset) => preset.tags?.includes(tag))
}

/**
 * Validate preset values (prevent clipping)
 */
export function validatePreset(preset: AudioPreset): boolean {
  // Check preamp: -12 to 0 dB
  if (preset.preamp < -12 || preset.preamp > 0) return false

  // Check band gains: -12 to +12 dB
  return preset.bands.every((band) => band.gain >= -12 && band.gain <= 12)
}
