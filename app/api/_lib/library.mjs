import { neon } from '@neondatabase/serverless'
import { cloudinaryConfigured, destroyCloudinaryImage } from './cloudinary.mjs'

const imageKeys = new Set([
  'heroDesktop', 'heroMobile', 'workDiscover', 'workDocument', 'workRecognise',
  'workPromote', 'workPromoteMobile', 'artistVocalist', 'artistInstrumentalist',
  'artistDancer', 'artistPercussionist', 'heritageMusic', 'heritageInstruments',
  'heritageDance', 'heritageOralTraditions',
])
let schemaPromise

function database() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.')
  return neon(process.env.DATABASE_URL)
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = database()`
      CREATE TABLE IF NOT EXISTS dvp_images (
        key TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        public_id TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.catch((error) => { schemaPromise = null; throw error })
  }
  await schemaPromise
}

export function cloudConfigured() {
  return Boolean(process.env.DATABASE_URL && cloudinaryConfigured())
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
  await ensureSchema()
  const rows = await database()`SELECT key, url, public_id FROM dvp_images`
  return Object.fromEntries(rows.map((row) => [row.key, { url: row.url, publicId: row.public_id }]))
}

export async function saveImageRecord(key, record) {
  await ensureSchema()
  const previousRows = await database()`SELECT url, public_id FROM dvp_images WHERE key = ${key} LIMIT 1`
  await database()`
    INSERT INTO dvp_images (key, url, public_id, updated_at)
    VALUES (${key}, ${record.url}, ${record.publicId}, NOW())
    ON CONFLICT (key) DO UPDATE SET
      url = EXCLUDED.url,
      public_id = EXCLUDED.public_id,
      updated_at = NOW()
  `
  const previous = previousRows[0]
  return previous ? { url: previous.url, publicId: previous.public_id } : null
}

export async function deleteImageRecord(key) {
  await ensureSchema()
  const rows = await database()`DELETE FROM dvp_images WHERE key = ${key} RETURNING url, public_id`
  return rows[0] ? { url: rows[0].url, publicId: rows[0].public_id } : null
}

export async function removeImage(record) {
  if (record?.publicId) await destroyCloudinaryImage(record.publicId)
}
