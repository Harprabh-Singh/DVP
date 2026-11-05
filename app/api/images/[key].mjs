import { cloudConfigured, deleteImageRecord, isAvif, removeImage, saveImageRecord, validImageKey } from '../_lib/library.mjs'
import { cloudinaryConfig } from '../_lib/cloudinary.mjs'
import { requireAuth, requireSameOrigin } from '../_lib/auth.mjs'

export default async function image(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!requireSameOrigin(req, res) || !requireAuth(req, res)) return
  if (!cloudConfigured()) return res.status(503).json({ error: 'Add DATABASE_URL and CLOUDINARY_URL before managing images.' })

  const key = req.query.key
  if (!validImageKey(key)) return res.status(400).json({ error: 'Unknown image placement.' })
  try {
    if (req.method === 'PUT') {
      const { url, publicId, format } = req.body || {}
      const parsed = new URL(url)
      const { cloudName } = cloudinaryConfig()
      if (format !== 'avif' || !String(publicId).startsWith(`dvp/${key}-`) || parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com' || !parsed.pathname.startsWith(`/${cloudName}/`)) {
        return res.status(400).json({ error: 'The Cloudinary upload details are invalid.' })
      }
      const uploaded = await fetch(url)
      const buffer = Buffer.from(await uploaded.arrayBuffer())
      if (!uploaded.ok || !isAvif(buffer)) return res.status(400).json({ error: 'The uploaded file is not a valid AVIF image.' })

      const previous = await saveImageRecord(key, { url, publicId })
      if (previous?.publicId && previous.publicId !== publicId) await removeImage(previous).catch((error) => console.error('Could not remove replaced image:', error.message))
      return res.json({ key, url, storage: 'cloud' })
    }

    if (req.method === 'DELETE') {
      const previous = await deleteImageRecord(key)
      if (previous) await removeImage(previous).catch((error) => console.error('Could not remove restored image:', error.message))
      return res.json({ key, restored: true })
    }

    return res.status(405).json({ error: 'Method not allowed.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'The image library could not be updated.' })
  }
}
