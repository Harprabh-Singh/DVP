import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { Link } from 'react-router'

type AdminLoginProps = {
  onSuccess: () => void
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('harprabhnanda@gmail.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Sign in could not be completed.')
      onSuccess()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sign in could not be completed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-login">
      <section className="admin-login-story" aria-label="Desert Voice Project Image Studio">
        <Link to="/" className="admin-login-brand"><img src="/images/dvp-logo.svg" alt="Desert Voice Project" width="72" height="72" /></Link>
        <div className="admin-login-story-copy">
          <span>Desert Voice Project / Image Studio</span>
          <h1>Their stories.<br /><em>Carefully carried.</em></h1>
          <p>A protected space for curating the photography that represents Rajasthan’s living traditions.</p>
        </div>
        <div className="admin-login-story-foot"><span>Secure access</span><span>Shared visual archive</span></div>
      </section>

      <section className="admin-login-form-wrap">
        <Link to="/" className="admin-login-mobile-logo"><img src="/images/dvp-logo.svg" alt="Desert Voice Project" width="54" height="54" /></Link>
        <form className="admin-login-form" onSubmit={signIn}>
          <div className="admin-login-icon"><LockKeyhole size={21} strokeWidth={1.25} /></div>
          <span className="admin-eyebrow">Administrator access</span>
          <h2>Welcome back.</h2>
          <p>Sign in to manage and publish website imagery.</p>

          <label>
            <span>Email address</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required />
          </label>
          <label>
            <span>Password</span>
            <div className="admin-password-field">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required autoFocus />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} strokeWidth={1.3} /> : <Eye size={17} strokeWidth={1.3} />}</button>
            </div>
          </label>
          {error && <div className="admin-login-error" role="alert">{error}</div>}
          <button className="admin-login-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : <>Sign in to Image Studio <ArrowRight size={16} strokeWidth={1.4} /></>}</button>
          <div className="admin-login-privacy"><LockKeyhole size={12} strokeWidth={1.4} />Protected by an encrypted, expiring admin session.</div>
        </form>
      </section>
    </main>
  )
}
