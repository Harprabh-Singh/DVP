import bcrypt from 'bcryptjs'
import { adminEmail, requireSameOrigin, setSessionCookie } from '../_lib/auth.mjs'

const attempts = new Map()
const windowMs = 15 * 60 * 1000

export default async function login(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  if (!requireSameOrigin(req, res)) return

  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0]
  const now = Date.now()
  const recent = (attempts.get(ip) || []).filter((time) => now - time < windowMs)
  if (recent.length >= 6) return res.status(429).json({ error: 'Too many sign-in attempts. Please try again in 15 minutes.' })

  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const passwordHash = process.env.ADMIN_PASSWORD_HASH || ''
  const valid = Boolean(passwordHash) && email === adminEmail() && password.length <= 256 && await bcrypt.compare(password, passwordHash)
  if (!valid) {
    attempts.set(ip, [...recent, now])
    return res.status(401).json({ error: 'The email or password is incorrect.' })
  }

  attempts.delete(ip)
  setSessionCookie(res)
  res.json({ authenticated: true, email: adminEmail() })
}
