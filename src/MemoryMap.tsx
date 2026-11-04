import { type CSSProperties, type MutableRefObject, useEffect, useRef, useState } from 'react'

type MemoryMapProps = {
  onReturn: () => void
}

type MapNode = {
  id: string
  number: string
  title: string
  chinese: string
  era: string
  sound: string
  description: string
  x: number
  y: number
  glow: string
  frequency: number
}

type MapTransform = {
  x: number
  y: number
  scale: number
}

const WORLD_WIDTH = 1600
const WORLD_HEIGHT = 900

const mapNodes: MapNode[] = [
  {
    id: 'winter-street',
    number: '01',
    title: 'Winter Street',
    chinese: '可以一起庆祝的街道',
    era: 'PUBLIC JOY',
    sound: 'String lights clicking on, paper bags, a holiday song from a shop speaker',
    description: 'A few ornaments and warm bulbs could make an ordinary street feel as if everyone was waiting for something good together.',
    x: 16,
    y: 20,
    glow: '#f3b7ff',
    frequency: 659.25,
  },
  {
    id: 'bookshop-dream',
    number: '02',
    title: 'Bookshop Dream',
    chinese: '书架前还没有被限定的未来',
    era: 'POSSIBILITY',
    sound: 'Pages turning, a pencil moving across a fashion sketch, quiet shop music',
    description: 'Before adulthood became practical, one book could open a future in which becoming a designer felt completely possible.',
    x: 50,
    y: 18,
    glow: '#ffc76f',
    frequency: 523.25,
  },
  {
    id: 'grandparents-room',
    number: '03',
    title: 'The Summer Room',
    chinese: '爷爷奶奶家的下午',
    era: 'UNHURRIED TIME',
    sound: 'An old fan, cicadas, a porcelain plate of watermelon touching the table',
    description: 'Nothing spectacular happened here. The feeling came from having nowhere else to be and believing the afternoon would always return.',
    x: 83,
    y: 21,
    glow: '#ffd99c',
    frequency: 220,
  },
  {
    id: 'school-corner',
    number: '04',
    title: 'After School',
    chinese: '藤蔓走廊和五毛钱的小卡片',
    era: 'TIME WITHOUT PRICE',
    sound: 'Sneakers on concrete, marbles, cards hitting the ground, bicycle bells',
    description: 'The walk home expanded into games, arguments and one more round. Five-mao cards were enough to build a whole social world.',
    x: 17,
    y: 50,
    glow: '#9dffbd',
    frequency: 783.99,
  },
  {
    id: 'music-room',
    number: '05',
    title: 'Music Room',
    chinese: '每周一次的电子琴课',
    era: 'WHAT REMAINED',
    sound: 'A metronome, three hesitant notes, the small electronic hum between them',
    description: 'Practice once felt like an obligation. Years later, the same keys became somewhere to rest when the world grew louder.',
    x: 51,
    y: 50,
    glow: '#72d5ff',
    frequency: 329.63,
  },
  {
    id: 'underground-mall',
    number: '06',
    title: 'Underground Mall',
    chinese: '商场下面的另一座城市',
    era: 'EVERYTHING OPENING',
    sound: 'Escalator hum, toy demos, bright shop music folding into the corridor',
    description: 'Fluorescent passages promised gifts, games and new things arriving. Even going downstairs felt like entering a larger future.',
    x: 82,
    y: 50,
    glow: '#ff83d5',
    frequency: 261.63,
  },
  {
    id: 'carousel-park',
    number: '07',
    title: 'Carousel Park',
    chinese: '唯一的问题是能不能再坐一圈',
    era: 'PLAY WITHOUT PURPOSE',
    sound: 'Carousel bells, ticket stubs tearing, a mechanical horse beginning another circle',
    description: 'The ride went nowhere, which was exactly the point. Happiness could be measured in whether there was time for one more turn.',
    x: 29,
    y: 80,
    glow: '#ffbd78',
    frequency: 587.33,
  },
  {
    id: 'birthday-market',
    number: '08',
    title: 'Birthday Market',
    chinese: '拽着爸爸妈妈去挑礼物',
    era: 'SMALL ABUNDANCE',
    sound: 'Wrapping paper, plastic toys, a shopkeeper testing lights and batteries',
    description: 'The gift mattered, but so did the abundance around it: shelves of choices and the certainty that another birthday was coming.',
    x: 69,
    y: 80,
    glow: '#ff799f',
    frequency: 698.46,
  },
]

function playMapCue(node: MapNode, audioRef: MutableRefObject<AudioContext | null>) {
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
  filter.frequency.setValueAtTime(2400, now)
  filter.frequency.exponentialRampToValueAtTime(520, now + 2.8)
  master.gain.setValueAtTime(0.0001, now)
  master.gain.exponentialRampToValueAtTime(0.045, now + 0.09)
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.9)
  filter.connect(master)
  master.connect(context.destination)

  ;[1, 1.25, 1.5].forEach((ratio, index) => {
    const oscillator = context.createOscillator()
    const oscillatorGain = context.createGain()
    oscillator.type = index === 0 ? 'sine' : 'triangle'
    oscillator.frequency.setValueAtTime(node.frequency * ratio, now + index * 0.12)
    oscillatorGain.gain.value = index === 0 ? 0.5 : 0.13
    oscillator.connect(oscillatorGain)
    oscillatorGain.connect(filter)
    oscillator.start(now + index * 0.12)
    oscillator.stop(now + 3)
  })
}

