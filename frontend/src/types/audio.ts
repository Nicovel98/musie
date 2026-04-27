/**
 * Audio-related TypeScript types
 */

export type EQBandType = 'peaking' | 'lowshelf' | 'highshelf' | 'lowpass' | 'highpass'

export type EQBand = {
  frequency: number
  gain: number
  Q: number
  type?: EQBandType
}

export type AudioPreset = {
  id: string
  name: string
  description?: string
  bands: EQBand[]
  preamp: number
  tags?: string[]
}

export type AudioEngineConfig = {
  sampleRate?: number
  numberOfChannels?: number
  latencyHint?: 'interactive' | 'balanced' | 'playback'
}

export type AudioState = 'idle' | 'playing' | 'paused' | 'error'
