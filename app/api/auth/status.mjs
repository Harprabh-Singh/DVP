import { adminEmail, requestIsAuthenticated } from '../_lib/auth.mjs'

export default function status(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const authenticated = requestIsAuthenticated(req)
  res.json({ authenticated, email: authenticated ? adminEmail() : null })
}
