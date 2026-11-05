import { blobConfigured } from './_lib/library.mjs'

export default function health(_req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.json({ ok: true, storage: blobConfigured() ? 'cloud' : 'unconfigured', configured: blobConfigured() })
}
