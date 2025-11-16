import { createFileRoute } from '@tanstack/react-router'
import { RadioPlayer } from '@/components/RadioPlayer'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <section className="h-screen relative py-1 px-6 text-center overflow-hidden bg-slate-900 flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
      <div className="relative w-[90%] max-w-none mx-auto flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 py-1">
          <h1 className="text-2xl md:text-3xl font-black text-white [letter-spacing:-0.08em] mb-1">
            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              SPECTROGRAM
            </span>{' '}
            <span className="text-gray-300">APP</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-300 mb-1 font-light">
            Real-time spectrogram visualization for live radio streams and
            microphone input
          </p>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <RadioPlayer />
          </div>
        </div>
      </div>
    </section>
  )
}
