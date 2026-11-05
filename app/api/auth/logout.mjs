import { clearSessionCookie, requireSameOrigin } from '../_lib/auth.mjs'

export default function logout(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  if (!requireSameOrigin(req, res)) return
  clearSessionCookie(res)
  res.json({ authenticated: false })
}
