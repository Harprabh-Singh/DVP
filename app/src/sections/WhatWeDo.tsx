import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSiteImages } from '../content/SiteImagesContext'
import './WhatWeDo.css'

gsap.registerPlugin(ScrollTrigger)

const activities = [
  {
    title: 'Discover',
    chapter: 'Find the unheard',
    description: 'We travel into Rajasthan’s artistic communities to meet performers where they live, listen to their stories and build relationships founded on trust.',
    detail: 'Field research · Artist outreach · Community relationships',
    image: '/images/work-discover.avif',
    alt: 'A cultural researcher meeting Manganiyar musicians in a Rajasthani desert village',
  },
  {
    title: 'Document',
    chapter: 'Preserve with purpose',
    description: 'Through artist-approved interviews, portraits and performance records, we document not just what they perform—but the lineage, language and meaning behind it.',
    detail: 'Interviews · Verified profiles · Audio-visual archives',
    image: '/images/work-document.avif',
    alt: 'A musician sharing his story during a documented field interview',
  },
  {
    title: 'Recognise',
    chapter: 'Give craft its due',
    description: 'We present every artist with the editorial care their knowledge deserves, making their identity, expertise and cultural contribution visible and properly credited.',
    detail: 'Editorial portraits · Artist stories · Cultural context',
    image: '/images/work-recognise.avif',
    alt: 'A dignified portrait of an elderly Manganiyar musician with his kamaicha',
  },
  {
    title: 'Promote',
    chapter: 'Carry voices forward',
    description: 'We create pathways to stages, institutions and new audiences in India and internationally—turning visibility into appreciation, opportunities and sustainable recognition.',
    detail: 'Digital storytelling · Cultural showcases · Booking enquiries',
    image: '/images/work-promote.avif',
    alt: 'Rajasthani folk artists performing for an audience at a cultural festival',
  },
]

export default function WhatWeDo() {
  const { getImage, getImageBySrc } = useSiteImages()
  const sectionRef = useRef<HTMLElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      const backgrounds = gsap.utils.toArray<HTMLElement>('.work-background')
      const chapters = gsap.utils.toArray<HTMLElement>('.work-chapter')
      const setProgress = gsap.quickSetter(progressRef.current, 'scaleX')

      gsap.set(backgrounds.slice(1), { opacity: 0 })
      gsap.set(chapters.slice(1), { opacity: 0, y: 34 })
      gsap.set(chapters[0], { opacity: 1, y: 0 })

      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setProgress(self.progress)
            const next = Math.min(activities.length - 1, Math.floor(self.progress * activities.length))
            if (next !== activeRef.current) {
              activeRef.current = next
              setActive(next)
            }
          },
        },
      })

      timeline.fromTo(backgrounds[0], { scale: 1.07 }, { scale: 1, duration: 0.8 }, 0)

      activities.slice(1).forEach((_, index) => {
        const step = index + 1
        timeline
          .to(chapters[step - 1], { opacity: 0, y: -26, duration: 0.18 }, step - 0.22)
          .to(backgrounds[step - 1], { opacity: 0, scale: 1.035, duration: 0.35 }, step - 0.2)
          .fromTo(
            backgrounds[step],
            { opacity: 0, scale: 1.08 },
            { opacity: 1, scale: 1, duration: 0.55 },
            step - 0.2,
          )
          .fromTo(
            chapters[step],
            { opacity: 0, y: 34 },
            { opacity: 1, y: 0, duration: 0.28 },
            step - 0.08,
          )
      })
    }, section)

    return () => ctx.revert()
  }, [])

  const goToStep = (index: number) => {
    const section = sectionRef.current
    if (!section) return
    const top = section.getBoundingClientRect().top + window.scrollY
    const range = section.offsetHeight - window.innerHeight
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: top + range * (index / (activities.length - 1)), behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <>
      <section className="work-scroll" ref={sectionRef} aria-labelledby="work-section-title">
        <div className="work-sticky">
          <div className="work-backgrounds" aria-hidden="true">
            {activities.map((activity, index) => (
              <div className={`work-background work-background-${index}`} key={activity.title}>
                <picture className="work-picture">
                  {index === 2 && (
                    <source media="(max-width: 700px)" srcSet={getImage('heroMobile')} />
                  )}
                  {index === 3 && (
                    <source media="(max-width: 700px)" srcSet={getImage('workPromoteMobile')} />
                  )}
                  <img src={getImageBySrc(activity.image)} alt="" loading={index === 0 ? 'eager' : 'lazy'} />
                </picture>
              </div>
            ))}
          </div>
          <div className="work-scrim" />
          <div className="work-glow" />
          <div className="work-grain" />
          <div className="work-frame" />

          <header className="work-header">
            <div>
              <span className="work-label"><span />Our practice</span>
              <h2 id="work-section-title">What we do</h2>
            </div>
            <p>From the field<br />to the world stage.</p>
          </header>

          <div className="work-chapters">
            {activities.map((activity, index) => (
              <article className="work-chapter" key={activity.title} aria-hidden={active !== index}>
                <span className="work-chapter-kicker">0{index + 1} / {activity.chapter}</span>
                <h3>{activity.title}<span>.</span></h3>
                <p>{activity.description}</p>
                <div className="work-detail"><span />{activity.detail}</div>
              </article>
            ))}
          </div>

          <nav className="work-nav" aria-label="What we do chapters">
            {activities.map((activity, index) => (
              <button
                key={activity.title}
                className={active === index ? 'is-active' : ''}
                onClick={() => goToStep(index)}
                aria-current={active === index ? 'step' : undefined}
                aria-label={`Go to ${activity.title} chapter`}
              >
                <span>0{index + 1}</span>
                <span>{activity.title}</span>
                <ArrowUpRight size={14} strokeWidth={1.3} />
              </button>
            ))}
          </nav>

          <div className="work-scroll-note"><ArrowDown size={14} strokeWidth={1.2} />Scroll to follow the journey</div>
          <div className="work-progress" aria-hidden="true">
            <span>0{active + 1}</span>
            <div><span ref={progressRef} /></div>
            <span>04</span>
          </div>
        </div>
      </section>

      <section className="work-reduced" aria-labelledby="work-reduced-title">
        <span className="work-label"><span />Our practice</span>
        <h2 id="work-reduced-title">What we do</h2>
        {activities.map((activity, index) => (
          <article key={activity.title}>
            <img src={getImageBySrc(activity.image)} alt={activity.alt} loading="lazy" />
            <span>0{index + 1} / {activity.chapter}</span>
            <h3>{activity.title}.</h3>
            <p>{activity.description}</p>
          </article>
        ))}
      </section>
    </>
  )
}
