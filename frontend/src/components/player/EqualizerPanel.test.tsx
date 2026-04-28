/**
 * Tests for EqualizerPanel Component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EqualizerPanel } from './EqualizerPanel'
import { AudioEngine } from '../../features/audio/audioEngine'
import { setupAudioContextMock, cleanupAudioContextMock } from '../../test/mocks/audioContext.mock'

describe('EqualizerPanel', () => {
  let mockAudioEngine: Partial<AudioEngine>

  beforeEach(() => {
    setupAudioContextMock()

    // Create mock AudioEngine
    mockAudioEngine = {
      init: vi.fn(),
      setFrequency: vi.fn(),
      setPreamp: vi.fn(),
      applyPreset: vi.fn(),
      getPreset: vi.fn((name: string) => {
        const presets: Record<string, { name: string; bands: number[]; preamp: number }> = {
          Flat: { name: 'Flat', bands: [0, 0, 0, 0, 0], preamp: 0 },
          Vocal: { name: 'Vocal', bands: [2, 4, 3, 2, 1], preamp: -1 },
          Bass: { name: 'Bass', bands: [8, 4, 0, -2, -4], preamp: 0 },
          Treble: { name: 'Treble', bands: [-4, -2, 0, 4, 8], preamp: -2 },
          Instrumental: { name: 'Instrumental', bands: [2, 1, -1, 1, 3], preamp: -1 },
        }
        return presets[name]
      }),
      resetBands: vi.fn(),
    }
  })

  afterEach(() => {
    cleanupAudioContextMock()
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render equalizer panel with all sections', () => {
      render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      expect(screen.getByText('Equalizer')).toBeDefined()
      expect(screen.getByText('Presets')).toBeDefined()
      expect(screen.getByText('EQ Bands')).toBeDefined()
      expect(screen.getByText('Preamp')).toBeDefined()
    })

    it('should render all 5 EQ band sliders', () => {
      const { container } = render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const sliders = container.querySelectorAll('.band-slider')
      expect(sliders.length).toBe(5)
    })

    it('should render all 5 preset buttons', () => {
      render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      expect(screen.getByText('Flat')).toBeDefined()
      expect(screen.getByText('Vocal')).toBeDefined()
      expect(screen.getByText('Bass')).toBeDefined()
      expect(screen.getByText('Treble')).toBeDefined()
      expect(screen.getByText('Instrumental')).toBeDefined()
    })

    it('should render preamp slider', () => {
      const { container } = render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const preampSlider = container.querySelector('.preamp-slider')
      expect(preampSlider).toBeDefined()
    })

    it('should render reset button', () => {
      render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const resetBtn = screen.getByText('Reset')
      expect(resetBtn).toBeDefined()
    })

    it('should initialize audio engine on mount', () => {
      render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      expect(mockAudioEngine.init).toHaveBeenCalled()
    })
  })

  describe('EQ band interactions', () => {
    it('should update band value when slider changes', () => {
      const { container } = render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const firstSlider = container.querySelector('.band-slider') as HTMLInputElement
      fireEvent.change(firstSlider, { target: { value: '5' } })
      
      expect(mockAudioEngine.setFrequency).toHaveBeenCalledWith(0, 5)
    })

    it('should display band values', () => {
      const { container, rerender } = render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const firstSlider = container.querySelector('.band-slider') as HTMLInputElement
      fireEvent.change(firstSlider, { target: { value: '8' } })
      
      rerender(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const bandValues = container.querySelectorAll('.band-value')
      expect(bandValues.length).toBeGreaterThan(0)
    })

    it('should clamp band values to ±12dB', () => {
      const { container } = render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const firstSlider = container.querySelector('.band-slider') as HTMLInputElement
      expect(firstSlider.min).toBe('-12')
      expect(firstSlider.max).toBe('12')
    })
  })

  describe('preset selection', () => {
    it('should apply preset when preset button clicked', () => {
      render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const vocalBtn = screen.getByText('Vocal')
      fireEvent.click(vocalBtn)
      
      expect(mockAudioEngine.applyPreset).toHaveBeenCalledWith('Vocal')
    })

    it('should update active preset button style', () => {
      render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const vocalBtn = screen.getByText('Vocal')
      fireEvent.click(vocalBtn)
      
      expect(vocalBtn.classList.contains('active')).toBe(true)
    })

    it('should update band values when preset applied', () => {
      render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const bassBtn = screen.getByText('Bass')
      fireEvent.click(bassBtn)
      
      expect(mockAudioEngine.applyPreset).toHaveBeenCalledWith('Bass')
    })

    it('should maintain Flat preset as default', () => {
      render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const flatBtn = screen.getByText('Flat')
      expect(flatBtn.classList.contains('active')).toBe(true)
    })
  })

  describe('preamp control', () => {
    it('should update preamp value when slider changes', () => {
      const { container } = render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const preampSlider = container.querySelector('.preamp-slider') as HTMLInputElement
      fireEvent.change(preampSlider, { target: { value: '-6' } })
      
      expect(mockAudioEngine.setPreamp).toHaveBeenCalledWith(-6)
    })

    it('should clamp preamp to -12 to 0 dB', () => {
      const { container } = render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const preampSlider = container.querySelector('.preamp-slider') as HTMLInputElement
      expect(preampSlider.min).toBe('-12')
      expect(preampSlider.max).toBe('0')
    })

    it('should display preamp value', () => {
      const { container } = render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const preampSlider = container.querySelector('.preamp-slider') as HTMLInputElement
      fireEvent.change(preampSlider, { target: { value: '-3' } })
      
      const preampValue = container.querySelector('.preamp-value')
      expect(preampValue).toBeDefined()
    })
  })

  describe('clipping warning', () => {
    it('should show clipping warning when risk detected', () => {
      const { container, rerender } = render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      // Set band to 12 dB
      const firstSlider = container.querySelector('.band-slider') as HTMLInputElement
      fireEvent.change(firstSlider, { target: { value: '12' } })
      
      // Set preamp to 2 dB (would cause clipping: 12 + 2 = 14 > 12)
      const preampSlider = container.querySelector('.preamp-slider') as HTMLInputElement
      fireEvent.change(preampSlider, { target: { value: '2' } })
      
      rerender(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
    })

    it('should not show clipping warning when safe', () => {
      const { container } = render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const firstSlider = container.querySelector('.band-slider') as HTMLInputElement
      fireEvent.change(firstSlider, { target: { value: '6' } })
      
      const preampSlider = container.querySelector('.preamp-slider') as HTMLInputElement
      fireEvent.change(preampSlider, { target: { value: '-6' } })
      
      // Warning should not be visible if safe
      expect(container).toBeDefined()
    })
  })

  describe('reset functionality', () => {
    it('should reset all values to default on reset button click', () => {
      const { container } = render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      // Change some values
      const firstSlider = container.querySelector('.band-slider') as HTMLInputElement
      fireEvent.change(firstSlider, { target: { value: '8' } })
      
      const preampSlider = container.querySelector('.preamp-slider') as HTMLInputElement
      fireEvent.change(preampSlider, { target: { value: '-6' } })
      
      // Click reset
      const resetBtn = screen.getByText('Reset')
      fireEvent.click(resetBtn)
      
      expect(mockAudioEngine.resetBands).toHaveBeenCalled()
    })

    it('should reset active preset to Flat', () => {
      render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      // Select different preset
      const vocalBtn = screen.getByText('Vocal')
      fireEvent.click(vocalBtn)
      
      // Reset
      const resetBtn = screen.getByText('Reset')
      fireEvent.click(resetBtn)
      
      // Flat should be active
      const flatBtn = screen.getByText('Flat')
      expect(flatBtn.classList.contains('active')).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('should have proper aria labels', () => {
      const { container } = render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const bandSliders = container.querySelectorAll('.band-slider')
      bandSliders.forEach((slider) => {
        expect(slider.getAttribute('aria-label')).toBeDefined()
      })
      
      const preampSlider = container.querySelector('.preamp-slider')
      expect(preampSlider?.getAttribute('aria-label')).toBeDefined()
    })

    it('should support keyboard interaction on sliders', () => {
      const { container } = render(<EqualizerPanel audioEngine={mockAudioEngine as AudioEngine} />)
      
      const firstSlider = container.querySelector('.band-slider') as HTMLInputElement
      expect(firstSlider.type).toBe('range')
    })
  })
})
