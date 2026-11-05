import { cloudConfigured, readLibrary } from '../_lib/library.mjs'

export default async function images(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' })
  if (!cloudConfigured()) return res.json({ images: {}, storage: 'unconfigured', configured: false })
  try {
    const library = await readLibrary()
    const overrides = Object.fromEntries(Object.entries(library).map(([key, record]) => [key, record.url]))
    res.json({ images: overrides, storage: 'cloud', configured: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'The shared image library could not be loaded.' })
  }
}
