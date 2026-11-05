import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSiteImages } from '../content/SiteImagesContext'
import './CulturalHeritage.css'

gsap.registerPlugin(ScrollTrigger)

const heritageItems = [
  {
    id: 'folk-music',
    title: 'Folk music',
    image: '/images/heritage-music.avif',
    alt: 'A Manganiyar vocalist performing with a traditional string instrument',
    note: 'The song and its social memory',
    description: 'We document repertoire, languages, occasions and lineages—so a song is understood not only by how it sounds, but by when it is sung, who it belongs to and what it remembers.',
    tags: ['Repertoire', 'Language', 'Lineage'],
  },
  {
    id: 'instruments',
    title: 'Instruments & craft',
    image: '/images/heritage-instruments.avif',
    alt: 'A Rajasthani musician seated with a traditional bowed string instrument',
    note: 'Material, technique and touch',
    description: 'An instrument holds the knowledge of its maker and its player. We record construction, tuning, playing technique and the small details that give each musical tradition its distinctive voice.',
    tags: ['Making', 'Tuning', 'Technique'],
  },
  {
    id: 'dance-movement',
    title: 'Dance & movement',
    image: '/images/heritage-dance.avif',
    alt: 'A Rajasthani folk dancer in a flowing embroidered dress',
    note: 'Knowledge held in the body',
    description: 'Movement, gesture, costume and rhythm form an embodied archive. Artist-led documentation keeps ceremonial context and community meaning at the centre, beyond the spectacle of performance.',
    tags: ['Gesture', 'Rhythm', 'Ceremony'],
  },
  {
    id: 'oral-traditions',
    title: 'Oral traditions',
    image: '/images/heritage-oral-traditions.avif',
    alt: 'A field researcher listening to a Rajasthani folk artist during a recorded conversation',
    note: 'Listening before recording',
    description: 'Stories, memories and inherited knowledge are recorded through consented conversations. Artists review how their words and identities are represented, keeping the archive accountable to the people within it.',
    tags: ['Stories', 'Memory', 'Consent'],
  },
]

export default function CulturalHeritage() {
  const { getImageBySrc } = useSiteImages()
  const sectionRef = useRef<HTMLElement>(null)
  const motionRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const firstRender = useRef(true)
  const [active, setActive] = useState(0)
  const item = heritageItems[active]

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const media = gsap.matchMedia()

    const ctx = gsap.context(() => {
      if (!reduced) {
        const elements = gsap.utils.toArray<HTMLElement>('[data-heritage-reveal]')
        gsap.set(elements, { opacity: 0, y: 38 })
        ScrollTrigger.create({
          trigger: section,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            gsap.to(elements, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1 })
            heritageItems.forEach((entry) => {
              const preload = new Image()
              preload.src = entry.image
            })
          },
        })
      }

      media.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
        if (!imageRef.current) return
        gsap.fromTo(imageRef.current, { yPercent: -3 }, {
          yPercent: 3,
          ease: 'none',
          scrollTrigger: {
            trigger: '.heritage-photo',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        })
      })
    }, section)

    return () => {
      media.revert()
      ctx.revert()
    }
  }, [])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const motion = motionRef.current
    const detail = sectionRef.current?.querySelector('.heritage-detail')
    if (!motion || !detail) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      gsap.set([motion, detail], { opacity: 1, x: 0, y: 0, scale: 1 })
      return
    }
    const timeline = gsap.timeline()
    timeline
      .fromTo(motion, { opacity: 0, x: 20, scale: 1.025 }, { opacity: 1, x: 0, scale: 1, duration: 0.72, ease: 'expo.out' })
      .fromTo(detail, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, 0.08)
    return () => { timeline.kill() }
  }, [active])

  return (
    <section className="heritage-section" id="heritage" ref={sectionRef} aria-labelledby="heritage-title">
      <div className="heritage-transition" aria-hidden="true" />
      <div className="heritage-ambient" aria-hidden="true" />
      <div className="heritage-grain" aria-hidden="true" />
      <div className="heritage-watermark" lang="hi" aria-hidden="true">धरोहर</div>

      <div className="heritage-inner">
        <header className="heritage-heading">
          <div data-heritage-reveal>
            <div className="heritage-label"><span />Cultural heritage</div>
            <h2 id="heritage-title">What lives <em>between the songs.</em></h2>
          </div>
          <div className="heritage-intro" data-heritage-reveal>
            <span lang="hi">संस्कृति · स्मृति · सम्मान</span>
            <p>A tradition is more than a performance. It is a network of people, places, memories and making—carried forward through everyday acts of teaching and listening.</p>
          </div>
        </header>

        <div className="heritage-ledger">
          <div className="heritage-visual" data-heritage-reveal>
            <div className="heritage-photo">
              <div className="heritage-image-motion" ref={motionRef}>
                <img
                  key={item.id}
                  ref={imageRef}
                  src={getImageBySrc(item.image)}
                  alt={item.alt}
                  width="1024"
                  height="1152"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="heritage-photo-scrim" aria-hidden="true" />
              <span className="heritage-photo-index">0{active + 1} / 04</span>
              <div className="heritage-field-note">
                <span>Field note</span>
                <p>{item.note}</p>
              </div>
            </div>
            <div className="heritage-visual-caption">
              <span>Living archive / Rajasthan</span>
              <span>Context is part of the craft.</span>
            </div>
          </div>

          <div className="heritage-accordion" data-heritage-reveal>
            {heritageItems.map((entry, index) => (
              <article key={entry.id} className={`heritage-item ${active === index ? 'is-active' : ''}`}>
                <h3>
                  <button
                    onClick={() => setActive(index)}
                    aria-expanded={active === index}
                    aria-controls={`heritage-panel-${index}`}
                    aria-label={`Explore ${entry.title}`}
                  >
                    <span className="heritage-item-number">0{index + 1}</span>
                    <span className="heritage-item-title">{entry.title}</span>
                    <span className="heritage-item-icon" aria-hidden="true"><Plus size={17} strokeWidth={1.25} /></span>
                  </button>
                </h3>
                {active === index && (
                  <div className="heritage-detail" id={`heritage-panel-${index}`} role="region" aria-label={entry.title}>
                    <p>{entry.description}</p>
                    <div className="heritage-tags">
                      {entry.tags.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                  </div>
                )}
              </article>
            ))}
            <div className="heritage-ledger-note">
              <span>Our approach</span>
              <p>Artist-led. Context-rich. Built to be accessible.</p>
            </div>
          </div>
        </div>

        <footer className="heritage-footer" data-heritage-reveal>
          <span>Not preserved behind glass.</span>
          <strong>Carried forward by people.</strong>
          <span className="heritage-footer-index">03 / Cultural memory</span>
        </footer>
      </div>
    </section>
  )
}
