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

async function openPage(viewport, name) {
  const page = await browser.newPage({ viewport })
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`${name}: ${message.text()}`) })
  await page.goto('http://127.0.0.1:7100/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1800)
  return page
}

async function showHeritage(page) {
  await page.evaluate(() => document.querySelector('#heritage')?.scrollIntoView({ behavior: 'instant' }))
  await page.waitForTimeout(1700)
}

try {
  await waitForServer()
  browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true })
  const desktop = await openPage({ width: 1440, height: 1000 }, 'Desktop')
  await desktop.getByRole('button', { name: 'Heritage', exact: true }).click()
  await desktop.waitForTimeout(2100)
  await desktop.locator('.heritage-section').screenshot({ path: path.join(output, 'heritage-desktop-music.png') })
  await desktop.getByRole('button', { name: 'Explore Instruments & craft' }).click()
  await desktop.waitForTimeout(900)
  const desktopImage = await desktop.locator('.heritage-image-motion img').getAttribute('src')
  const desktopExpanded = await desktop.getByRole('button', { name: 'Explore Instruments & craft' }).getAttribute('aria-expanded')
  const desktopPanels = await desktop.locator('.heritage-detail').count()
  await desktop.locator('.heritage-section').screenshot({ path: path.join(output, 'heritage-desktop-instruments.png') })

  const mobile = await openPage({ width: 390, height: 844 }, 'Mobile')
  await showHeritage(mobile)
  await mobile.locator('.heritage-section').screenshot({ path: path.join(output, 'heritage-mobile-music.png') })
  await mobile.getByRole('button', { name: 'Explore Dance & movement' }).click()
  await mobile.waitForTimeout(900)
  const mobileImage = await mobile.locator('.heritage-image-motion img').getAttribute('src')
  const mobileExpanded = await mobile.getByRole('button', { name: 'Explore Dance & movement' }).getAttribute('aria-expanded')
  const mobilePanels = await mobile.locator('.heritage-detail').count()
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  const imageFormats = await mobile.evaluate(() => [...document.images].map((image) => image.getAttribute('src')).filter((src) => src && !src.endsWith('.avif') && !src.endsWith('.svg')))
  await mobile.locator('.heritage-section').screenshot({ path: path.join(output, 'heritage-mobile-dance.png') })

  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  await reduced.goto('http://127.0.0.1:7100/', { waitUntil: 'networkidle' })
  await showHeritage(reduced)
  const reducedOpacity = await reduced.locator('.heritage-heading > div').first().evaluate((element) => getComputedStyle(element).opacity)

  console.log(JSON.stringify({ desktopImage, desktopExpanded, desktopPanels, mobileImage, mobileExpanded, mobilePanels, overflow, imageFormats, reducedOpacity, consoleErrors: errors }, null, 2))
  if (desktopImage !== '/images/heritage-instruments.avif' || desktopExpanded !== 'true' || desktopPanels !== 1 || mobileImage !== '/images/heritage-dance.avif' || mobileExpanded !== 'true' || mobilePanels !== 1 || overflow || imageFormats.length || reducedOpacity !== '1' || errors.length) process.exitCode = 1
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
