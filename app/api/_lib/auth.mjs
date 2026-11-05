import { createHmac, timingSafeEqual } from 'node:crypto'

const cookieName = 'dvp_admin'

function secret() {
  return process.env.SESSION_SECRET || ''
}

function sign(value) {
  return createHmac('sha256', secret()).update(value).digest('base64url')
}

export function adminEmail() {
  return (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
}

export function createSession() {
  const payload = Buffer.from(JSON.stringify({ sub: adminEmail(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function verifySession(token) {
  if (!token || !secret() || !adminEmail()) return false
  const [payload, signature] = String(token).split('.')
  if (!payload || !signature) return false
  const expected = sign(payload)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return false
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return session.sub === adminEmail() && Number(session.exp) > Date.now()
  } catch {
    return false
  }
}

export function requestIsAuthenticated(req) {
  const cookies = Object.fromEntries(String(req.headers.cookie || '').split(';').map((part) => {
    const index = part.indexOf('=')
    return index < 0 ? [part.trim(), ''] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())]
  }))
  return verifySession(cookies[cookieName])
}

export function requireAuth(req, res) {
  if (requestIsAuthenticated(req)) return true
  res.status(401).json({ error: 'Your admin session has expired. Please sign in again.' })
  return false
}

export function requireSameOrigin(req, res) {
  const origin = req.headers.origin
  if (!origin) return true
  const allowedHosts = [req.headers.host, req.headers['x-forwarded-host']].filter(Boolean)
  try {
    if (allowedHosts.includes(new URL(origin).host) || origin === process.env.PUBLIC_ORIGIN) return true
  } catch {}
  res.status(403).json({ error: 'Request origin is not allowed.' })
  return false
}

export function setSessionCookie(res) {
  res.setHeader('Set-Cookie', `${cookieName}=${createSession()}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`)
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`)
}
