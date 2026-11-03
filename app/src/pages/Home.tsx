import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SplitType from 'split-type'
import WhatWeDo from '../sections/WhatWeDo'
import ExploreArtists from '../sections/ExploreArtists'
import CulturalHeritage from '../sections/CulturalHeritage'
import JoinTeam from '../sections/JoinTeam'
import Contact from '../sections/Contact'
import '../App.css'

gsap.registerPlugin(ScrollTrigger)

type ChapterKey = 'purpose' | 'artists' | 'heritage' | 'join' | 'contact'

const chapters: Record<ChapterKey, { label: string; title: string; body: string; footnote: string }> = {
  purpose: {
    label: 'Our purpose',
    title: 'A living archive. A visible future.',
    body: 'Desert Voice Project discovers, documents and promotes Rajasthan’s traditional folk artists—building professional, artist-approved profiles and creating pathways to wider audiences and meaningful opportunities.',
    footnote: 'An initiative by Rajasthan Leaders Association',
  },
  artists: {
    label: 'Explore artists',
    title: 'Every tradition. Every voice.',
    body: 'From Manganiyar singers and instrumentalists to folk dancers and traditional performers, DVP is creating a respectful, verified portrait of the artists who carry Rajasthan’s living heritage.',
    footnote: 'Discovery · Documentation · Recognition · Promotion',
  },
  heritage: {
    label: 'Cultural heritage',
    title: 'Passed hand to hand. Generation to generation.',
    body: 'We look beyond the performance to document the lineages, instruments, languages and stories that give each art form its identity—always with the artist’s consent and cultural context at the centre.',
    footnote: 'Their knowledge. Their stories. Their rights.',
  },
  join: {
    label: 'Join our team',
    title: 'The circle is open.',
    body: 'Bring your curiosity, craft and perspective to a shared cultural practice.',
    footnote: 'Many skills. One purpose.',
  },
  contact: {
    label: 'Contact',
    title: 'Let’s carry the voice forward.',
    body: 'Start a conversation with the Desert Voice Project team.',
    footnote: 'Artists · Bookings · Collaborations',
  },
}

