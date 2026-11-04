import { type CSSProperties, type MutableRefObject, useEffect, useRef, useState } from 'react'

type DuskNeighborhoodProps = {
  onReturn: () => void
}

type Portal = {
  id: string
  number: string
  title: string
  chinese: string
  sound: string
  description: string
  x: number
  y: number
  mobileX: number
  mobileY: number
  frequency: number
}

const portals: Portal[] = [
  {
    id: 'winter-stall',
    number: '01',
    title: 'The Winter Stall',
    chinese: '冬日街边的小摊',
    sound: 'String lights, paper bags, a distant holiday song',
    description: 'A street could become a celebration with a few ornaments, warm bulbs, and somewhere to walk together.',
    x: 10,
    y: 64,
    mobileX: 19,
    mobileY: 61,
    frequency: 659.25,
  },
  {
    id: 'corner-shop',
    number: '02',
    title: 'After-School Corner Shop',
    chinese: '放学后的小卖部',
    sound: 'Marbles, paper cards, bicycle bells, children bargaining for one more round',
    description: 'Five-mao cards became whole worlds when time had no price and nobody was ready to go home.',
    x: 27,
    y: 61,
    mobileX: 35,
    mobileY: 57,
    frequency: 783.99,
  },
  {
    id: 'vine-passage',
    number: '03',
    title: 'The Vine Passage',
    chinese: '小学的藤蔓走廊',
    sound: 'Sneakers on concrete, cicadas, a paper fortune teller opening and closing',
    description: 'Every direction felt possible in the corridor between the last class and the evening outside.',
    x: 40,
    y: 61,
    mobileX: 49,
    mobileY: 52,
    frequency: 523.25,
  },
  {
    id: 'music-room',
    number: '04',
    title: 'The Music Room',
    chinese: '每周一次的电子琴课',
    sound: 'A metronome, three hesitant notes, the room holding the rest',
    description: 'What once felt like practice can return years later as a private place of comfort.',
    x: 64,
    y: 57,
    mobileX: 63,
    mobileY: 48,
    frequency: 329.63,
  },
  {
    id: 'lit-window',
    number: '05',
    title: 'The Lit Window',
    chinese: '爷爷奶奶家的下午',
    sound: 'An old fan, a porcelain plate, watermelon set down on the table',
    description: 'Nothing remarkable happened here. That is why the afternoon now feels impossible to replace.',
    x: 86,
    y: 27,
    mobileX: 76,
    mobileY: 42,
    frequency: 220,
  },
  {
    id: 'underground-arcade',
    number: '06',
    title: 'The Underground Arcade',
    chinese: '商场下面的另一座城市',
    sound: 'Escalator hum, carousel bells, a birthday gift wrapped downstairs',
    description: 'Below the ordinary street, fluorescent corridors promised toys, games, and one more turn before leaving.',
    x: 88,
    y: 76,
    mobileX: 84,
    mobileY: 64,
    frequency: 261.63,
  },
]

const twinkles = [
  [8, 18, 0], [16, 30, 1.2], [24, 12, 2.1], [32, 23, .4], [42, 14, 1.7],
  [53, 9, .8], [62, 21, 2.4], [72, 13, .2], [82, 25, 1.4], [91, 11, 2.7],
  [12, 80, 2.2], [23, 72, .7], [36, 87, 1.5], [48, 76, 2.8], [59, 84, .3],
  [69, 72, 1.9], [79, 88, .9], [92, 79, 2.5], [45, 35, 1.1], [57, 31, 2.3],
]

function playPortalCue(portal: Portal, audioRef: MutableRefObject<AudioContext | null>) {
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return
  if (!audioRef.current) audioRef.current = new AudioContextClass()
  const context = audioRef.current
  void context.resume()

  const now = context.currentTime
  const master = context.createGain()
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1900, now)
  filter.frequency.exponentialRampToValueAtTime(420, now + 2.4)
  master.gain.setValueAtTime(0.0001, now)
  master.gain.exponentialRampToValueAtTime(0.055, now + 0.08)
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.5)
  filter.connect(master)
  master.connect(context.destination)

  ;[1, 1.5, 2].forEach((ratio, index) => {
    const oscillator = context.createOscillator()
    const oscillatorGain = context.createGain()
    oscillator.type = index === 0 ? 'sine' : 'triangle'
    oscillator.frequency.setValueAtTime(portal.frequency * ratio, now + index * 0.11)
    oscillatorGain.gain.value = index === 0 ? 0.55 : 0.16
    oscillator.connect(oscillatorGain)
    oscillatorGain.connect(filter)
    oscillator.start(now + index * 0.11)
    oscillator.stop(now + 2.6)
  })
}

