import { useCallback, useEffect, useRef, useState } from 'react'
import NightValley from './NightValley'

type AmbientNodes = {
  context: AudioContext
  filter: BiquadFilterNode
  gain: GainNode
  sources: AudioScheduledSourceNode[]
}

function createAmbientSound(): AmbientNodes | null {
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return null

  const context = new AudioContextClass()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  filter.type = 'lowpass'
  filter.frequency.value = 1650
  filter.Q.value = 0.45
  gain.gain.value = 0.0001
  filter.connect(gain)
  gain.connect(context.destination)

  const sources: AudioScheduledSourceNode[] = []
  const tones = [55, 82.41, 110]
  tones.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const toneGain = context.createGain()
    oscillator.type = index === 1 ? 'triangle' : 'sine'
    oscillator.frequency.value = frequency
    oscillator.detune.value = index * 4 - 3
    toneGain.gain.value = index === 0 ? 0.42 : 0.13
    oscillator.connect(toneGain)
    toneGain.connect(filter)
    oscillator.start()
    sources.push(oscillator)
  })

  const noiseBuffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate)
  const noiseData = noiseBuffer.getChannelData(0)
  for (let i = 0; i < noiseData.length; i += 1) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.08
  }
  const noise = context.createBufferSource()
  noise.buffer = noiseBuffer
  noise.loop = true
  noise.connect(filter)
  noise.start()
  sources.push(noise)

  return { context, filter, gain, sources }
}

function App() {
  const [loaded, setLoaded] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [muted, setMuted] = useState(true)
  const ambientRef = useRef<AmbientNodes | null>(null)

  const handleLoaded = useCallback(() => setLoaded(true), [])
  const handleIntroDone = useCallback(() => setIntroDone(true), [])

  const toggleSound = useCallback(async () => {
    if (!ambientRef.current) ambientRef.current = createAmbientSound()
    const ambient = ambientRef.current
    if (!ambient) return
    await ambient.context.resume()

    setMuted((currentMuted) => {
      const nextMuted = !currentMuted
      const now = ambient.context.currentTime
      ambient.gain.gain.cancelScheduledValues(now)
      ambient.gain.gain.setValueAtTime(Math.max(ambient.gain.gain.value, 0.0001), now)
      ambient.gain.gain.exponentialRampToValueAtTime(nextMuted ? 0.0001 : 0.045, now + 0.8)
      return nextMuted
    })
  }, [])

  useEffect(() => {
    const ambient = ambientRef.current
    if (!ambient) return
    const now = ambient.context.currentTime
    ambient.filter.frequency.cancelScheduledValues(now)
    ambient.filter.frequency.setTargetAtTime(hovering ? 380 : 1650, now, 0.28)
  }, [hovering])

  useEffect(() => {
    return () => {
      const ambient = ambientRef.current
      if (!ambient) return
      ambient.sources.forEach((source) => source.stop())
      void ambient.context.close()
    }
  }, [])

  return (
    <main className="experience">
      <div id="valley">
        <NightValley hovering={hovering} onLoaded={handleLoaded} onIntroDone={handleIntroDone} />
        <div className="valley-haze" />
        <div className="valley-vignette" />
      </div>

      <div className={`hero-ui ${introDone ? 'on' : ''}`}>
        <header className="topbar">
          <a className="wordmark" href="#home" aria-label="The Internet Forgot the Afternoon">
            The Internet Forgot the Afternoon
          </a>
          <nav aria-label="Main navigation">
            <a href="#memories">Memories</a>
            <a href="#archive">Archive</a>
            <a href="#about">About</a>
            <a className="nav-pill" href="#enter">Enter</a>
          </nav>
        </header>

        <section className="valley-hero" id="home" aria-labelledby="hero-title">
          <p className="eyebrow">An archive of ordinary attention</p>
          <h1 id="hero-title">Before everything became a feed.</h1>
          <p className="hero-caption">
            The internet remembers what we clicked.
            <br />
            Who remembers what we felt?
          </p>
          <a
            className="go-button"
            href="#memories"
            aria-label="Enter the memory archive"
            onPointerEnter={() => setHovering(true)}
            onPointerLeave={() => setHovering(false)}
            onFocus={() => setHovering(true)}
            onBlur={() => setHovering(false)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12h16M14 6l6 6-6 6" />
            </svg>
          </a>
        </section>

        <div className="bottom-corner">
          <span>Scroll to remember</span>
          <i aria-hidden="true" />
          <button
            className="sound-button"
            type="button"
            aria-pressed={!muted}
            aria-label={muted ? 'Play ambient sound' : 'Mute ambient sound'}
            onClick={toggleSound}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5Z" />
              <path className="sound-waves" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
              <path className="sound-x" d="m16 10 4 4m0-4-4 4" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`loader ${loaded ? 'gone' : ''}`} aria-hidden="true">
        <span />
      </div>
    </main>
  )
}

export default App