function getInitialTransform(): MapTransform {
  const mobileScale = window.innerWidth <= 820 ? 0.68 : Math.min(1, window.innerWidth / WORLD_WIDTH, window.innerHeight / WORLD_HEIGHT)
  return {
    scale: mobileScale,
    x: (window.innerWidth - WORLD_WIDTH * mobileScale) / 2,
    y: (window.innerHeight - WORLD_HEIGHT * mobileScale) / 2,
  }
}

function MemoryMap({ onReturn }: MemoryMapProps) {
  const [activeNode, setActiveNode] = useState<MapNode | null>(null)
  const [transform, setTransform] = useState<MapTransform>(getInitialTransform)
  const viewportRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<AudioContext | null>(null)
  const dragRef = useRef({ active: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0 })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveNode(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      // The sound context is created lazily after mount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const audioContext = audioRef.current
      if (audioContext) void audioContext.close()
    }
  }, [])

  const zoomAt = (nextScale: number, clientX = window.innerWidth / 2, clientY = window.innerHeight / 2) => {
    setTransform((current) => {
      const scale = Math.min(1.55, Math.max(0.55, nextScale))
      const worldX = (clientX - current.x) / current.scale
      const worldY = (clientY - current.y) / current.scale
      return {
        scale,
        x: clientX - worldX * scale,
        y: clientY - worldY * scale,
      }
    })
  }

  const selectNode = (node: MapNode) => {
    if (dragRef.current.moved) return
    setActiveNode(node)
    playMapCue(node, audioRef)
  }

  const worldStyle = {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
  } as CSSProperties

  return (
    <section className="memory-map" aria-label="A map of brighter tomorrows">
      <div
        ref={viewportRef}
        className={`map-viewport ${dragRef.current.active ? 'dragging' : ''}`}
        onWheel={(event) => {
          zoomAt(transform.scale * Math.exp(-event.deltaY * 0.001), event.clientX, event.clientY)
        }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('button')) return
          dragRef.current = {
            active: true,
            moved: false,
            startX: event.clientX,
            startY: event.clientY,
            originX: transform.x,
            originY: transform.y,
          }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (!dragRef.current.active) return
          const dx = event.clientX - dragRef.current.startX
          const dy = event.clientY - dragRef.current.startY
          if (Math.abs(dx) + Math.abs(dy) > 4) dragRef.current.moved = true
          setTransform((current) => ({ ...current, x: dragRef.current.originX + dx, y: dragRef.current.originY + dy }))
        }}
        onPointerUp={(event) => {
          dragRef.current.active = false
          event.currentTarget.releasePointerCapture(event.pointerId)
          window.setTimeout(() => { dragRef.current.moved = false }, 0)
        }}
      >
        <div className="map-world" style={worldStyle}>
          <img
            className="map-art"
            src={`${import.meta.env.BASE_URL}images/brighter-worlds-map.webp`}
            alt="A cosmic map of eight miniature worlds from ordinary life in 2010s China"
            draggable="false"
          />
          {mapNodes.map((node) => {
            const nodeStyle = {
              '--node-x': `${node.x}%`,
              '--node-y': `${node.y}%`,
              '--node-glow': node.glow,
            } as CSSProperties
            return (
              <button
                type="button"
                key={node.id}
                className={`map-node ${activeNode?.id === node.id ? 'active' : ''}`}
                style={nodeStyle}
                aria-label={`Open ${node.title}`}
                onClick={() => selectNode(node)}
              >
                <span className="map-node-orbit" />
                <span className="map-node-label"><small>{node.number}</small>{node.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      <header className="map-header">
        <div>
          <p className="map-wordmark">When Tomorrow Felt Brighter</p>
          <p className="map-chinese">当明天还在发亮</p>
        </div>
        <div className="map-heading">
          <small>THE BRIGHTER YEARS · 2010s</small>
          <h2>A Map of Possible Tomorrows</h2>
        </div>
        <button type="button" className="return-button" aria-label="Return to the flower valley" onClick={onReturn}>
          <span aria-hidden="true">←</span><span className="return-label">Return to the valley</span>
        </button>
      </header>

      <div className="map-controls" aria-label="Map controls">
        <button type="button" aria-label="Zoom out" onClick={() => zoomAt(transform.scale - 0.15)}>−</button>
        <button type="button" aria-label="Reset map" onClick={() => setTransform(getInitialTransform())}>◎</button>
        <button type="button" aria-label="Zoom in" onClick={() => zoomAt(transform.scale + 0.15)}>＋</button>
      </div>

      <div className="map-guide">
        <p>Drag to move · Scroll to zoom · Choose any world</p>
        <span><b>08</b> places connected by no fixed route</span>
      </div>

      <aside className={`map-card ${activeNode ? 'open' : ''}`} aria-live="polite">
        {activeNode && (
          <>
            <button type="button" className="map-card-close" onClick={() => setActiveNode(null)} aria-label="Close place details">×</button>
            <div className="map-card-meta"><span>{activeNode.number}</span>{activeNode.era}</div>
            <h3>{activeNode.title}</h3>
            <p className="map-card-chinese">{activeNode.chinese}</p>
            <p className="map-card-description">{activeNode.description}</p>
            <div className="map-card-sound">
              <span aria-hidden="true">◌</span>
              <p><small>Listen for</small>{activeNode.sound}</p>
            </div>
            <button type="button" className="map-listen" onClick={() => playMapCue(activeNode, audioRef)}>Hear this world again</button>
          </>
        )}
      </aside>
    </section>
  )
}

export default MemoryMap
