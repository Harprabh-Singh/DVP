import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
delete process.env.ADMIN_EMAIL
delete process.env.ADMIN_PASSWORD_HASH
delete process.env.SESSION_SECRET
delete process.env.DATABASE_URL
process.env.CLOUDINARY_URL = 'cloudinary://test_key:test_secret@test_cloud'

const { default: login } = await import('./api/auth/login.mjs')
const { default: status } = await import('./api/auth/status.mjs')
const { default: logout } = await import('./api/auth/logout.mjs')
const { default: images } = await import('./api/images/index.mjs')
const { default: image } = await import('./api/images/[key].mjs')
const { default: signature } = await import('./api/cloudinary/signature.mjs')
const { createUploadSignature } = await import('./api/_lib/cloudinary.mjs')
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
await login({ method: 'POST', headers: baseHeaders, body: { email: 'harprabhnanda@gmail.com', password: 'wrong-password' } }, wrongLogin)

const validLogin = response()
await login({ method: 'POST', headers: baseHeaders, body: { email: 'harprabhnanda@gmail.com', password: 'abc123456' } }, validLogin)
const cookie = validLogin.headers['Set-Cookie']?.split(';')[0]
const authenticatedStatus = response()
status({ headers: { cookie } }, authenticatedStatus)

const unconfiguredImages = response()
await images({ method: 'GET', headers: baseHeaders }, unconfiguredImages)

process.env.DATABASE_URL = 'postgresql://test-only.invalid/neondb'
const unauthorisedSignature = response()
await signature({ method: 'POST', headers: baseHeaders, body: { key: 'artistVocalist' } }, unauthorisedSignature)
const unauthorisedRestore = response()
await image({ method: 'DELETE', headers: baseHeaders, query: { key: 'artistVocalist' } }, unauthorisedRestore)
const authorisedSignature = response()
await signature({ method: 'POST', headers: { ...baseHeaders, cookie }, body: { key: 'artistVocalist' } }, authorisedSignature)
delete process.env.DATABASE_URL

const uploadSignature = createUploadSignature('artistVocalist')
const loggedOut = response()
logout({ method: 'POST', headers: { ...baseHeaders, cookie } }, loggedOut)
const avif = await readFile(path.join(root, 'public/images/artist-vocalist.avif'))
const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'))
const envExample = await readFile(path.join(root, '.env.example'), 'utf8')

const result = {
  wrongLoginStatus: wrongLogin.statusCode,
  validLoginStatus: validLogin.statusCode,
  secureCookie: validLogin.headers['Set-Cookie']?.includes('Secure') && validLogin.headers['Set-Cookie']?.includes('HttpOnly'),
  authenticated: authenticatedStatus.body?.authenticated,
  unconfiguredStorage: unconfiguredImages.body?.storage,
  unauthorisedSignatureStatus: unauthorisedSignature.statusCode,
  unauthorisedRestoreStatus: unauthorisedRestore.statusCode,
  authorisedSignatureStatus: authorisedSignature.statusCode,
  signatureHasExpectedValues: uploadSignature.apiKey === 'test_key' && uploadSignature.cloudName === 'test_cloud' && uploadSignature.publicId.startsWith('dvp/artistVocalist-') && Boolean(uploadSignature.signature),
  signatureDoesNotExposeSecret: !JSON.stringify(authorisedSignature.body).includes('test_secret'),
  loggedOut: loggedOut.body?.authenticated === false,
  avifValidation: isAvif(avif) && !isAvif(Buffer.from('not avif')),
  adminRewrite: config.rewrites?.some((rewrite) => rewrite.source === '/admin' && rewrite.destination === '/index.html'),
  twoRequiredKeys: envExample.includes('DATABASE_URL=') && envExample.includes('CLOUDINARY_URL='),
}
console.log(JSON.stringify(result, null, 2))
const valid = result.wrongLoginStatus === 401
  && result.validLoginStatus === 200
  && result.secureCookie
  && result.authenticated
  && result.unconfiguredStorage === 'unconfigured'
  && result.unauthorisedSignatureStatus === 401
  && result.unauthorisedRestoreStatus === 401
  && result.authorisedSignatureStatus === 200
  && result.signatureHasExpectedValues
  && result.signatureDoesNotExposeSecret
  && result.loggedOut
  && result.avifValidation
  && result.adminRewrite
  && result.twoRequiredKeys
if (!valid) process.exitCode = 1
