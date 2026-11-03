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
  await page.waitForTimeout(2300)
  return page
}

async function showArtists(page) {
  await page.evaluate(() => document.querySelector('#artists')?.scrollIntoView({ behavior: 'instant' }))
  await page.waitForTimeout(1800)
}

try {
  await waitForServer()
  browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true })
  const desktop = await openPage({ width: 1440, height: 1000 }, 'Desktop')
  await desktop.screenshot({ path: path.join(output, 'theme-hero-desktop.png') })
  await desktop.getByRole('button', { name: 'Artists', exact: true }).click()
  await desktop.waitForTimeout(2200)
  await desktop.locator('.artists-section').screenshot({ path: path.join(output, 'artists-desktop-voice.png') })
  await desktop.getByRole('button', { name: 'Show Folk instrumentalists' }).click()
  await desktop.waitForTimeout(1000)
  const instrumentalistTitle = await desktop.locator('.artist-details h3').textContent()
  const instrumentalistImage = await desktop.locator('.artist-portrait-image').getAttribute('src')
  await desktop.locator('.artists-section').screenshot({ path: path.join(output, 'artists-desktop-instrumentalist.png') })

  const mobile = await openPage({ width: 390, height: 844 }, 'Mobile')
  await mobile.screenshot({ path: path.join(output, 'theme-hero-mobile.png') })
  await showArtists(mobile)
  await mobile.locator('.artists-section').screenshot({ path: path.join(output, 'artists-mobile-voice.png') })
  await mobile.getByRole('button', { name: 'Show Folk dancers' }).click()
  await mobile.waitForTimeout(1000)
  const dancerTitle = await mobile.locator('.artist-details h3').textContent()
  await mobile.getByRole('button', { name: 'Next artist tradition' }).click()
  await mobile.waitForTimeout(1000)
  const nextTitle = await mobile.locator('.artist-details h3').textContent()
  const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  await mobile.locator('.artists-section').screenshot({ path: path.join(output, 'artists-mobile-percussion.png') })

  const imageFormats = await mobile.evaluate(() => [...document.images].map((image) => image.getAttribute('src')).filter((src) => src && !src.endsWith('.avif') && !src.endsWith('.svg')))
  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  await reduced.goto('http://127.0.0.1:7100/', { waitUntil: 'networkidle' })
  await showArtists(reduced)
  const reducedOpacity = await reduced.locator('.artists-heading > div').first().evaluate((element) => getComputedStyle(element).opacity)

  console.log(JSON.stringify({ instrumentalistTitle, instrumentalistImage, dancerTitle, nextTitle, mobileOverflow, imageFormats, reducedOpacity, consoleErrors: errors }, null, 2))
  if (instrumentalistTitle !== 'Strings that remember.' || instrumentalistImage !== '/images/artist-instrumentalist.avif' || dancerTitle !== 'Movement becomes memory.' || nextTitle !== 'The pulse beneath every story.' || mobileOverflow || imageFormats.length || reducedOpacity !== '1' || errors.length) process.exitCode = 1
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
