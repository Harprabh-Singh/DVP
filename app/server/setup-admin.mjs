import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const [emailInput, password] = process.argv.slice(2)
const email = String(emailInput || '').trim().toLowerCase()
if (!/^\S+@\S+\.\S+$/.test(email) || !password || password.length < 9) {
  console.error('Usage: node server/setup-admin.mjs <email> <password of at least 9 characters>')
  process.exit(1)
}

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'data')
await mkdir(dataDir, { recursive: true })
const authFile = path.join(dataDir, 'auth.json')
let existing = {}
try { existing = JSON.parse(await readFile(authFile, 'utf8')) } catch {}
const record = {
  email,
  passwordHash: await bcrypt.hash(password, 12),
  sessionSecret: existing.sessionSecret || randomBytes(48).toString('base64url'),
}
await writeFile(authFile, JSON.stringify(record, null, 2), { mode: 0o600 })
console.log(`Admin access configured for ${email}. The password is stored only as a bcrypt hash.`)
