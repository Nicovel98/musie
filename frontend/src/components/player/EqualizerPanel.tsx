/**
 * EqualizerPanel Component
 * 
 * Provides user interface for audio equalizer control:
 * - 5 EQ band sliders (±12dB)
 * - Preamp slider (-12 to 0dB)
 * - 5 preset buttons
 * - Reset button
 * - Clipping warning indicator
 */

import { type ReactNode, useState, useEffect } from 'react'
import { AudioEngine } from '../../features/audio/audioEngine'
import './EqualizerPanel.css'

export interface EqualizerPanelProps {
  audioEngine: AudioEngine
}

interface EQBandConfig {
  id: number
  label: string
  frequency: string
}

const EQ_BANDS: EQBandConfig[] = [
  { id: 0, label: '60 Hz', frequency: '60' },
  { id: 1, label: '250 Hz', frequency: '250' },
  { id: 2, label: '1 kHz', frequency: '1000' },
  { id: 3, label: '4 kHz', frequency: '4000' },
  { id: 4, label: '16 kHz', frequency: '16000' },
]

const MIN_GAIN = -12
const MAX_GAIN = 12
const MIN_PREAMP = -12
const MAX_PREAMP = 0

export function EqualizerPanel({ audioEngine }: EqualizerPanelProps): ReactNode {
  const [bandValues, setBandValues] = useState<number[]>([0, 0, 0, 0, 0])
  const [preamp, setPreamp] = useState(0)
  const [activePreset, setActivePreset] = useState<string>('Flat')

  useEffect(() => {
    audioEngine.init()
  }, [audioEngine])

  // Compute clipping status from current values (not dependent on setState)
  const maxBand = Math.max(...bandValues)
  const isClipping = preamp + maxBand > MAX_GAIN

  const handleBandChange = (bandId: number, value: number) => {
    const newValues = [...bandValues]
    newValues[bandId] = value
    setBandValues(newValues)
    audioEngine.setFrequency(bandId, value)
  }

  const handlePreampChange = (value: number) => {
    setPreamp(value)
    audioEngine.setPreamp(value)
  }

  const handlePresetSelect = (presetName: string) => {
    setActivePreset(presetName)
    audioEngine.applyPreset(presetName)

    // Update UI values to match preset
    const preset = audioEngine.getPreset(presetName)
    if (preset) {
      setBandValues([...preset.bands])
      setPreamp(preset.preamp)
    }
  }

  const handleReset = () => {
    setBandValues([0, 0, 0, 0, 0])
    setPreamp(0)
    audioEngine.resetBands()
    setActivePreset('Flat')
  }

  return (
    <div className="equalizer-panel">
      <div className="equalizer-header">
        <h2>Equalizer</h2>
        {isClipping && <div className="clipping-warning">⚠️ Clipping Risk</div>}
      </div>

      {/* Presets */}
      <div className="presets-section">
        <label>Presets</label>
        <div className="presets-grid">
          {['Flat', 'Vocal', 'Bass', 'Treble', 'Instrumental'].map((preset) => (
            <button
              key={preset}
              className={`preset-btn ${activePreset === preset ? 'active' : ''}`}
              onClick={() => handlePresetSelect(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* EQ Bands */}
      <div className="eq-bands-section">
        <label>EQ Bands</label>
        <div className="eq-bands-container">
          {EQ_BANDS.map((band) => (
            <div key={band.id} className="eq-band">
              <label className="band-label">{band.label}</label>
              <input
                type="range"
                min={MIN_GAIN}
                max={MAX_GAIN}
                value={bandValues[band.id]}
                onChange={(e) => handleBandChange(band.id, Number(e.target.value))}
                className="band-slider"
                aria-label={`${band.label} frequency`}
              />
              <div className="band-value">{bandValues[band.id] > 0 ? '+' : ''}{bandValues[band.id]}dB</div>
            </div>
          ))}
        </div>
      </div>

      {/* Preamp */}
      <div className="preamp-section">
        <label>Preamp</label>
        <div className="preamp-container">
          <input
            type="range"
            min={MIN_PREAMP}
            max={MAX_PREAMP}
            value={preamp}
            onChange={(e) => handlePreampChange(Number(e.target.value))}
            className="preamp-slider"
            aria-label="Preamp gain"
          />
          <div className="preamp-value">{preamp > 0 ? '+' : ''}{preamp}dB</div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="controls-section">
        <button className="reset-btn" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  )
}