export default function Home() {
  const rootRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [imageReady, setImageReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeChapter, setActiveChapter] = useState<ChapterKey | null>(null)

  const openChapter = (chapter: ChapterKey) => {
    setMenuOpen(false)
    if (chapter !== 'purpose') {
      setActiveChapter(null)
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      document.getElementById(chapter)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
      return
    }
    setActiveChapter(chapter)
  }

  useEffect(() => {
    if (!activeChapter) return
    const previousFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveChapter(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [activeChapter])

  useEffect(() => {
    if (!imageReady || !rootRef.current) return
    const root = rootRef.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const splits: SplitType[] = []

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set([mediaRef.current, '.site-header', '.hero-reveal', '.hero-bottom', '.side-note'], {
          opacity: 1,
          y: 0,
          scale: 1,
        })
        gsap.set('.hero-curtain', { display: 'none' })
        return
      }

      const chars: HTMLElement[] = []
      root.querySelectorAll<HTMLElement>('.hero-title-line-text').forEach((line) => {
        const split = new SplitType(line, { types: 'chars', charClass: 'hero-char' })
        splits.push(split)
        chars.push(...(split.chars ?? []))
      })

      gsap.set(mediaRef.current, { opacity: 0, scale: 1.14 })
      gsap.set(['.site-header', '.side-note'], { opacity: 0, y: -18 })
      gsap.set('.hero-reveal', { opacity: 0, y: 24 })
      gsap.set('.hero-bottom', { opacity: 0, y: 18 })
      gsap.set(chars, {
        yPercent: 118,
        rotateX: -48,
        opacity: 0,
        transformPerspective: 700,
        transformOrigin: '50% 100%',
      })

      const timeline = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.08 })
      timeline
        .to('.hero-curtain', { scaleY: 0, duration: 1.3, ease: 'expo.inOut' }, 0)
        .to(mediaRef.current, { opacity: 1, scale: 1.035, duration: 1.9 }, 0.05)
        .to(['.site-header', '.side-note'], { opacity: 1, y: 0, duration: 1 }, 0.42)
        .to(chars, { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.2, stagger: 0.018 }, 0.5)
        .to('.hero-reveal', { opacity: 1, y: 0, duration: 0.95, stagger: 0.1 }, 1.0)
        .to('.hero-bottom', { opacity: 1, y: 0, duration: 0.9 }, 1.28)

      gsap.to(contentRef.current, {
        yPercent: -9,
        opacity: 0.3,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, root)

    return () => {
      ctx.revert()
      splits.forEach((split) => split.revert())
    }
  }, [imageReady])

  useEffect(() => {
    const root = rootRef.current
    const image = imageRef.current
    if (!root || !image) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(pointer: fine)').matches
    if (reduced || !finePointer) return

    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let frame = 0

    const onPointerMove = (event: PointerEvent) => {
      const bounds = root.getBoundingClientRect()
      target.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
      target.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
    }
    const onPointerLeave = () => {
      target.x = 0
      target.y = 0
    }
    const tick = (time: number) => {
      current.x += (target.x - current.x) * 0.045
      current.y += (target.y - current.y) * 0.045
      const breath = 1.045 + Math.sin(time * 0.00012) * 0.005
      image.style.transform = `translate3d(${current.x * -12}px, ${current.y * -8}px, 0) scale(${breath})`
      frame = requestAnimationFrame(tick)
    }

    root.addEventListener('pointermove', onPointerMove, { passive: true })
    root.addEventListener('pointerleave', onPointerLeave, { passive: true })
    frame = requestAnimationFrame(tick)
    return () => {
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerleave', onPointerLeave)
      cancelAnimationFrame(frame)
    }
  }, [])

  const chapter = activeChapter ? chapters[activeChapter] : null

  return (
    <main className="dvp-site" id="top">
      <section className="hero" ref={rootRef} aria-labelledby="hero-title">
        <div className="hero-media" ref={mediaRef}>
          <picture className="hero-picture">
            <source media="(max-width: 700px)" srcSet="/images/dvp-hero-mobile-full.avif" />
            <img
              ref={imageRef}
              className="hero-image"
              src="/images/dvp-hero.avif"
              alt="Manganiyar folk musicians performing in the Thar desert at dusk"
              fetchPriority="high"
              onLoad={() => setImageReady(true)}
            />
          </picture>
        </div>
        <div className="hero-scrim" />
        <div className="ambient-glow ambient-glow-one" />
        <div className="ambient-glow ambient-glow-two" />
        <div className="film-grain" />
        <div className="hero-curtain" />
        <div className="hero-hairline" />

        <header className="site-header">
          <button className="brand" onClick={() => openChapter('purpose')} aria-label="About Desert Voice Project">
            <img className="brand-logo" src="/images/dvp-logo.svg" alt="" width="66" height="66" decoding="async" />
          </button>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <button onClick={() => openChapter('purpose')}>Our purpose</button>
            <button onClick={() => openChapter('artists')}>Artists</button>
            <button onClick={() => openChapter('heritage')}>Heritage</button>
            <button onClick={() => openChapter('join')}>Join us</button>
          </nav>

          <button className="header-cta" onClick={() => openChapter('contact')}>
            <span>Contact us</span>
            <ArrowUpRight size={15} strokeWidth={1.5} />
          </button>

          <button
            className="menu-toggle"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={23} strokeWidth={1.4} /> : <Menu size={24} strokeWidth={1.4} />}
          </button>
        </header>

        <div className={`mobile-menu ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
          <div className="mobile-menu-inner">
            <span className="mobile-menu-label">Explore Desert Voice</span>
            {(['purpose', 'artists', 'heritage', 'join', 'contact'] as ChapterKey[]).map((item, index) => (
              <button key={item} onClick={() => openChapter(item)} tabIndex={menuOpen ? 0 : -1}>
                <span>0{index + 1}</span>
                {chapters[item].label}
                <ArrowUpRight size={22} strokeWidth={1.2} />
              </button>
            ))}
            <p>Their Roots. Their Music. Their Identity.</p>
          </div>
        </div>

        <div className="hero-content" ref={contentRef}>
          <div className="hero-eyebrow hero-reveal">
            <span className="eyebrow-line" />
            <span>Living heritage of Rajasthan</span>
            <span className="devanagari" lang="hi">राजस्थान</span>
          </div>

          <h1 id="hero-title" className="hero-title" aria-label="Their roots. Their music. Their identity.">
            <span className="hero-title-line">
              <span className="hero-title-line-text">Their roots.</span>
            </span>
            <span className="hero-title-line hero-title-line-italic">
              <span className="hero-title-line-text">Their music.</span>
            </span>
            <span className="hero-title-line">
              <span className="hero-title-line-text">Their identity.</span>
            </span>
          </h1>

          <div className="hero-intro-row hero-reveal">
            <p className="hero-intro">
              Discovering, documenting and celebrating the traditional artists who carry Rajasthan’s living heritage forward.
            </p>
            <span className="intro-rule" aria-hidden="true" />
          </div>

          <div className="hero-actions hero-reveal">
            <button className="primary-cta" onClick={() => openChapter('purpose')}>
              <span>Explore the project</span>
              <span className="cta-icon"><ArrowRight size={17} strokeWidth={1.5} /></span>
            </button>
            <button className="text-cta" onClick={() => openChapter('artists')}>
              Meet the traditions
              <ArrowUpRight size={15} strokeWidth={1.4} />
            </button>
          </div>
        </div>

        <div className="side-note">
          <span>Western Rajasthan</span>
          <span className="side-note-dot" />
          <span>India</span>
        </div>

        <div className="hero-bottom">
          <div className="disciplines-heading">
            <span className="disciplines-index">01 — 04</span>
            <span>Traditions we honour</span>
          </div>
          <ul className="disciplines-list" aria-label="Artist disciplines">
            <li><span>01</span>Manganiyar singers</li>
            <li><span>02</span>Folk musicians</li>
            <li><span>03</span>Dancers</li>
            <li><span>04</span>Traditional performers</li>
          </ul>
          <span className="mobile-disciplines">Discover · Document · Recognise · Promote</span>
          <button className="story-hint" onClick={() => openChapter('heritage')} aria-label="Discover our cultural heritage">
            <span>Our heritage</span>
            <span className="hint-rail"><span className="hint-dot" /></span>
          </button>
        </div>

        {chapter && (
          <div className="story-dialog" role="presentation" onMouseDown={() => setActiveChapter(null)}>
            <section
              className="story-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="story-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="story-panel-top">
                <span>{chapter.label}</span>
                <button ref={closeRef} onClick={() => setActiveChapter(null)} aria-label="Close story preview">
                  <X size={20} strokeWidth={1.3} />
                </button>
              </div>
              <span className="story-number" aria-hidden="true">DVP</span>
              <h2 id="story-title">{chapter.title}</h2>
              <p>{chapter.body}</p>
              <div className="story-footnote">
                <span />
                {chapter.footnote}
              </div>
            </section>
          </div>
        )}
      </section>
      <WhatWeDo />
      <ExploreArtists />
      <CulturalHeritage />
      <JoinTeam />
      <Contact />
    </main>
  )
}
