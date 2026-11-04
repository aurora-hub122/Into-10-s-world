import { useEffect, useState } from 'react'
import { Flower2 } from 'lucide-react'

const menuItems = ['Home', 'The Rooms', 'The Archive', 'About']

function App() {
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [entering, setEntering] = useState(false)

  useEffect(() => {
    const mountTimer = window.setTimeout(() => setMounted(true), 100)
    const onScroll = () => setScrolled(window.scrollY > 40)

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.clearTimeout(mountTimer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen || entering ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen, entering])

  const toggleMenu = () => setMenuOpen((isOpen) => !isOpen)

  return (
    <main id="home" className="min-h-screen bg-black text-white">
      <header
        className={`fixed left-0 top-0 z-50 w-full transition-all duration-500 ${
          scrolled || menuOpen ? 'bg-black/80 backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 md:h-20 md:px-10">
          <a
            href="#home"
            className={`relative z-50 text-[0.7rem] font-semibold uppercase leading-tight tracking-[0.18em] transition-all duration-700 ease-entrance md:text-xs ${
              mounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
            }`}
            onClick={() => setMenuOpen(false)}
          >
            The Door Is
            <br />
            Still Open
          </a>

          <button
            type="button"
            className={`relative z-50 hidden items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm text-white/90 transition-[color,background-color,opacity,transform] duration-700 ease-entrance hover:bg-white/10 md:flex ${
              mounted ? 'translate-y-0 opacity-100 delay-200' : '-translate-y-4 opacity-0'
            }`}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={toggleMenu}
          >
            {menuOpen ? 'Close' : 'Navigate'}
          </button>

          <div
            className={`relative z-50 hidden transition-all duration-700 ease-entrance md:block ${
              mounted ? 'translate-y-0 opacity-100 delay-[400ms]' : '-translate-y-4 opacity-0'
            }`}
            aria-hidden="true"
          >
            <Flower2 className="h-7 w-7 text-white/90" strokeWidth={1.4} />
          </div>

          <button
            type="button"
            className={`relative z-50 flex h-8 w-8 flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-entrance md:hidden ${
              mounted ? 'translate-y-0 opacity-100 delay-200' : '-translate-y-4 opacity-0'
            }`}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={toggleMenu}
          >
            <span
              className={`h-[2px] w-6 bg-white transition-transform duration-500 ease-overlay ${
                menuOpen ? 'translate-y-[4px] rotate-45' : ''
              }`}
            />
            <span
              className={`h-[2px] w-6 bg-white transition-transform duration-500 ease-overlay ${
                menuOpen ? '-translate-y-[4px] -rotate-45' : ''
              }`}
            />
          </button>
        </nav>
      </header>

      <div
        id="site-menu"
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center bg-black transition-[opacity,visibility] duration-700 ease-overlay ${
          menuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex flex-col items-center gap-8 text-center">
          {menuItems.map((item, index) => (
            <a
              key={item}
              href={index === 0 ? '#home' : `#${item.toLowerCase().replace(' ', '-')}`}
              className={`font-instrument text-4xl text-white transition-[opacity,transform] duration-[600ms] ease-overlay hover:opacity-60 md:text-6xl ${
                menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}
              style={{ transitionDelay: menuOpen ? `${150 + index * 80}ms` : '0ms' }}
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
        </div>
      </div>

      <section className="relative flex h-screen w-full items-end overflow-hidden" aria-labelledby="hero-title">
        <div
          className={`absolute inset-0 transition-[opacity,transform,filter] duration-[1400ms] ease-entrance ${
            mounted ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
          } ${entering ? 'door-entering' : ''}`}
        >
          <img
            src="/images/door-hero.webp"
            alt="A weathered blue door glowing within a wall of flowers and dark foliage"
            className="h-full w-full object-cover object-[34%_center] md:object-center"
          />
        </div>

        <div className="relative z-10 ml-auto w-full px-6 pb-16 text-center md:w-[56%] md:px-10 md:pb-24 md:pr-[7vw] md:text-right">
          <p
            className={`mb-5 text-[0.62rem] font-medium uppercase tracking-[0.28em] text-white/65 transition-all duration-900 ease-entrance md:text-xs ${
              mounted ? 'translate-y-0 opacity-100 delay-[350ms]' : 'translate-y-8 opacity-0'
            }`}
          >
            An archive of ordinary attention
          </p>
          <h1
            id="hero-title"
            className={`mb-5 font-instrument text-[2.9rem] leading-[0.9] tracking-[-0.025em] text-white transition-all duration-900 ease-entrance sm:text-5xl md:mb-6 md:text-6xl lg:text-7xl xl:text-[5.3rem] ${
              mounted ? 'translate-y-0 opacity-100 delay-[450ms]' : 'translate-y-8 opacity-0'
            }`}
          >
            The Internet Forgot
            <br className="hidden sm:block" /> the Afternoon
          </h1>
          <p
            className={`mx-auto mb-8 max-w-md text-base leading-relaxed text-white/70 transition-all duration-900 ease-entrance md:mr-0 md:mb-10 md:text-lg ${
              mounted ? 'translate-y-0 opacity-100 delay-[650ms]' : 'translate-y-8 opacity-0'
            }`}
          >
            The internet remembers what we clicked. Who remembers what we felt?
          </p>
          <button
            type="button"
            className={`inline-flex items-center gap-3 rounded-full bg-white px-8 py-3.5 text-sm font-medium text-black transition-[background-color,opacity,transform] duration-900 ease-entrance hover:bg-white/90 md:text-base ${
              mounted ? 'translate-y-0 opacity-100 delay-[850ms]' : 'translate-y-8 opacity-0'
            }`}
            onClick={() => setEntering(true)}
          >
            Open the door
          </button>
        </div>

        <div
          className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black px-6 text-center transition-opacity duration-700 ${
            entering ? 'threshold-visible opacity-100' : 'opacity-0'
          }`}
          aria-hidden={!entering}
        >
          <div className="max-w-xl">
            <p className="mb-5 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-white/50">
              Somewhere behind this door
            </p>
            <p className="font-instrument text-4xl leading-tight text-white sm:text-5xl md:text-6xl">
              An afternoon is still waiting.
            </p>
            <button
              type="button"
              className="pointer-events-auto mt-10 rounded-full border border-white/25 px-6 py-3 text-sm text-white/80 transition-colors hover:bg-white hover:text-black"
              onClick={() => setEntering(false)}
            >
              Return to the door
            </button>
          </div>
        </div>

        <p className="absolute bottom-6 left-6 z-10 hidden text-[0.6rem] uppercase tracking-[0.2em] text-white/45 md:block">
          A memory archive · 2010s China
        </p>
      </section>
    </main>
  )
}

export default App
