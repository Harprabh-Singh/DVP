import { cloudConfigured, validImageKey } from '../_lib/library.mjs'
import { createUploadSignature } from '../_lib/cloudinary.mjs'
import { requireAuth, requireSameOrigin } from '../_lib/auth.mjs'

export default function signature(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  if (!requireSameOrigin(req, res) || !requireAuth(req, res)) return
  if (!cloudConfigured()) return res.status(503).json({ error: 'Add DATABASE_URL and CLOUDINARY_URL before uploading images.' })
  const key = req.body?.key
  if (!validImageKey(key)) return res.status(400).json({ error: 'Unknown image placement.' })
  res.json(createUploadSignature(key))
}
