'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Radio,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
} from 'lucide-react'
import { LiveSpectrogram } from './LiveSpectrogram'
import {
  requestMicrophoneAccess,
  stopMicrophone,
  getMicrophoneErrorMessage,
} from './mic'
import { type ColorScheme } from './spectrogram/spectrogramConfig'

const RADIO_STREAM_URL = 'https://ec6.yesstreaming.net:1505/stream'

export function RadioPlayer() {
  const [isRadioActive, setIsRadioActive] = useState(false)
  const [isMicActive, setIsMicActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  )
  const radioAudioRef = useRef<HTMLAudioElement>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const micAudioContextRef = useRef<AudioContext | null>(null)

  // Spectrogram control state
  const [zoom, setZoom] = useState(64) // Default 64 matches blog post
  const [maxHeight, setMaxHeight] = useState(8.0)
  const [xsize, setXsize] = useState(50)
  const [ysize, setYsize] = useState(30)
  const [frequencySamples, setFrequencySamples] = useState(256)
  const [timeSamples, setTimeSamples] = useState(600)
  const [colorScheme, setColorScheme] = useState<ColorScheme>('purple') // Default to purple (blog post style)

  // Helper function to get nearest power of 2 (for FFT_SIZE display)
  const getNearestPowerOf2 = (value: number): number => {
    if (value <= 0) return 256
    const power = Math.round(Math.log2(value))
    return Math.pow(2, Math.max(8, Math.min(14, power)))
  }
  const FFT_SIZE = getNearestPowerOf2(4 * frequencySamples)

  // Color scheme navigation
  const colorSchemes: ColorScheme[] = [
    'purple',
    'green-red',
    'purple-yellow',
    'blue-cyan',
    'red-yellow',
    'blue-magenta',
    'rainbow',
    'grayscale',
    'orange-red',
    'cyan-blue',
    'yellow-green',
  ]

  const colorSchemeNames: Record<ColorScheme, string> = {
    purple: 'Purple (Blog Style)',
    'green-red': 'Green → Red',
    'purple-yellow': 'Purple → Yellow',
    'blue-cyan': 'Blue → Cyan',
    'red-yellow': 'Red → Yellow (Fire)',
    'blue-magenta': 'Blue → Magenta',
    rainbow: 'Rainbow (HSV)',
    grayscale: 'Grayscale',
    'orange-red': 'Orange → Red',
    'cyan-blue': 'Cyan → Blue',
    'yellow-green': 'Yellow → Green',
  }

  const handleColorSchemePrev = () => {
    const currentIndex = colorSchemes.indexOf(colorScheme)
    const prevIndex =
      currentIndex === 0 ? colorSchemes.length - 1 : currentIndex - 1
    setColorScheme(colorSchemes[prevIndex])
  }

  const handleColorSchemeNext = () => {
    const currentIndex = colorSchemes.indexOf(colorScheme)
    const nextIndex =
      currentIndex === colorSchemes.length - 1 ? 0 : currentIndex + 1
    setColorScheme(colorSchemes[nextIndex])
  }

  useEffect(() => {
    const audio = radioAudioRef.current
    if (!audio) return

    // Update audio element state when ref is set
    setAudioElement(audio)

    // Add error event listener
    const handleError = (e: Event) => {
      console.error('Audio error:', e)
      const error = audio.error
      if (error) {
        let errorMessage = 'Unknown error'
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMessage = 'Playback aborted'
            break
          case error.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error - check stream URL'
            break
          case error.MEDIA_ERR_DECODE:
            errorMessage = 'Decode error - invalid stream format'
            break
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage =
              'Stream URL not supported - may need different format'
            break
        }
        setError(errorMessage)
        setIsRadioActive(false)
      }
    }

    audio.addEventListener('error', handleError)

    // Cleanup on unmount
    return () => {
      audio.removeEventListener('error', handleError)
      if (audio) {
        audio.pause()
        audio.src = ''
      }
      setAudioElement(null)
    }
  }, [isRadioActive])

  const handleStartRadio = () => {
    if (isRadioActive) {
      // Stop radio
      if (radioAudioRef.current) {
        radioAudioRef.current.pause()
        radioAudioRef.current.src = ''
      }
      setIsRadioActive(false)
      setError(null)
    } else {
      // Stop mic if active (mutually exclusive)
      if (isMicActive) {
        handleTurnOnMic()
      }

      // Start radio stream
      setError(null)
      setIsRadioActive(true)

      // Wait a bit for the audio element to be in the DOM
      setTimeout(() => {
        if (!radioAudioRef.current) return

        // Set and play the stream URL
        radioAudioRef.current.src = RADIO_STREAM_URL
        radioAudioRef.current.load()

        const playPromise = radioAudioRef.current.play()

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setError(null)
            })
            .catch((error) => {
              console.error('Error playing radio stream:', error)
              setError(
                `Failed to play stream: ${error.message}. Please check your internet connection or try again.`,
              )
              setIsRadioActive(false)
            })
        }
      }, 100)
    }
  }

  const handleTurnOnMic = async () => {
    if (isMicActive) {
      // Stop mic
      await stopMicrophone(micStreamRef.current, micAudioContextRef.current)
      micStreamRef.current = null
      micAudioContextRef.current = null
      setIsMicActive(false)
      setError(null)
    } else {
      // Stop radio if active (mutually exclusive)
      if (isRadioActive) {
        handleStartRadio()
      }

      // Start mic
      setError(null)
      try {
        const { stream, audioContext } = await requestMicrophoneAccess()
        micStreamRef.current = stream
        micAudioContextRef.current = audioContext
        setIsMicActive(true)
      } catch (error: any) {
        console.error('Error accessing microphone:', error)
        setError(getMicrophoneErrorMessage(error))
        setIsMicActive(false)
      }
    }
  }

  return (
    <div className="flex flex-row gap-4 h-full min-h-0">
      {/* Controls Sidebar - 20% */}
      <div className="w-[20%] flex-shrink-0 bg-slate-800/50 border border-slate-700 rounded-lg p-4 overflow-y-auto max-h-full">
        <h3 className="text-white font-semibold mb-4">Spectrogram Controls</h3>

        {/* Start/Stop Button */}
        <div className="mb-4">
          <Button
            onClick={handleStartRadio}
            variant={isRadioActive ? 'default' : 'outline'}
            className="w-full"
          >
            <Radio className="mr-2 h-4 w-4" />
            {isRadioActive ? 'Stop Radio' : 'Start Radio'}
          </Button>
          {isRadioActive && (
            <p className="text-white text-sm text-center mt-2">
              24/7 Seawaves Radio
            </p>
          )}
        </div>

        {/* Turn on Mic Button */}
        <div className="mb-4">
          <Button
            onClick={handleTurnOnMic}
            variant={isMicActive ? 'default' : 'outline'}
            className="w-full"
          >
            {isMicActive ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Turn off Mic
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Turn on Mic
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        {/* Hidden audio element for radio stream (needed for audio processing) */}
        {isRadioActive && (
          <audio
            ref={radioAudioRef}
            crossOrigin="anonymous"
            preload="none"
            style={{ display: 'none' }}
          />
        )}

        {/* Controls */}
        <div className="flex flex-col gap-4">
          {/* Zoom Control */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Zoom: {zoom}
            </label>
            <input
              type="range"
              min="20"
              max="150"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Max Height Control */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Max Height: {maxHeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={maxHeight}
              onChange={(e) => setMaxHeight(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* X Size Control */}
          <div
            className={isRadioActive ? 'opacity-50 pointer-events-none' : ''}
          >
            <label className="block text-sm text-gray-300 mb-1">
              X Size (Time): {xsize}
            </label>
            <input
              type="range"
              min="20"
              max="100"
              value={xsize}
              onChange={(e) => setXsize(Number(e.target.value))}
              className="w-full"
              disabled={isRadioActive}
            />
          </div>

          {/* Y Size Control */}
          <div
            className={isRadioActive ? 'opacity-50 pointer-events-none' : ''}
          >
            <label className="block text-sm text-gray-300 mb-1">
              Y Size (Frequency): {ysize}
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={ysize}
              onChange={(e) => setYsize(Number(e.target.value))}
              className="w-full"
              disabled={isRadioActive}
            />
          </div>

          {/* Frequency Samples Control */}
          <div
            className={isRadioActive ? 'opacity-50 pointer-events-none' : ''}
          >
            <label className="block text-sm text-gray-300 mb-1">
              Frequency Resolution: {frequencySamples}
            </label>
            <input
              type="range"
              min="64"
              max="512"
              step="64"
              value={frequencySamples}
              onChange={(e) => setFrequencySamples(Number(e.target.value))}
              className="w-full"
              disabled={isRadioActive}
            />
          </div>

          {/* Time Samples Control */}
          <div
            className={isRadioActive ? 'opacity-50 pointer-events-none' : ''}
          >
            <label className="block text-sm text-gray-300 mb-1">
              Time Resolution: {timeSamples}
            </label>
            <input
              type="range"
              min="200"
              max="1200"
              step="100"
              value={timeSamples}
              onChange={(e) => setTimeSamples(Number(e.target.value))}
              className="w-full"
              disabled={isRadioActive}
            />
          </div>

          {/* Color Scheme Control */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Color Scheme
            </label>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleColorSchemePrev}
                variant="outline"
                size="sm"
                className="flex-shrink-0 p-1 h-8 w-8"
                aria-label="Previous color scheme"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 bg-slate-700 text-white rounded px-2 py-1 text-sm text-center min-h-[32px] flex items-center justify-center">
                {colorSchemeNames[colorScheme]}
              </div>
              <Button
                onClick={handleColorSchemeNext}
                variant="outline"
                size="sm"
                className="flex-shrink-0 p-1 h-8 w-8"
                aria-label="Next color scheme"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* FFT Size Display (read-only) */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              FFT Size: {FFT_SIZE} (auto)
            </label>
            <div className="text-xs text-gray-400">
              Calculated as 4 × Frequency Resolution
            </div>
          </div>
        </div>
      </div>

      {/* Spectrogram Area - 80% */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 min-h-0">
        {isRadioActive || isMicActive ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 h-full flex flex-col min-h-0 overflow-hidden">
            {/* Single Spectrogram - switches between radio and mic */}
            <div className="flex-1 w-full min-h-0 overflow-hidden">
              <LiveSpectrogram
                audioElement={isRadioActive ? audioElement : null}
                micStream={isMicActive ? micStreamRef.current : null}
                micAudioContext={
                  isMicActive ? micAudioContextRef.current : null
                }
                isActive={(isRadioActive && !!audioElement) || isMicActive}
                zoom={zoom}
                maxHeight={maxHeight}
                xsize={xsize}
                ysize={ysize}
                frequencySamples={frequencySamples}
                timeSamples={timeSamples}
                colorScheme={colorScheme}
              />
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 h-full flex items-center justify-center min-h-0">
            <p className="text-gray-400 text-center">
              Click "Start Radio" or "Turn on Mic" to begin visualization
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
