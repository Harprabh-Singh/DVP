import { cloudConfigured } from './_lib/library.mjs'

export default function health(_req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.json({ ok: true, storage: cloudConfigured() ? 'cloud' : 'unconfigured', configured: cloudConfigured() })
}
