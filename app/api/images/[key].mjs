import { blobConfigured, readLibrary, removeImage, validImageKey, writeLibrary } from '../_lib/library.mjs'
import { requireAuth, requireSameOrigin } from '../_lib/auth.mjs'

export default async function image(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Use the secure Blob upload flow to publish images.' })
  if (!requireSameOrigin(req, res) || !requireAuth(req, res)) return
  if (!blobConfigured()) return res.status(503).json({ error: 'Connect a Vercel Blob store before managing images.' })

  const key = req.query.key
  if (!validImageKey(key)) return res.status(400).json({ error: 'Unknown image placement.' })
  try {
    const library = await readLibrary()
    const previous = library[key]
    delete library[key]
    await writeLibrary(library)
    removeImage(previous).catch((error) => console.error('Could not remove restored image:', error.message))
    res.json({ key, restored: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'The original image could not be restored.' })
  }
}
