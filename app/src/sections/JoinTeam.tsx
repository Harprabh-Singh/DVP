import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './JoinTeam.css'

gsap.registerPlugin(ScrollTrigger)

const contributions = [
  {
    id: 'research',
    short: 'Research',
    title: 'Field & research',
    statement: 'Listen first. Document with care.',
    description: 'Help build artist-approved profiles through thoughtful fieldwork, interviews, transcription, translation and cultural research. Every detail begins with trust.',
    skills: ['Fieldwork', 'Interviews', 'Languages'],
    hindi: 'सुनना',
  },
  {
    id: 'visual',
    short: 'Image & film',
    title: 'Image & film',
    statement: 'Frame the person, not just the performance.',
    description: 'Create portraits, films and visual records that honour the artist behind the art. Bring a patient eye, a collaborative process and respect for the context around every frame.',
    skills: ['Photography', 'Filmmaking', 'Editing'],
    hindi: 'देखना',
  },
  {
    id: 'design',
    short: 'Words & design',
    title: 'Words & design',
    statement: 'Give every story a form worthy of it.',
    description: 'Shape writing, identities, digital experiences and accessible archives that let each artist’s voice travel clearly—without flattening the nuance that makes it their own.',
    skills: ['Editorial', 'Design', 'Digital'],
    hindi: 'गढ़ना',
  },
  {
    id: 'outreach',
    short: 'Outreach',
    title: 'Community & outreach',
    statement: 'Help the right doors open.',
    description: 'Build thoughtful connections with communities, cultural spaces, educators and partners. Help create visibility that leads to lasting relationships and meaningful opportunities.',
    skills: ['Partnerships', 'Events', 'Community'],
    hindi: 'जोड़ना',
  },
]

export default function JoinTeam() {
  const sectionRef = useRef<HTMLElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)
  const [active, setActive] = useState(0)
  const contribution = contributions[active]

  const selectNext = () => setActive((current) => (current + 1) % contributions.length)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const ctx = gsap.context(() => {
      const elements = gsap.utils.toArray<HTMLElement>('[data-team-reveal]')
      gsap.set(elements, { opacity: 0, y: 38 })
      ScrollTrigger.create({
        trigger: section,
        start: 'top 78%',
        once: true,
        onEnter: () => gsap.to(elements, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.11 }),
      })

      gsap.to('.team-orbit-dash', {
        rotation: 360,
        duration: 90,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 50%',
      })
    }, section)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const details = detailRef.current?.querySelectorAll('[data-team-detail]')
    if (!details) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      gsap.set(details, { opacity: 1, x: 0, y: 0 })
      return
    }
    const tween = gsap.fromTo(details, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.55, ease: 'expo.out', stagger: 0.045 })
    return () => { tween.kill() }
  }, [active])

  return (
    <section className="team-section" id="join" ref={sectionRef} aria-labelledby="team-title">
      <div className="team-transition" aria-hidden="true" />
      <div className="team-glow" aria-hidden="true" />
      <div className="team-grain" aria-hidden="true" />
      <div className="team-watermark" lang="hi" aria-hidden="true">साथ</div>

      <div className="team-inner">
        <header className="team-heading">
          <div data-team-reveal>
            <div className="team-label"><span />04 / Join our team</div>
            <h2 id="team-title">The circle <em>is open.</em></h2>
          </div>
          <div className="team-intro" data-team-reveal>
            <span lang="hi">साथ आओ · साथ बनाएँ</span>
            <p>A living archive needs many kinds of care. Bring your curiosity, your craft and your perspective—there is more than one way to help a voice be heard.</p>
          </div>
        </header>

        <div className="team-stage" id="team-roles">
          <div className="team-orbit-column" data-team-reveal>
            <div className="team-orbit" aria-label="Choose a way to contribute">
              <span className="team-orbit-ring team-orbit-ring-outer" aria-hidden="true" />
              <span className="team-orbit-ring team-orbit-ring-inner" aria-hidden="true" />
              <span className="team-orbit-dash" aria-hidden="true" />
              <span className="team-orbit-axis team-orbit-axis-x" aria-hidden="true" />
              <span className="team-orbit-axis team-orbit-axis-y" aria-hidden="true" />

              {contributions.map((item, index) => (
                <button
                  key={item.id}
                  className={`team-orbit-role team-orbit-role-${index} ${active === index ? 'is-active' : ''}`}
                  onClick={() => setActive(index)}
                  aria-pressed={active === index}
                  aria-label={`Show ${item.title} contribution`}
                >
                  <span>0{index + 1}</span>
                  {item.short}
                </button>
              ))}

              <div className="team-orbit-centre" aria-hidden="true">
                <span>Many skills.</span>
                <strong>One purpose.</strong>
                <i lang="hi">साथ</i>
              </div>
            </div>
            <p className="team-orbit-caption"><span />Not a hierarchy. A shared practice.<span /></p>
          </div>

          <div className="team-detail" ref={detailRef} aria-live="polite" data-team-reveal>
            <div className="team-detail-top" data-team-detail>
              <span>Contribution 0{active + 1} / 04</span>
              <span>Ways to join</span>
            </div>
            <span className="team-detail-hindi" lang="hi" data-team-detail>{contribution.hindi}</span>
            <h3 data-team-detail>{contribution.title}</h3>
            <p className="team-detail-statement" data-team-detail>{contribution.statement}</p>
            <p className="team-detail-description" data-team-detail>{contribution.description}</p>
            <div className="team-skills" data-team-detail>
              {contribution.skills.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
            <div className="team-detail-footer" data-team-detail>
              <span>Choose the circle you belong in.</span>
              <button onClick={selectNext} aria-label={`Explore next contribution: ${contributions[(active + 1) % contributions.length].title}`}>
                Next contribution <ArrowRight size={16} strokeWidth={1.4} />
              </button>
            </div>
          </div>
        </div>

        <footer className="team-footer" data-team-reveal>
          <div>
            <span>Bring what you know.</span>
            <strong>Make room for what you don’t.</strong>
          </div>
          <p>Students, practitioners and professionals—if you believe culture should be documented with the people who carry it, there is a place for you here.</p>
          <a href="#team-roles" className="team-footer-link">Find your place <ArrowUpRight size={17} strokeWidth={1.35} /></a>
        </footer>
      </div>
    </section>
  )
}
