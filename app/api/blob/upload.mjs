import { handleUpload } from '@vercel/blob/client'
import { requireAuth, requireSameOrigin } from '../_lib/auth.mjs'
import { blobConfigured, isAvif, readLibrary, removeImage, validImageKey, writeLibrary } from '../_lib/library.mjs'

export default async function blobUpload(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  if (!requireSameOrigin(req, res)) return
  if (!blobConfigured()) return res.status(503).json({ error: 'Connect a Vercel Blob store before uploading images.' })
  if (req.body?.type === 'blob.generate-client-token' && !requireAuth(req, res)) return

  try {
    const jsonResponse = await handleUpload({
      request: req,
      body: req.body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const key = clientPayload || ''
        if (!validImageKey(key) || !pathname.startsWith(`dvp/${key}-`)) throw new Error('Invalid image placement.')
        return {
          allowedContentTypes: ['image/avif'],
          maximumSizeInBytes: 15 * 1024 * 1024,
          addRandomSuffix: true,
          cacheControlMaxAge: 31536000,
          tokenPayload: JSON.stringify({ key }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { key } = JSON.parse(tokenPayload || '{}')
        if (!validImageKey(key)) throw new Error('Invalid image placement.')
        const response = await fetch(blob.url)
        const buffer = Buffer.from(await response.arrayBuffer())
        if (!response.ok || !isAvif(buffer)) {
          await removeImage({ url: blob.url })
          throw new Error('The uploaded file is not a valid AVIF image.')
        }
        const library = await readLibrary()
        const previous = library[key]
        library[key] = { url: blob.url, pathname: blob.pathname }
        await writeLibrary(library)
        removeImage(previous).catch((error) => console.error('Could not remove replaced image:', error.message))
      },
    })
    res.json(jsonResponse)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error: error.message || 'The image could not be published.' })
  }
}
