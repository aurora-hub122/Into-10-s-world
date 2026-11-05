import { useEffect, useRef, useState } from 'react'
import MemoryMap from './MemoryMap'

type AmbientNodes = {
  context: AudioContext
  gain: GainNode
  sources: AudioScheduledSourceNode[]
}

function createAmbientSound(): AmbientNodes | null {
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return null

  const context = new AudioContextClass()
  const gain = context.createGain()
  gain.gain.value = 0.0001
  gain.connect(context.destination)
  const sources: AudioScheduledSourceNode[] = []

  ;[55, 82.41, 110].forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const toneGain = context.createGain()
    oscillator.type = index === 1 ? 'triangle' : 'sine'
    oscillator.frequency.value = frequency
    toneGain.gain.value = index === 0 ? 0.42 : 0.13
    oscillator.connect(toneGain)
    toneGain.connect(gain)
    oscillator.start()
    sources.push(oscillator)
  })

  return { context, gain, sources }
}

function App() {
  const [view, setView] = useState<'home' | 'map'>('home')
  const [muted, setMuted] = useState(true)
  const ambientRef = useRef<AmbientNodes | null>(null)

  const toggleSound = async () => {
    if (!ambientRef.current) ambientRef.current = createAmbientSound()
    const ambient = ambientRef.current
    if (!ambient) return
    await ambient.context.resume()
    const now = ambient.context.currentTime
    ambient.gain.gain.cancelScheduledValues(now)
    ambient.gain.gain.setValueAtTime(Math.max(ambient.gain.gain.value, 0.0001), now)
    ambient.gain.gain.exponentialRampToValueAtTime(muted ? 0.045 : 0.0001, now + 0.5)
    setMuted(!muted)
  }

  useEffect(() => {
    return () => {
      // Audio is created after mount, on the visitor's first click.
      const ambient = ambientRef.current
      if (!ambient) return
      ambient.sources.forEach((source) => source.stop())
      void ambient.context.close()
    }
  }, [])

  return (
    <main className="experience">
      {view === 'home' ? (
        <section className="pixel-hero" id="home" aria-labelledby="hero-title">
          <img
            className="pixel-hero-art"
            src={`${import.meta.env.BASE_URL}images/pixel-valley.webp`}
            alt="A pixel-art valley of glowing flowers and a path leading toward a town at dusk"
          />
          <header className="pixel-topbar">
            <a href="#home" className="pixel-wordmark">When Tomorrow Felt Brighter</a>
            <nav aria-label="Main navigation">
              <button type="button" onClick={() => setView('map')}>Explore places</button>
              <span className="pixel-era">2010s · CHINA</span>
            </nav>
          </header>

          <div className="pixel-hero-content">
            <p className="pixel-eyebrow">A SHARED FEELING OF THE 2010S</p>
            <h1 id="hero-title">When tomorrow<br />felt brighter.</h1>
            <p className="pixel-caption">
              Ordinary evenings seemed to open<br />toward something better.
            </p>
            <button
              type="button"
              className="pixel-enter"
              aria-label="Enter the memory town"
              onClick={() => setView('map')}
            >
              <span aria-hidden="true">→</span> ENTER THE TOWN
            </button>
          </div>

          <div className="pixel-bottom-bar">
            <span>FOLLOW THE PATH · CHOOSE YOUR OWN WAY</span>
            <button
              type="button"
              className="pixel-sound"
              aria-pressed={!muted}
              aria-label={muted ? 'Play ambient sound' : 'Mute ambient sound'}
              onClick={toggleSound}
            >
              SOUND {muted ? 'OFF' : 'ON'}
            </button>
          </div>
        </section>
      ) : (
        <MemoryMap onReturn={() => setView('home')} />
      )}
    </main>
  )
}

export default App
