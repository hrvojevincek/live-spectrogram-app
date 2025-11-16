import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  Radio,
} from 'lucide-react'
import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type SpectrogramControlsProps = {
  isRadioActive: boolean
  isMicActive: boolean
  error: string | null
  zoom: number
  maxHeight: number
  xsize: number
  ysize: number
  frequencySamples: number
  timeSamples: number
  fftSize: number
  colorSchemeLabel: string
  radioAudioRef: RefObject<HTMLAudioElement | null>
  onStartRadio: () => void
  onToggleMic: () => void
  onZoomChange: (value: number) => void
  onMaxHeightChange: (value: number) => void
  onXSizeChange: (value: number) => void
  onYSizeChange: (value: number) => void
  onFrequencySamplesChange: (value: number) => void
  onTimeSamplesChange: (value: number) => void
  onColorSchemePrev: () => void
  onColorSchemeNext: () => void
}

export function SpectrogramControls({
  isRadioActive,
  isMicActive,
  error,
  zoom,
  maxHeight,
  xsize,
  ysize,
  frequencySamples,
  timeSamples,
  fftSize,
  colorSchemeLabel,
  radioAudioRef,
  onStartRadio,
  onToggleMic,
  onZoomChange,
  onMaxHeightChange,
  onXSizeChange,
  onYSizeChange,
  onFrequencySamplesChange,
  onTimeSamplesChange,
  onColorSchemePrev,
  onColorSchemeNext,
}: SpectrogramControlsProps) {
  return (
    <div className="w-[20%] flex-shrink-0 bg-slate-800/50 border border-slate-700 rounded-lg p-4 overflow-y-auto max-h-full">
      <h3 className="text-white font-semibold mb-4">Spectrogram Controls</h3>

      {/* Start/Stop Button */}
      <div className="mb-4">
        <Button
          onClick={onStartRadio}
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
          onClick={onToggleMic}
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
        <div className="flex flex-col gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-left cursor-help flex items-center justify-between gap-2">
                <p className="text-sm text-gray-300 font-medium">Zoom</p>
                <p className="text-xs text-gray-400">Current: {zoom}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              Controls horizontal scale of the spectrogram.
            </TooltipContent>
          </Tooltip>
          <div className="mt-1">
            <Slider
              value={[zoom]}
              min={20}
              max={150}
              onValueChange={([value]) => onZoomChange(value)}
            />
          </div>
        </div>

        {/* Max Height Control */}
        <div className="flex flex-col gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-left cursor-help flex items-center justify-between gap-2">
                <p className="text-sm text-gray-300 font-medium">Max Height</p>
                <p className="text-xs text-gray-400">
                  Current: {maxHeight.toFixed(1)}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              Amplitude scaling of the 3D mesh.
            </TooltipContent>
          </Tooltip>
          <div className="mt-1">
            <Slider
              value={[maxHeight]}
              min={1}
              max={30}
              step={0.5}
              onValueChange={([value]) => onMaxHeightChange(value)}
            />
          </div>
        </div>

        {/* X Size Control */}
        <div className={isRadioActive ? 'opacity-50 pointer-events-none' : ''}>
          <div className="flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-left cursor-help flex items-center justify-between gap-2">
                  <p className="text-sm text-gray-300 font-medium">
                    X Size (Time)
                  </p>
                  <p className="text-xs text-gray-400">Current: {xsize}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                How much history is visible along the X axis.
              </TooltipContent>
            </Tooltip>
            <div className="mt-1">
              <Slider
                value={[xsize]}
                min={20}
                max={100}
                onValueChange={([value]) => onXSizeChange(value)}
                disabled={isRadioActive}
              />
            </div>
          </div>
        </div>

        {/* Y Size Control */}
        <div className={isRadioActive ? 'opacity-50 pointer-events-none' : ''}>
          <div className="flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-left cursor-help flex items-center justify-between gap-2">
                  <p className="text-sm text-gray-300 font-medium">
                    Y Size (Frequency)
                  </p>
                  <p className="text-xs text-gray-400">Current: {ysize}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                Vertical scale / number of frequency bands.
              </TooltipContent>
            </Tooltip>
            <div className="mt-1">
              <Slider
                value={[ysize]}
                min={10}
                max={50}
                onValueChange={([value]) => onYSizeChange(value)}
                disabled={isRadioActive}
              />
            </div>
          </div>
        </div>

        {/* Frequency Samples Control */}
        <div className={isRadioActive ? 'opacity-50 pointer-events-none' : ''}>
          <div className="flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-left cursor-help flex items-center justify-between gap-2">
                  <p className="text-sm text-gray-300 font-medium">
                    Frequency Resolution
                  </p>
                  <p className="text-xs text-gray-400">
                    Current: {frequencySamples}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                More samples = finer frequency detail.
              </TooltipContent>
            </Tooltip>
            <div className="mt-1">
              <Slider
                value={[frequencySamples]}
                min={64}
                max={512}
                step={64}
                onValueChange={([value]) => onFrequencySamplesChange(value)}
                disabled={isRadioActive}
              />
            </div>
          </div>
        </div>

        {/* Time Samples Control */}
        <div className={isRadioActive ? 'opacity-50 pointer-events-none' : ''}>
          <div className="flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-left cursor-help flex items-center justify-between gap-2">
                  <p className="text-sm text-gray-300 font-medium">
                    Time Resolution
                  </p>
                  <p className="text-xs text-gray-400">
                    Current: {timeSamples}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                How often new slices are added over time.
              </TooltipContent>
            </Tooltip>
            <div className="mt-1">
              <Slider
                value={[timeSamples]}
                min={200}
                max={1200}
                step={100}
                onValueChange={([value]) => onTimeSamplesChange(value)}
                disabled={isRadioActive}
              />
            </div>
          </div>
        </div>

        {/* Color Scheme Control */}
        <div className="flex flex-col gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-left cursor-help">
                <p className="text-sm text-gray-300 font-medium">
                  Color Scheme
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              Choose the gradient used for intensity.
            </TooltipContent>
          </Tooltip>
          <div className="mt-1">
            <div className="flex items-center gap-2">
              <Button
                onClick={onColorSchemePrev}
                variant="outline"
                size="sm"
                className="flex-shrink-0 p-1 h-8 w-8"
                aria-label="Previous color scheme"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 bg-slate-700 text-white rounded px-2 py-1 text-sm text-center min-h-[32px] flex items-center justify-center">
                {colorSchemeLabel}
              </div>
              <Button
                onClick={onColorSchemeNext}
                variant="outline"
                size="sm"
                className="flex-shrink-0 p-1 h-8 w-8"
                aria-label="Next color scheme"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* FFT Size Display (read-only) */}
        <div className="flex items-center gap-3">
          <div className="w-[40%] text-left">
            <p className="text-sm text-gray-300 font-medium">FFT Size</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-300 mb-1">{fftSize} (auto)</p>
            <p className="text-xs text-gray-400">
              Calculated as 4 × Frequency Resolution.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
