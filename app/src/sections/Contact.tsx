import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, ArrowUp, ArrowUpRight, Mail, Phone } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Contact.css'

gsap.registerPlugin(ScrollTrigger)

const contactEmail = 'support@rajasthanleaders.org'

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null)
  const [prepared, setPrepared] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const ctx = gsap.context(() => {
      const elements = gsap.utils.toArray<HTMLElement>('[data-contact-reveal]')
      gsap.set(elements, { opacity: 0, y: 36 })
      ScrollTrigger.create({
        trigger: section,
        start: 'top 80%',
        once: true,
        onEnter: () => gsap.to(elements, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1 }),
      })
    }, section)

    return () => ctx.revert()
  }, [])

  const prepareEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '')
    const email = String(data.get('email') ?? '')
    const interest = String(data.get('interest') ?? 'General enquiry')
    const message = String(data.get('message') ?? '')
    const subject = `[Desert Voice Project] ${interest} — ${name}`
    const body = `Namaste Desert Voice Project team,\n\n${message}\n\nName: ${name}\nReply email: ${email}\nArea of interest: ${interest}\n\nSent via the Desert Voice Project website.`

    setPrepared(true)
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <>
      <section className="contact-section" id="contact" ref={sectionRef} aria-labelledby="contact-title">
        <div className="contact-transition" aria-hidden="true" />
        <div className="contact-glow" aria-hidden="true" />
        <div className="contact-grain" aria-hidden="true" />
        <div className="contact-watermark" lang="hi" aria-hidden="true">संवाद</div>

        <div className="contact-inner">
          <header className="contact-heading" data-contact-reveal>
            <div className="contact-label"><span />05 / Contact</div>
            <h2 id="contact-title">Let’s carry <em>the voice forward.</em></h2>
          </header>

          <div className="contact-grid">
            <aside className="contact-aside" data-contact-reveal>
              <span className="contact-hindi" lang="hi">पधारो सा · आपणी बात कराँ</span>
              <p className="contact-lead">An artist with a story. An organiser with a stage. A collaborator with a craft. Every meaningful partnership can begin with a simple hello.</p>

              <div className="contact-direct">
                <span>Write to the project team</span>
                <a href={`mailto:${contactEmail}`}>{contactEmail}<ArrowUpRight size={19} strokeWidth={1.25} /></a>
              </div>

              <div className="contact-meta">
                <a href="tel:+919610282129"><Phone size={14} strokeWidth={1.35} />+91 96102 82129</a>
                <span>Rajasthan · India</span>
              </div>

              <div className="contact-note">
                <span className="contact-note-mark" aria-hidden="true">“</span>
                <p>For artist nominations, bookings, collaborations, press or a tradition you believe should be heard.</p>
              </div>
            </aside>

            <form className="contact-form" onSubmit={prepareEmail} data-contact-reveal>
              <div className="contact-form-heading">
                <div>
                  <span>Start a conversation</span>
                  <h3>Tell us what you have in mind.</h3>
                </div>
                <Mail size={24} strokeWidth={1.05} aria-hidden="true" />
              </div>

              <div className="contact-form-row">
                <label>
                  <span>Your name</span>
                  <input type="text" name="name" placeholder="How should we address you?" autoComplete="name" required onChange={() => setPrepared(false)} />
                </label>
                <label>
                  <span>Email address</span>
                  <input type="email" name="email" placeholder="you@example.com" autoComplete="email" required onChange={() => setPrepared(false)} />
                </label>
              </div>

              <label className="contact-select-label">
                <span>I’m writing about</span>
                <select name="interest" defaultValue="General enquiry" onChange={() => setPrepared(false)}>
                  <option>General enquiry</option>
                  <option>Artist nomination</option>
                  <option>Booking an artist</option>
                  <option>Joining the team</option>
                  <option>Cultural partnership</option>
                  <option>Press & media</option>
                </select>
              </label>

              <label className="contact-message-label">
                <span>Your message</span>
                <textarea name="message" rows={4} placeholder="Share a little about yourself, your event, or how you would like to contribute…" required onChange={() => setPrepared(false)} />
              </label>

              <div className="contact-form-footer">
                <button type="submit">Prepare email <ArrowRight size={17} strokeWidth={1.4} /></button>
                <p>Opens your email app. Nothing is sent without your review.</p>
              </div>
              <p className="contact-form-status" aria-live="polite">{prepared ? 'Your message is ready in your email app. Review it, then press send.' : ''}</p>
            </form>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-main">
            <a className="footer-brand" href="#top" aria-label="Desert Voice Project — back to top">
              <img src="/images/dvp-logo.svg" alt="" width="74" height="74" loading="lazy" />
              <div><strong>Desert Voice</strong><span>Project</span></div>
            </a>
            <p className="footer-tagline">Their Roots.<br />Their Music.<br /><em>Their Identity.</em></p>

            <nav className="footer-nav" aria-label="Footer navigation">
              <span>Explore</span>
              <a href="#artists">Artists</a>
              <a href="#heritage">Cultural heritage</a>
              <a href="#join">Join our team</a>
              <a href="#contact">Contact</a>
            </nav>

            <div className="footer-connect">
              <span>Connect</span>
              <a href={`mailto:${contactEmail}`}>Email the project <ArrowUpRight size={13} strokeWidth={1.3} /></a>
              <a href="https://rajasthanleaders.org/" target="_blank" rel="noreferrer">Rajasthan Leaders Association <ArrowUpRight size={13} strokeWidth={1.3} /></a>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Desert Voice Project. An initiative by Rajasthan Leaders Association.</p>
            <span>Artist first · Context always · Recognition that lasts</span>
            <a href="#top" aria-label="Back to top">Back to top <ArrowUp size={14} strokeWidth={1.4} /></a>
          </div>
        </div>
      </footer>
    </>
  )
}
