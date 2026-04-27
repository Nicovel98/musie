/**
 * Mock implementation of Web Audio API for testing
 * Provides a mock AudioContext and related nodes for unit tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi } from 'vitest'

/**
 * Mock BiquadFilterNode
 */
export const createMockBiquadFilterNode = () => ({
  type: 'peaking' as BiquadFilterType,
  frequency: { value: 1000 },
  gain: { value: 0 },
  Q: { value: 1 },
  connect: vi.fn(),
  disconnect: vi.fn(),
})

/**
 * Mock GainNode
 */
export const createMockGainNode = () => ({
  gain: { value: 1 },
  connect: vi.fn(),
  disconnect: vi.fn(),
})

/**
 * Mock MediaElementAudioSourceNode
 */
export const createMockMediaElementAudioSourceNode = () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
})

/**
 * Mock AudioContext class
 */
class MockAudioContext {
  state: AudioContextState = 'running'
  sampleRate: number = 44100
  currentTime: number = 0
  destination = {
    maxChannelCount: 2,
  }

  createBiquadFilter = vi.fn(() => createMockBiquadFilterNode())
  createGain = vi.fn(() => createMockGainNode())
  createMediaElementAudioSource = vi.fn(() => createMockMediaElementAudioSourceNode())
  resume = vi.fn(() => Promise.resolve())
  suspend = vi.fn(() => Promise.resolve())
  close = vi.fn(() => Promise.resolve())
  createAnalyser = vi.fn()
  createOscillator = vi.fn()
  createBufferSource = vi.fn()
  createBuffer = vi.fn()
  decodeAudioData = vi.fn()
}

/**
 * Setup global AudioContext mock for vitest
 */
export function setupAudioContextMock(): void {
  // Mock AudioContext global as a constructor
  if (typeof globalThis !== 'undefined') {
    globalThis.AudioContext = MockAudioContext as any
    ;(globalThis as any).webkitAudioContext = MockAudioContext
  }
}

/**
 * Clean up audio context mock
 */
export function cleanupAudioContextMock(): void {
  // Reset all mocks
  vi.clearAllMocks()
}
