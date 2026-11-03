import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.dirname(fileURLToPath(import.meta.url))
const output = path.resolve(root, '../validation')
await mkdir(output, { recursive: true })
const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '7100', '--strictPort'], { cwd: root, stdio: 'pipe' })
let browser
const errors = []

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch('http://127.0.0.1:7100/')).ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('Preview server did not start')
}

async function scrollToWork(page, progress = 0) {
  await page.evaluate((value) => {
    const section = document.querySelector('.work-scroll')
    if (!section) throw new Error('Work section missing')
    const top = section.getBoundingClientRect().top + window.scrollY
    const range = section.clientHeight - window.innerHeight
    window.scrollTo({ top: top + range * value, behavior: 'instant' })
  }, progress)
  await page.waitForTimeout(700)
}

try {
  await waitForServer()
  browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true })
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  desktop.on('console', (message) => { if (message.type() === 'error') errors.push(`Desktop: ${message.text()}`) })
  await desktop.goto('http://127.0.0.1:7100/', { waitUntil: 'networkidle' })
  await desktop.evaluate(() => document.fonts.ready)
  await scrollToWork(desktop)
  await desktop.screenshot({ path: path.join(output, 'work-discover-desktop.png') })
  await desktop.getByRole('button', { name: 'Go to Document chapter' }).click()
  await desktop.waitForTimeout(1400)
  const documentActive = await desktop.getByRole('button', { name: 'Go to Document chapter' }).getAttribute('aria-current')
  await desktop.screenshot({ path: path.join(output, 'work-document-desktop.png') })
  await desktop.getByRole('button', { name: 'Go to Recognise chapter' }).click()
  await desktop.waitForTimeout(1400)
  const desktopRecogniseActive = await desktop.getByRole('button', { name: 'Go to Recognise chapter' }).getAttribute('aria-current')
  await desktop.screenshot({ path: path.join(output, 'work-recognise-desktop.png') })
  await desktop.getByRole('button', { name: 'Go to Promote chapter' }).click()
  await desktop.waitForTimeout(1400)
  await desktop.screenshot({ path: path.join(output, 'work-promote-desktop.png') })

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  mobile.on('console', (message) => { if (message.type() === 'error') errors.push(`Mobile: ${message.text()}`) })
  await mobile.goto('http://127.0.0.1:7100/', { waitUntil: 'networkidle' })
  await mobile.evaluate(() => document.fonts.ready)
  await scrollToWork(mobile)
  await mobile.screenshot({ path: path.join(output, 'work-discover-mobile.png') })
  await mobile.getByRole('button', { name: 'Go to Recognise chapter' }).click()
  await mobile.waitForTimeout(1400)
  const recogniseActive = await mobile.getByRole('button', { name: 'Go to Recognise chapter' }).getAttribute('aria-current')
  await mobile.screenshot({ path: path.join(output, 'work-recognise-mobile.png') })
  await mobile.getByRole('button', { name: 'Go to Promote chapter' }).click()
  await mobile.waitForTimeout(1400)
  const mobilePromoteActive = await mobile.getByRole('button', { name: 'Go to Promote chapter' }).getAttribute('aria-current')
  await mobile.screenshot({ path: path.join(output, 'work-promote-mobile.png') })
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)

  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  await reduced.goto('http://127.0.0.1:7100/', { waitUntil: 'networkidle' })
  const reducedVisible = await reduced.locator('.work-reduced').isVisible()
  const animatedHidden = !(await reduced.locator('.work-scroll').isVisible())

  console.log(JSON.stringify({ documentActive, desktopRecogniseActive, recogniseActive, mobilePromoteActive, overflow, reducedVisible, animatedHidden, consoleErrors: errors }, null, 2))
  if (documentActive !== 'step' || desktopRecogniseActive !== 'step' || recogniseActive !== 'step' || mobilePromoteActive !== 'step' || overflow || !reducedVisible || !animatedHidden || errors.length) process.exitCode = 1
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
