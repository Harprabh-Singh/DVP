import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './ExploreArtists.css'

gsap.registerPlugin(ScrollTrigger)

type Tradition = {
  id: string
  name: string
  title: string
  image: string
  alt: string
  language: string
  region: string
  description: string
  forms: string[]
}

const traditions: Tradition[] = [
  {
    id: 'manganiyar-voices',
    name: 'Manganiyar voices',
    title: 'Voices that carry the desert.',
    image: '/images/artist-vocalist.avif',
    alt: 'A Manganiyar folk vocalist singing with a traditional string instrument',
    language: 'मांगणियार',
    region: 'Jaisalmer · Barmer',
    description: 'Songs of lineage, celebration and belonging—held in memory and passed from one generation to the next. We document the voice alongside the stories and cultural context that give it meaning.',
    forms: ['Vocal traditions', 'Oral histories', 'Generational teaching'],
  },
  {
    id: 'folk-instruments',
    name: 'Folk instrumentalists',
    title: 'Strings that remember.',
    image: '/images/artist-instrumentalist.avif',
    alt: 'A Rajasthani folk instrumentalist with a traditional bowed string instrument',
    language: 'वाद्य परंपरा',
    region: 'Western Rajasthan',
    description: 'From the resonance of the kamaicha to the bright cadence of the algoza, each instrument carries a distinct musical language. Artist-led profiles honour both the craft and the person behind it.',
    forms: ['Kamaicha', 'Sarangi', 'Algoza'],
  },
  {
    id: 'folk-dancers',
    name: 'Folk dancers',
    title: 'Movement becomes memory.',
    image: '/images/artist-dancer.avif',
    alt: 'A Rajasthani folk dancer turning in a traditional embroidered dress',
    language: 'नृत्य परंपरा',
    region: 'Across the Thar',
    description: 'Gesture, rhythm and costume become a living archive of community identity. We present dance as more than spectacle—as embodied knowledge shaped by place, ceremony and generations of practice.',
    forms: ['Kalbelia', 'Ghoomar', 'Bhavai'],
  },
  {
    id: 'folk-percussion',
    name: 'Rhythm keepers',
    title: 'The pulse beneath every story.',
    image: '/images/artist-percussionist.avif',
    alt: 'A Rajasthani folk percussionist playing a traditional dholak at dusk',
    language: 'ताल वाद्य',
    region: 'Rajasthan',
    description: 'Percussion brings people together—marking celebration, devotion and collective memory. We recognise the rhythm keepers whose listening, timing and technique hold an entire performance together.',
    forms: ['Dholak', 'Khartal', 'Nagara'],
  },
]

