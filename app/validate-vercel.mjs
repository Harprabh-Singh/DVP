import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const auth = JSON.parse(await readFile(path.join(root, 'server/data/auth.json'), 'utf8'))
process.env.ADMIN_EMAIL = auth.email
process.env.ADMIN_PASSWORD_HASH = auth.passwordHash
process.env.SESSION_SECRET = auth.sessionSecret
process.env.PUBLIC_ORIGIN = 'https://dvp-amber.vercel.app'
delete process.env.BLOB_READ_WRITE_TOKEN

const { default: login } = await import('./api/auth/login.mjs')
const { default: status } = await import('./api/auth/status.mjs')
const { default: logout } = await import('./api/auth/logout.mjs')
const { default: images } = await import('./api/images/index.mjs')
const { default: image } = await import('./api/images/[key].mjs')
const { default: blobUpload } = await import('./api/blob/upload.mjs')
const { isAvif } = await import('./api/_lib/library.mjs')

function response() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value },
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
}

const baseHeaders = { host: 'dvp-amber.vercel.app', origin: 'https://dvp-amber.vercel.app' }
const wrongLogin = response()
await login({ method: 'POST', headers: baseHeaders, body: { email: auth.email, password: 'wrong-password' } }, wrongLogin)

const validLogin = response()
await login({ method: 'POST', headers: baseHeaders, body: { email: auth.email, password: 'abc123456' } }, validLogin)
const cookie = validLogin.headers['Set-Cookie']?.split(';')[0]

const authenticatedStatus = response()
status({ headers: { cookie } }, authenticatedStatus)

const unconfiguredImages = response()
await images({ method: 'GET', headers: baseHeaders }, unconfiguredImages)

process.env.BLOB_READ_WRITE_TOKEN = 'test-token-for-auth-check-only'
const unauthorisedUpload = response()
await blobUpload({ method: 'POST', headers: baseHeaders, body: { type: 'blob.generate-client-token' } }, unauthorisedUpload)
const unauthorisedRestore = response()
await image({ method: 'DELETE', headers: baseHeaders, query: { key: 'artistVocalist' } }, unauthorisedRestore)
delete process.env.BLOB_READ_WRITE_TOKEN

const loggedOut = response()
logout({ method: 'POST', headers: { ...baseHeaders, cookie } }, loggedOut)
const avif = await readFile(path.join(root, 'public/images/artist-vocalist.avif'))
const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'))

const result = {
  wrongLoginStatus: wrongLogin.statusCode,
  validLoginStatus: validLogin.statusCode,
  secureCookie: validLogin.headers['Set-Cookie']?.includes('Secure') && validLogin.headers['Set-Cookie']?.includes('HttpOnly'),
  authenticated: authenticatedStatus.body?.authenticated,
  unconfiguredStorage: unconfiguredImages.body?.storage,
  unauthorisedUploadStatus: unauthorisedUpload.statusCode,
  unauthorisedRestoreStatus: unauthorisedRestore.statusCode,
  loggedOut: loggedOut.body?.authenticated === false,
  avifValidation: isAvif(avif) && !isAvif(Buffer.from('not avif')),
  adminRewrite: config.rewrites?.some((rewrite) => rewrite.source === '/admin' && rewrite.destination === '/index.html'),
}
console.log(JSON.stringify(result, null, 2))
const valid = result.wrongLoginStatus === 401
  && result.validLoginStatus === 200
  && result.secureCookie
  && result.authenticated
  && result.unconfiguredStorage === 'unconfigured'
  && result.unauthorisedUploadStatus === 401
  && result.unauthorisedRestoreStatus === 401
  && result.loggedOut
  && result.avifValidation
  && result.adminRewrite
if (!valid) process.exitCode = 1
