import express from 'express'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(root, 'server', 'data')
const uploadDir = path.join(dataDir, 'uploads')
const authFile = path.join(dataDir, 'auth.json')
const libraryFile = path.join(dataDir, 'images.json')
await mkdir(uploadDir, { recursive: true })

if (existsSync(path.join(root, '.env')) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(path.join(root, '.env'))
}

const imageKeys = new Set([
  'heroDesktop', 'heroMobile', 'workDiscover', 'workDocument', 'workRecognise',
  'workPromote', 'workPromoteMobile', 'artistVocalist', 'artistInstrumentalist',
  'artistDancer', 'artistPercussionist', 'heritageMusic', 'heritageInstruments',
  'heritageDance', 'heritageOralTraditions',
])

let storedAuth = {}
try { storedAuth = JSON.parse(await readFile(authFile, 'utf8')) } catch {}
const adminEmail = (process.env.ADMIN_EMAIL || storedAuth.email || '').trim().toLowerCase()
const passwordHash = process.env.ADMIN_PASSWORD_HASH || storedAuth.passwordHash || ''
const sessionSecret = process.env.SESSION_SECRET || storedAuth.sessionSecret || ''
if (!adminEmail || !passwordHash || !sessionSecret) {
  console.error('Admin is not configured. Run: node server/setup-admin.mjs <email> <password>')
  process.exit(1)
}

const cloudEnabled = Boolean(
  process.env.S3_BUCKET && process.env.S3_REGION && process.env.S3_ACCESS_KEY_ID
  && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_PUBLIC_BASE_URL,
)
const s3 = cloudEnabled ? new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: Boolean(process.env.S3_ENDPOINT),
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
}) : null

async function readLibrary() {
  try {
    const parsed = JSON.parse(await readFile(libraryFile, 'utf8'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeLibrary(library) {
  const temporary = `${libraryFile}.tmp`
  await writeFile(temporary, JSON.stringify(library, null, 2), { mode: 0o600 })
  await rename(temporary, libraryFile)
}

function sign(value) {
  return createHmac('sha256', sessionSecret).update(value).digest('base64url')
}

function createSession() {
  const payload = Buffer.from(JSON.stringify({ sub: adminEmail, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function verifySession(token) {
  if (!token || typeof token !== 'string') return false
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false
  const expected = sign(payload)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return false
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return session.sub === adminEmail && Number(session.exp) > Date.now()
  } catch {
    return false
  }
}

function requireAuth(req, res, next) {
  if (!verifySession(req.cookies.dvp_admin)) return res.status(401).json({ error: 'Your admin session has expired. Please sign in again.' })
  next()
}

function requireSameOrigin(req, res, next) {
  const origin = req.get('origin')
  if (!origin) return next()
  const allowedHosts = [req.get('host'), req.get('x-forwarded-host')].filter(Boolean)
  try {
    const originHost = new URL(origin).host
    if (allowedHosts.includes(originHost) || origin === process.env.PUBLIC_ORIGIN) return next()
  } catch {}
  return res.status(403).json({ error: 'Request origin is not allowed.' })
}

function isAvif(buffer) {
  return buffer.length >= 16
    && buffer.toString('ascii', 4, 8) === 'ftyp'
    && /avif|avis/.test(buffer.toString('ascii', 8, 32))
}

async function deleteStoredImage(record) {
  if (!record?.storageKey) return
  if (cloudEnabled) {
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: record.storageKey }))
  } else {
    const filename = path.basename(record.storageKey)
    await unlink(path.join(uploadDir, filename)).catch(() => {})
  }
}

const app = express()
app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(express.json({ limit: '20kb' }))
app.use(cookieParser())

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 6,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please try again in 15 minutes.' },
})

app.get('/api/health', (_req, res) => res.json({ ok: true, storage: cloudEnabled ? 'cloud' : 'local' }))
app.get('/api/auth/status', (req, res) => {
  const authenticated = verifySession(req.cookies.dvp_admin)
  res.json({ authenticated, email: authenticated ? adminEmail : null })
})
app.post('/api/auth/login', loginLimiter, requireSameOrigin, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const emailMatches = email === adminEmail
  const passwordMatches = password.length <= 256 && await bcrypt.compare(password, passwordHash)
  if (!emailMatches || !passwordMatches) return res.status(401).json({ error: 'The email or password is incorrect.' })
  res.cookie('dvp_admin', createSession(), {
    httpOnly: true,
    sameSite: 'strict',
    secure: req.secure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
  res.json({ authenticated: true, email: adminEmail })
})
app.post('/api/auth/logout', requireSameOrigin, (_req, res) => {
  res.clearCookie('dvp_admin', { httpOnly: true, sameSite: 'strict', path: '/' })
  res.json({ authenticated: false })
})

app.get('/api/images', async (_req, res) => {
  const library = await readLibrary()
  const images = Object.fromEntries(Object.entries(library).map(([key, record]) => [key, record.url]))
  res.json({ images, storage: cloudEnabled ? 'cloud' : 'local' })
})

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 1 } })
app.put('/api/images/:key', requireAuth, requireSameOrigin, upload.single('image'), async (req, res, next) => {
  try {
    const key = req.params.key
    if (!imageKeys.has(key)) return res.status(400).json({ error: 'Unknown image placement.' })
    if (!req.file || !isAvif(req.file.buffer)) return res.status(400).json({ error: 'Please choose a valid AVIF image.' })

    const storageKey = cloudEnabled ? `dvp/${key}-${Date.now()}.avif` : `${key}-${Date.now()}.avif`
    let url
    if (cloudEnabled) {
      await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: storageKey,
        Body: req.file.buffer,
        ContentType: 'image/avif',
        CacheControl: 'public, max-age=31536000, immutable',
      }))
      url = `${process.env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${storageKey}`
    } else {
      await writeFile(path.join(uploadDir, storageKey), req.file.buffer, { mode: 0o600 })
      url = `/uploads/${storageKey}`
    }

    const library = await readLibrary()
    const previous = library[key]
    library[key] = { url, storageKey }
    await writeLibrary(library)
    deleteStoredImage(previous).catch((error) => console.error('Could not remove replaced image:', error.message))
    res.json({ key, url, storage: cloudEnabled ? 'cloud' : 'local' })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/images/:key', requireAuth, requireSameOrigin, async (req, res, next) => {
  try {
    const key = req.params.key
    if (!imageKeys.has(key)) return res.status(400).json({ error: 'Unknown image placement.' })
    const library = await readLibrary()
    const previous = library[key]
    delete library[key]
    await writeLibrary(library)
    deleteStoredImage(previous).catch((error) => console.error('Could not remove restored image:', error.message))
    res.json({ key, restored: true })
  } catch (error) {
    next(error)
  }
})

app.use('/uploads', express.static(uploadDir, { maxAge: '1y', immutable: true, fallthrough: false }))
app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }))

if (process.argv.includes('--serve')) {
  const dist = path.join(root, 'dist')
  app.use(express.static(dist, { maxAge: '1h' }))
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.use((error, _req, res, _next) => {
  console.error(error)
  if (error instanceof multer.MulterError) return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'The image must be smaller than 15 MB.' : 'The upload could not be processed.' })
  res.status(500).json({ error: 'The server could not complete this request.' })
})

const port = Number(process.env.API_PORT || 8787)
app.listen(port, '0.0.0.0', () => {
  console.log(`DVP server listening on http://127.0.0.1:${port} (${cloudEnabled ? 'shared cloud storage' : 'local server storage'})`)
})
