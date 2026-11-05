import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const children = [
  spawn(process.execPath, [path.join(root, 'server/index.mjs')], { cwd: root, stdio: 'inherit' }),
  spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), ...process.argv.slice(2)], { cwd: root, stdio: 'inherit' }),
]
let closing = false

function close(code = 0) {
  if (closing) return
  closing = true
  children.forEach((child) => { if (!child.killed) child.kill('SIGTERM') })
  setTimeout(() => process.exit(code), 150).unref()
}

children.forEach((child) => child.on('exit', (code) => { if (!closing) close(code || 0) }))
process.on('SIGINT', () => close(0))
process.on('SIGTERM', () => close(0))
