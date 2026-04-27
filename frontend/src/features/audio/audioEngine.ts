/**
 * AudioEngine - Web Audio API wrapper for Musie
 * Manages audio playback, equalization, and preset management
 */

export type EQBand = {
  /** Frequency in Hz (e.g., 60, 250, 1500, 8000) */
  frequency: number
  /** Gain in dB (e.g., -12 to +12) */
  gain: number
  /** Quality factor (e.g., 0.5 to 2) */
  Q: number
}

export type AudioPreset = {
  /** Preset name (e.g., "Flat", "Vocal Boost") */
  name: string
  /** Array of EQ bands (typically 5-8 bands) */
  bands: EQBand[]
  /** Preamp gain in dB (typically -12 to 0) */
  preamp: number
}

/**
 * AudioEngine class manages Web Audio API pipeline
 * Pipeline: HTMLAudioElement → source → preamp → EQ bands → destination
 */
export class AudioEngine {
  private audioContext: AudioContext | null = null
  private audioSource: MediaElementAudioSourceNode | null = null
  private gainNode: GainNode | null = null
  private eqBands: BiquadFilterNode[] = []
  private preampGain: GainNode | null = null
  private isInitialized: boolean = false

  /**
   * Initialize audio context and create filter nodes
   * Creates 5 EQ bands: 60Hz, 250Hz, 1.5kHz, 8kHz, 12kHz
   */
  init(): void {
    if (this.isInitialized) return

    try {
      // Create or resume audio context
      const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
      const AudioContextConstructor = w.AudioContext || w.webkitAudioContext
      if (!AudioContextConstructor) throw new Error('AudioContext not supported')
      this.audioContext = new AudioContextConstructor()

      // Preamp gain node
      this.preampGain = this.audioContext.createGain()
      this.preampGain.gain.value = 1

      // Gain node for output
      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.value = 0.8

      // Create 5 EQ band filters
      const bandFrequencies = [60, 250, 1500, 8000, 12000]
      this.eqBands = bandFrequencies.map((freq) => {
        const filter = this.audioContext!.createBiquadFilter()
        filter.type = 'peaking'
        filter.frequency.value = freq
        filter.gain.value = 0
        filter.Q.value = 1
        return filter
      })

      // Chain: preamp → eq bands → gain → destination
      this.preampGain.connect(this.eqBands[0])
      for (let i = 0; i < this.eqBands.length - 1; i++) {
        this.eqBands[i].connect(this.eqBands[i + 1])
      }
      this.eqBands[this.eqBands.length - 1].connect(this.gainNode)
      this.gainNode.connect(this.audioContext.destination)

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize AudioEngine:', error)
    }
  }

  /**
   * Attach HTML audio element to audio engine
   * @param element HTMLAudioElement to process
   */
  attachAudioElement(element: HTMLAudioElement): void {
    if (!this.audioContext) {
      console.warn('AudioEngine not initialized, call init() first')
      return
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }

      // Create media element source if not already created
      if (!this.audioSource) {
        this.audioSource = this.audioContext!.createMediaElementSource(element) as MediaElementAudioSourceNode
        this.audioSource.connect(this.preampGain!)
      }
    } catch (error) {
      console.error('Failed to attach audio element:', error)
    }
  }

  /**
   * Set frequency gain for a specific EQ band
   * @param bandIndex 0-4 (60Hz, 250Hz, 1.5kHz, 8kHz, 12kHz)
   * @param gain dB value (-12 to +12)
   */
  setFrequency(bandIndex: number, gain: number): void {
    if (bandIndex < 0 || bandIndex >= this.eqBands.length) {
      console.warn(`Invalid band index: ${bandIndex}`)
      return
    }

    // Clamp gain to prevent clipping (-12 to +12)
    const clampedGain = Math.max(-12, Math.min(12, gain))
    this.eqBands[bandIndex].gain.value = clampedGain
  }

  /**
   * Set preamp gain
   * @param gain dB value (-12 to 0)
   */
  setPreamp(gain: number): void {
    if (!this.preampGain) return

    // Clamp to prevent clipping
    const clampedGain = Math.max(-12, Math.min(0, gain))
    this.preampGain.gain.value = 10 ** (clampedGain / 20) // Convert dB to linear
  }

  /**
   * Reset all EQ bands and preamp to neutral
   */
  reset(): void {
    this.eqBands.forEach((band) => {
      band.gain.value = 0
    })
    if (this.preampGain) {
      this.preampGain.gain.value = 1
    }
  }

  /**
   * Apply a preset configuration
   * @param preset AudioPreset configuration
   */
  setPreset(preset: AudioPreset): void {
    if (!this.isInitialized) {
      console.warn('AudioEngine not initialized')
      return
    }

    // Apply preamp
    this.setPreamp(preset.preamp)

    // Apply EQ bands
    preset.bands.forEach((band, index) => {
      if (index < this.eqBands.length) {
        this.eqBands[index].frequency.value = band.frequency
        this.eqBands[index].gain.value = band.gain
        this.eqBands[index].Q.value = band.Q
      }
    })
  }

  /**
   * Disconnect and cleanup audio engine
   */
  disconnect(): void {
    try {
      if (this.audioSource) {
        this.audioSource.disconnect()
      }
      if (this.preampGain) {
        this.preampGain.disconnect()
      }
      this.eqBands.forEach((band) => band.disconnect())
      if (this.gainNode) {
        this.gainNode.disconnect()
      }
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close()
      }

      this.isInitialized = false
    } catch (error) {
      console.error('Error disconnecting AudioEngine:', error)
    }
  }

  /**
   * Get current audio context state
   */
  getState(): string {
    return this.audioContext?.state || 'not-initialized'
  }

  /**
   * Check if audio engine is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.audioContext?.state === 'running'
  }
}

// Singleton instance
export const audioEngine = new AudioEngine()
