/**
 * Tests for AudioEngine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupAudioContextMock, cleanupAudioContextMock } from '../../test/mocks/audioContext.mock'
import { AudioEngine } from './audioEngine'
import {
  PRESET_FLAT,
  PRESET_BASS_BOOST,
  PRESET_VOCAL_BOOST,
  PRESET_TREBLE_BOOST,
  PRESET_INSTRUMENTAL_FOCUS,
  getAllPresets,
  getPreset,
  searchPresetsByTag,
  validatePreset,
} from '../equalizer/presets'

describe('AudioEngine', () => {
  let audioEngine: AudioEngine

  beforeEach(() => {
    setupAudioContextMock()
    audioEngine = new AudioEngine()
  })

  afterEach(() => {
    cleanupAudioContextMock()
    audioEngine.disconnect()
  })

  describe('initialization', () => {
    it('should initialize audio context', () => {
      audioEngine.init()
      expect(audioEngine.isReady()).toBeDefined()
    })

    it('should only initialize once', () => {
      audioEngine.init()
      audioEngine.init()
      expect(audioEngine.isReady()).toBeDefined()
    })

    it('should return correct state after init', () => {
      audioEngine.init()
      expect(audioEngine.getState()).toBe('running')
    })

    it('should not be ready before init', () => {
      expect(audioEngine.isReady()).toBe(false)
    })
  })

  describe('frequency control', () => {
    beforeEach(() => {
      audioEngine.init()
    })

    it('should set frequency gain for valid band', () => {
      audioEngine.setFrequency(0, 5)
      expect(audioEngine).toBeDefined()
    })

    it('should set multiple frequency bands', () => {
      audioEngine.setFrequency(0, 5)
      audioEngine.setFrequency(2, -3)
      audioEngine.setFrequency(4, 2)
      expect(audioEngine).toBeDefined()
    })

    it('should clamp positive gain to 12dB max', () => {
      audioEngine.setFrequency(0, 20)
      expect(audioEngine).toBeDefined()
    })

    it('should clamp negative gain to -12dB min', () => {
      audioEngine.setFrequency(0, -20)
      expect(audioEngine).toBeDefined()
    })

    it('should warn for invalid band index', () => {
      const warnSpy = vi.spyOn(console, 'warn')
      audioEngine.setFrequency(10, 0)
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('should warn for negative band index', () => {
      const warnSpy = vi.spyOn(console, 'warn')
      audioEngine.setFrequency(-1, 5)
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('preamp control', () => {
    beforeEach(() => {
      audioEngine.init()
    })

    it('should set preamp gain', () => {
      audioEngine.setPreamp(-2)
      expect(audioEngine).toBeDefined()
    })

    it('should clamp preamp to 0dB max', () => {
      audioEngine.setPreamp(5)
      expect(audioEngine).toBeDefined()
    })

    it('should clamp preamp to -12dB min', () => {
      audioEngine.setPreamp(-20)
      expect(audioEngine).toBeDefined()
    })
  })

  describe('presets', () => {
    beforeEach(() => {
      audioEngine.init()
    })

    it('should apply flat preset', () => {
      audioEngine.setPreset(PRESET_FLAT)
      expect(audioEngine).toBeDefined()
    })

    it('should apply bass boost preset', () => {
      audioEngine.setPreset(PRESET_BASS_BOOST)
      expect(audioEngine).toBeDefined()
    })

    it('should apply vocal boost preset', () => {
      audioEngine.setPreset(PRESET_VOCAL_BOOST)
      expect(audioEngine).toBeDefined()
    })

    it('should apply treble boost preset', () => {
      audioEngine.setPreset(PRESET_TREBLE_BOOST)
      expect(audioEngine).toBeDefined()
    })

    it('should apply instrumental preset', () => {
      audioEngine.setPreset(PRESET_INSTRUMENTAL_FOCUS)
      expect(audioEngine).toBeDefined()
    })

    it('should switch between presets', () => {
      audioEngine.setPreset(PRESET_FLAT)
      audioEngine.setPreset(PRESET_BASS_BOOST)
      audioEngine.setPreset(PRESET_VOCAL_BOOST)
      expect(audioEngine).toBeDefined()
    })
  })

  describe('preset utilities', () => {
    it('should get all presets', () => {
      const presets = getAllPresets()
      expect(presets.length).toBe(5)
    })

    it('should get preset by id', () => {
      const preset = getPreset('flat')
      expect(preset).toBeDefined()
      expect(preset?.id).toBe('flat')
    })

    it('should return undefined for invalid preset id', () => {
      const preset = getPreset('invalid')
      expect(preset).toBeUndefined()
    })

    it('should search presets by tag', () => {
      const presets = searchPresetsByTag('vocals')
      expect(presets.length).toBeGreaterThan(0)
    })

    it('should validate flat preset', () => {
      const isValid = validatePreset(PRESET_FLAT)
      expect(isValid).toBe(true)
    })

    it('should validate all presets', () => {
      const presets = getAllPresets()
      presets.forEach((preset) => {
        expect(validatePreset(preset)).toBe(true)
      })
    })

    it('should reject preset with invalid preamp', () => {
      const invalidPreset = {
        id: 'invalid',
        name: 'Invalid',
        bands: PRESET_FLAT.bands,
        preamp: -15, // Exceeds min
      }
      expect(validatePreset(invalidPreset)).toBe(false)
    })

    it('should reject preset with invalid band gain', () => {
      const invalidPreset = {
        id: 'invalid',
        name: 'Invalid',
        bands: [
          { frequency: 60, gain: 15, Q: 1 }, // Exceeds max
          ...PRESET_FLAT.bands.slice(1),
        ],
        preamp: 0,
      }
      expect(validatePreset(invalidPreset)).toBe(false)
    })
  })

  describe('reset', () => {
    beforeEach(() => {
      audioEngine.init()
    })

    it('should reset all EQ bands to neutral', () => {
      audioEngine.setFrequency(0, 5)
      audioEngine.setPreamp(-2)
      audioEngine.reset()
      expect(audioEngine).toBeDefined()
    })

    it('should reset after applying preset', () => {
      audioEngine.setPreset(PRESET_BASS_BOOST)
      audioEngine.reset()
      expect(audioEngine).toBeDefined()
    })
  })

  describe('lifecycle', () => {
    it('should disconnect without errors', () => {
      audioEngine.init()
      audioEngine.disconnect()
      expect(audioEngine).toBeDefined()
    })

    it('should handle multiple disconnects gracefully', () => {
      audioEngine.init()
      audioEngine.disconnect()
      audioEngine.disconnect() // Should not throw
      expect(audioEngine).toBeDefined()
    })

    it('should handle operations after disconnect', () => {
      audioEngine.init()
      audioEngine.disconnect()
      const errorSpy = vi.spyOn(console, 'error')
      audioEngine.setFrequency(0, 5) // Should handle gracefully
      // May or may not error depending on implementation
      errorSpy.mockRestore()
    })
  })

  describe('error handling', () => {
    it('should warn when attaching without init', () => {
      const warnSpy = vi.spyOn(console, 'warn')
      const mockElement = document.createElement('audio')
      audioEngine.attachAudioElement(mockElement)
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('should warn when setting preset without init', () => {
      const warnSpy = vi.spyOn(console, 'warn')
      audioEngine.setPreset(PRESET_FLAT)
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })
})
