import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const authFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'data/auth.json')
try {
  const auth = JSON.parse(await readFile(authFile, 'utf8'))
  console.log('Add these values in Vercel → Project → Settings → Environment Variables:\n')
  console.log(`ADMIN_EMAIL=${auth.email}`)
  console.log(`ADMIN_PASSWORD_HASH=${auth.passwordHash}`)
  console.log(`SESSION_SECRET=${auth.sessionSecret}`)
  console.log('PUBLIC_ORIGIN=https://dvp-amber.vercel.app')
  console.log('\nBLOB_READ_WRITE_TOKEN is added automatically when you connect a Vercel Blob store.')
} catch {
  console.error('Run npm run setup-admin -- <email> <password> first.')
  process.exit(1)
}
