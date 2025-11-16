'use client'
import { useEffect, useRef, useState } from 'react'
import { LiveSpectrogram } from './LiveSpectrogram'
import {
  getMicrophoneErrorMessage,
  requestMicrophoneAccess,
  stopMicrophone,
} from './mic'
import { SpectrogramControls } from './SpectrogramControls'
import type { ColorScheme } from './spectrogram/spectrogramConfig'

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
  const colorSchemes: Array<ColorScheme> = [
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
      const mediaError = audio.error
      if (mediaError) {
        let errorMessage = 'Unknown error'
        switch (mediaError.code) {
          case mediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Playback aborted'
            break
          case mediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error - check stream URL'
            break
          case mediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Decode error - invalid stream format'
            break
          case mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
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
      audio.pause()
      audio.src = ''
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

        radioAudioRef.current
          .play()
          .then(() => {
            setError(null)
          })
          .catch((playError) => {
            console.error('Error playing radio stream:', playError)
            setError(
              `Failed to play stream: ${playError instanceof Error ? playError.message : 'Unknown error'}. Please check your internet connection or try again.`,
            )
            setIsRadioActive(false)
          })
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
      } catch (micError: any) {
        console.error('Error accessing microphone:', micError)
        setError(getMicrophoneErrorMessage(micError))
        setIsMicActive(false)
      }
    }
  }

  const colorSchemeLabel = colorSchemeNames[colorScheme]

  return (
    <div className="flex flex-row gap-4 h-full min-h-0">
      <SpectrogramControls
        isRadioActive={isRadioActive}
        isMicActive={isMicActive}
        error={error}
        zoom={zoom}
        maxHeight={maxHeight}
        xsize={xsize}
        ysize={ysize}
        frequencySamples={frequencySamples}
        timeSamples={timeSamples}
        fftSize={FFT_SIZE}
        colorSchemeLabel={colorSchemeLabel}
        radioAudioRef={radioAudioRef}
        onStartRadio={handleStartRadio}
        onToggleMic={handleTurnOnMic}
        onZoomChange={setZoom}
        onMaxHeightChange={setMaxHeight}
        onXSizeChange={setXsize}
        onYSizeChange={setYsize}
        onFrequencySamplesChange={setFrequencySamples}
        onTimeSamplesChange={setTimeSamples}
        onColorSchemePrev={handleColorSchemePrev}
        onColorSchemeNext={handleColorSchemeNext}
      />

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