function DuskNeighborhood({ onReturn }: DuskNeighborhoodProps) {
  const [activePortal, setActivePortal] = useState<Portal | null>(null)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const audioRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActivePortal(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      // The context is created lazily after this effect, so cleanup must read the latest ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const audioContext = audioRef.current
      if (audioContext) void audioContext.close()
    }
  }, [])

  const selectPortal = (portal: Portal) => {
    setActivePortal(portal)
    playPortalCue(portal, audioRef)
  }

  const sceneStyle = {
    '--parallax-x': `${pointer.x * -8}px`,
    '--parallax-y': `${pointer.y * -5}px`,
  } as CSSProperties

  return (
    <section
      className="neighborhood"
      style={sceneStyle}
      onPointerMove={(event) => {
        setPointer({
          x: event.clientX / window.innerWidth - 0.5,
          y: event.clientY / window.innerHeight - 0.5,
        })
      }}
      aria-label="A dusk neighborhood stitched from shared memories"
    >
      <img
        className="neighborhood-background"
        src="/images/neighborhood-dusk.webp"
        alt="A dreamlike neighborhood at dusk with warm windows, a corner shop, a school passage, and an underground arcade"
      />
      <div className="neighborhood-shade" />

      {twinkles.map(([x, y, delay]) => (
        <span
          className="neighborhood-star"
          key={`${x}-${y}`}
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }}
          aria-hidden="true"
        >
          ✦
        </span>
      ))}

      <header className="neighborhood-header">
        <div>
          <p className="neighborhood-kicker">When Tomorrow Felt Brighter</p>
          <p className="neighborhood-chinese">当明天还在发亮</p>
        </div>
        <button type="button" className="return-button" aria-label="Return to the valley" onClick={onReturn}>
          <span aria-hidden="true">←</span><span className="return-label">Return to the valley</span>
        </button>
      </header>

      <div className="neighborhood-intro">
        <p>An evening stitched from many memories</p>
        <h2>Choose a light.<br />There is no first door.</h2>
      </div>

      <div className="portal-layer" aria-label="Places to enter">
        {portals.map((portal) => {
          const style = {
            '--portal-x': `${portal.x}%`,
            '--portal-y': `${portal.y}%`,
            '--portal-mobile-x': `${portal.mobileX}%`,
            '--portal-mobile-y': `${portal.mobileY}%`,
          } as CSSProperties
          return (
            <button
              key={portal.id}
              type="button"
              className={`portal-marker ${activePortal?.id === portal.id ? 'active' : ''}`}
              style={style}
              aria-label={`Enter ${portal.title}`}
              onClick={() => selectPortal(portal)}
            >
              <span className="portal-pulse" />
              <span className="portal-label">
                <small>{portal.number}</small>
                {portal.title}
              </span>
            </button>
          )
        })}
      </div>

      <div className="place-rail" aria-label="All places">
        {portals.map((portal) => (
          <button
            type="button"
            key={portal.id}
            aria-label={`Open ${portal.title}`}
            onClick={() => selectPortal(portal)}
          >
            <small>{portal.number}</small>{portal.title}
          </button>
        ))}
      </div>

      <p className="neighborhood-hint">Follow a window, a doorway, or a sound.</p>

      <aside className={`portal-card ${activePortal ? 'open' : ''}`} aria-live="polite">
        {activePortal && (
          <>
            <button type="button" className="portal-close" onClick={() => setActivePortal(null)} aria-label="Close place details">
              ×
            </button>
            <p className="portal-number">Place {activePortal.number}</p>
            <h3>{activePortal.title}</h3>
            <p className="portal-card-chinese">{activePortal.chinese}</p>
            <p className="portal-description">{activePortal.description}</p>
            <div className="portal-sound">
              <span aria-hidden="true">◌</span>
              <p><small>Listen for</small>{activePortal.sound}</p>
            </div>
            <button type="button" className="listen-button" onClick={() => playPortalCue(activePortal, audioRef)}>
              Hear this place again
            </button>
          </>
        )}
      </aside>
    </section>
  )
}

export default DuskNeighborhood
