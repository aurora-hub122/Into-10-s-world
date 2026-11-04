import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import DuskNeighborhood from './DuskNeighborhood'
import NightValley from './NightValley'

type AmbientNodes = {
  context: AudioContext
  filter: BiquadFilterNode
  gain: GainNode
  sources: AudioScheduledSourceNode[]
}

type View = 'valley' | 'travel' | 'neighborhood'

const tunnelStreaks = Array.from({ length: 36 }, (_, index) => ({
  angle: index * 10,
  delay: -((index * 7) % 13) * 0.07,
  length: 14 + ((index * 11) % 30),
  offset: 3 + ((index * 5) % 18),
}))

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
  ;[55, 82.41, 110].forEach((frequency, index) => {
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
  const [view, setView] = useState<View>('valley')
  const ambientRef = useRef<AmbientNodes | null>(null)

  const handleLoaded = useCallback(() => setLoaded(true), [])
  const handleIntroDone = useCallback(() => setIntroDone(true), [])
  const beginJourney = useCallback(() => {
    setHovering(false)
    setView('travel')
  }, [])

  const returnToValley = useCallback(() => {
    setView('valley')
  }, [])

  useEffect(() => {
    if (view !== 'travel') return
    const timer = window.setTimeout(() => setView('neighborhood'), 1900)
    return () => window.clearTimeout(timer)
  }, [view])

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
    ambient.filter.frequency.setTargetAtTime(hovering || view === 'travel' ? 380 : 1650, now, 0.28)
  }, [hovering, view])

  useEffect(() => {
    return () => {
      const ambient = ambientRef.current
      if (!ambient) return
      ambient.sources.forEach((source) => source.stop())
      void ambient.context.close()
    }
  }, [])

  const showValley = view !== 'neighborhood'

  return (
    <main className={`experience view-${view}`}>
      {showValley && (
        <div id="valley">
          <NightValley
            hovering={hovering}
            traveling={view === 'travel'}
            onLoaded={handleLoaded}
            onIntroDone={handleIntroDone}
          />
          <div className="valley-haze" />
          <div className="valley-vignette" />
        </div>
      )}

      {showValley && (
        <div className={`hero-ui ${introDone && view === 'valley' ? 'on' : ''}`}>
          <header className="topbar">
            <a className="wordmark" href="#home" aria-label="When Tomorrow Felt Brighter">
              When Tomorrow Felt Brighter
            </a>
            <nav aria-label="Main navigation">
              <a href="#places" onClick={(event) => { event.preventDefault(); beginJourney() }}>Places</a>
              <a href="#sounds">Sounds</a>
              <a href="#about">About</a>
              <a className="nav-pill" href="#begin" onClick={(event) => { event.preventDefault(); beginJourney() }}>Begin</a>
            </nav>
          </header>

          <section className="valley-hero" id="home" aria-labelledby="hero-title">
            <p className="eyebrow">A shared feeling of the 2010s</p>
            <h1 id="hero-title">When tomorrow felt brighter.</h1>
            <p className="hero-caption">
              Return to a time when ordinary evenings
              <br />
              still seemed to open toward something better.
            </p>
            <a
              className="go-button"
              href="#places"
              aria-label="Travel to the dusk neighborhood"
              onClick={(event) => { event.preventDefault(); beginJourney() }}
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
            <span>Scroll through the feeling</span>
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
      )}

      <div className={`travel-tunnel ${view === 'travel' ? 'on' : ''}`} aria-hidden="true">
        <div className="tunnel-centre" />
        {tunnelStreaks.map((streak, index) => {
          const style = {
            '--streak-angle': `${streak.angle}deg`,
            '--streak-delay': `${streak.delay}s`,
            '--streak-length': `${streak.length}vmin`,
            '--streak-offset': `${streak.offset}vmin`,
          } as CSSProperties
          return <span className="tunnel-streak" style={style} key={index} />
        })}
        <p>Follow the lights back to an ordinary evening.</p>
      </div>

      {view === 'neighborhood' && <DuskNeighborhood onReturn={returnToValley} />}

      {showValley && (
        <div className={`loader ${loaded ? 'gone' : ''}`} aria-hidden="true">
          <span />
        </div>
      )}
    </main>
  )
}

export default App
