import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.dirname(fileURLToPath(import.meta.url))
const output = path.resolve(root, '../validation')
await mkdir(output, { recursive: true })

const server = spawn(process.execPath, [
  path.join(root, 'node_modules/vite/bin/vite.js'),
  '--host', '127.0.0.1',
  '--port', '7100',
  '--strictPort',
], { cwd: root, stdio: 'pipe' })

let browser
const errors = []

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch('http://127.0.0.1:7100/')
      if (response.ok) return
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('Preview server did not start')
}

try {
  await waitForServer()
  browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  })

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 })
  desktop.on('console', (message) => {
    if (message.type() === 'error') errors.push(`Desktop: ${message.text()}`)
  })
  await desktop.goto('http://127.0.0.1:7100/', { waitUntil: 'networkidle' })
  await desktop.evaluate(() => document.fonts.ready)
  await desktop.waitForTimeout(3200)
  await desktop.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' })
  const desktopOverflow = await desktop.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  await desktop.screenshot({ path: path.join(output, 'hero-desktop.png'), fullPage: true })
  await desktop.getByRole('button', { name: 'Explore the project' }).click()
  await desktop.getByRole('dialog').waitFor({ state: 'visible' })
  await desktop.keyboard.press('Escape')
  await desktop.getByRole('dialog').waitFor({ state: 'detached' })

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  mobile.on('console', (message) => {
    if (message.type() === 'error') errors.push(`Mobile: ${message.text()}`)
  })
  await mobile.goto('http://127.0.0.1:7100/', { waitUntil: 'networkidle' })
  await mobile.evaluate(() => document.fonts.ready)
  await mobile.waitForTimeout(3200)
  const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  await mobile.screenshot({ path: path.join(output, 'hero-mobile.png'), fullPage: true })
  await mobile.getByRole('button', { name: 'Open navigation' }).click()
  await mobile.getByRole('button', { name: /Explore artists/ }).click()
  await mobile.getByRole('dialog').waitFor({ state: 'visible' })
  const dialogTitle = await mobile.getByRole('dialog').getByRole('heading').textContent()

  console.log(JSON.stringify({
    desktopOverflow,
    mobileOverflow,
    dialogTitle,
    consoleErrors: errors,
    screenshots: [path.join(output, 'hero-desktop.png'), path.join(output, 'hero-mobile.png')],
  }, null, 2))

  if (desktopOverflow || mobileOverflow || errors.length) process.exitCode = 1
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