export default function ExploreArtists() {
  const sectionRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const detailsRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)
  const [active, setActive] = useState(0)
  const tradition = traditions[active]

  const selectTradition = (index: number) => {
    setActive((index + traditions.length) % traditions.length)
  }

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const ctx = gsap.context(() => {
      const elements = gsap.utils.toArray<HTMLElement>('[data-artist-reveal]')
      gsap.set(elements, { opacity: 0, y: 42 })
      ScrollTrigger.create({
        trigger: section,
        start: 'top 78%',
        once: true,
        onEnter: () => {
          gsap.to(elements, { opacity: 1, y: 0, duration: 1.05, ease: 'expo.out', stagger: 0.1 })
          const curtainTexture = new Image()
          curtainTexture.src = '/images/theatre-velvet.avif'
          traditions.forEach((item) => {
            const preload = new Image()
            preload.src = item.image
          })
        },
      })
    }, section)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const image = imageRef.current
    const details = detailsRef.current?.querySelectorAll('[data-detail]')
    const leftCurtain = sectionRef.current?.querySelector('.artist-curtain-left')
    const rightCurtain = sectionRef.current?.querySelector('.artist-curtain-right')
    if (!image || !details || !leftCurtain || !rightCurtain) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      gsap.set([image, ...details], { opacity: 1, x: 0, y: 0, scale: 1 })
      gsap.set([leftCurtain, rightCurtain], { display: 'none' })
      return
    }

    const leftFolds = Array.from(leftCurtain.querySelectorAll('.artist-curtain-slice'))
    const rightFolds = Array.from(rightCurtain.querySelectorAll('.artist-curtain-slice'))
    const folds = [...leftFolds, ...rightFolds]
    const timeline = gsap.timeline()
    timeline
      .set([leftCurtain, rightCurtain], { visibility: 'visible', opacity: 1, x: 0, xPercent: 0, scaleX: 1, rotationY: 0 })
      .set(folds, { skewY: 0, scaleY: 1 })
      .fromTo(image, { scale: 1.035 }, { scale: 1, duration: 1.65, ease: 'expo.out' }, 0)
      .to(leftCurtain, { scaleX: 0.18, rotationY: -8, duration: 1.5, ease: 'power3.inOut' }, 0.08)
      .to(rightCurtain, { scaleX: 0.18, rotationY: 8, duration: 1.5, ease: 'power3.inOut' }, 0.08)
      .to(folds, {
        skewY: (index) => index % 2 === 0 ? 1.6 : -1.6,
        scaleY: 1.014,
        duration: 0.42,
        ease: 'sine.inOut',
        stagger: { each: 0.018, from: 'center' },
        repeat: 1,
        yoyo: true,
      }, 0.18)
      .to([leftCurtain, rightCurtain], { opacity: 0, duration: 0.18, ease: 'power1.out' }, 1.44)
      .set([leftCurtain, rightCurtain], { visibility: 'hidden' }, 1.64)
      .fromTo(details, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.58, ease: 'expo.out', stagger: 0.055 }, 0.66)
    return () => { timeline.kill() }
  }, [active])

  return (
    <section className="artists-section" id="artists" ref={sectionRef} aria-labelledby="artists-title">
      <div className="artists-transition" aria-hidden="true" />
      <div className="artists-ambient artists-ambient-one" aria-hidden="true" />
      <div className="artists-ambient artists-ambient-two" aria-hidden="true" />
      <div className="artists-grain" aria-hidden="true" />
      <div className="artists-outline" aria-hidden="true">ARTISTS</div>

      <div className="artists-inner">
        <header className="artists-heading">
          <div data-artist-reveal>
            <div className="artists-label"><span />The people behind the tradition</div>
            <h2 id="artists-title">Explore <em>artists.</em></h2>
          </div>
          <div className="artists-intro" data-artist-reveal>
            <span className="artists-intro-index">02 / Living heritage</span>
            <p>Meet the traditions through the people who carry them—not as relics of the past, but as artists shaping Rajasthan’s cultural future.</p>
          </div>
        </header>

        <div className="artists-experience">
          <nav className="artist-category-list" aria-label="Explore artist traditions" data-artist-reveal>
            {traditions.map((item, index) => (
              <button
                key={item.id}
                className={`artist-category ${active === index ? 'is-active' : ''}`}
                onClick={() => selectTradition(index)}
                aria-pressed={active === index}
                aria-label={`Show ${item.name}`}
              >
                <span className="artist-category-number">0{index + 1}</span>
                <span className="artist-category-name">{item.name}</span>
                <ArrowUpRight size={16} strokeWidth={1.3} />
              </button>
            ))}
            <p>Four traditions.<br />Countless individual voices.</p>
          </nav>

          <div className="artist-portrait-wrap" data-artist-reveal>
            <div className="artist-portrait-frame">
              <img
                key={tradition.id}
                ref={imageRef}
                className="artist-portrait-image"
                src={tradition.image}
                alt={tradition.alt}
                width="1024"
                height="1280"
                loading="lazy"
                decoding="async"
              />
              <div className="artist-portrait-scrim" aria-hidden="true" />
              <span className="artist-portrait-language" lang="hi">{tradition.language}</span>
              <span className="artist-portrait-caption">Portrait of a living tradition</span>
              <div className="artist-curtain artist-curtain-left" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <span
                    className="artist-curtain-slice"
                    key={index}
                    style={{ left: `${index * (100 / 6)}%`, backgroundPosition: `${(index / 11) * 100}% center` }}
                  />
                ))}
              </div>
              <div className="artist-curtain artist-curtain-right" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <span
                    className="artist-curtain-slice"
                    key={index}
                    style={{ left: `${index * (100 / 6)}%`, backgroundPosition: `${((index + 6) / 11) * 100}% center` }}
                  />
                ))}
              </div>
            </div>
            <div className="artist-gallery-controls">
              <span><strong>0{active + 1}</strong> / 0{traditions.length}</span>
              <div className="artist-progress" aria-hidden="true">
                {traditions.map((item, index) => <span key={item.id} className={active === index ? 'is-active' : ''} />)}
              </div>
              <div className="artist-arrows">
                <button onClick={() => selectTradition(active - 1)} aria-label="Previous artist tradition"><ArrowLeft size={17} strokeWidth={1.3} /></button>
                <button onClick={() => selectTradition(active + 1)} aria-label="Next artist tradition"><ArrowRight size={17} strokeWidth={1.3} /></button>
              </div>
            </div>
          </div>

          <div className="artist-details" ref={detailsRef} aria-live="polite" data-artist-reveal>
            <div className="artist-detail-top" data-detail>
              <span>Tradition 0{active + 1}</span>
              <span>{tradition.region}</span>
            </div>
            <h3 data-detail>{tradition.title}</h3>
            <p data-detail>{tradition.description}</p>
            <div className="artist-forms" data-detail>
              {tradition.forms.map((form) => <span key={form}>{form}</span>)}
            </div>
            <div className="artist-principle" data-detail>
              <span className="artist-principle-mark">DVP</span>
              <p>Documented with consent.<br />Presented with dignity.</p>
            </div>
          </div>
        </div>

        <footer className="artists-footer" data-artist-reveal>
          <span>Every portrait begins with listening.</span>
          <span>Artists first · Context always · Recognition that lasts</span>
        </footer>
      </div>
    </section>
  )
}
