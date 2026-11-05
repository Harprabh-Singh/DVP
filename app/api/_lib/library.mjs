import { del, list, put } from '@vercel/blob'

const libraryPath = 'dvp/library.json'
const imageKeys = new Set([
  'heroDesktop', 'heroMobile', 'workDiscover', 'workDocument', 'workRecognise',
  'workPromote', 'workPromoteMobile', 'artistVocalist', 'artistInstrumentalist',
  'artistDancer', 'artistPercussionist', 'heritageMusic', 'heritageInstruments',
  'heritageDance', 'heritageOralTraditions',
])

export function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export function validImageKey(key) {
  return imageKeys.has(key)
}

export function isAvif(buffer) {
  return buffer.length >= 16
    && buffer.toString('ascii', 4, 8) === 'ftyp'
    && /avif|avis/.test(buffer.toString('ascii', 8, 32))
}

export async function readLibrary() {
  const { blobs } = await list({ prefix: libraryPath, limit: 20 })
  const manifest = blobs.find((blob) => blob.pathname === libraryPath)
  if (!manifest) return {}
  const response = await fetch(`${manifest.url}?v=${Date.now()}`, { cache: 'no-store' })
  if (!response.ok) throw new Error('The shared image library could not be read.')
  const library = await response.json()
  return library && typeof library === 'object' ? library : {}
}

export async function writeLibrary(library) {
  await put(libraryPath, JSON.stringify(library), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  })
}

export async function removeImage(record) {
  if (record?.url) await del(record.url)
}
