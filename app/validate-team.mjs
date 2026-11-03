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

async function openPage(viewport, name, reducedMotion = 'no-preference') {
  const page = await browser.newPage({ viewport, reducedMotion })
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`${name}: ${message.text()}`) })
  await page.goto('http://127.0.0.1:7100/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.locator('#join').scrollIntoViewIfNeeded()
  await page.evaluate(() => document.querySelector('#join')?.scrollIntoView({ behavior: 'instant' }))
  await page.waitForTimeout(1800)
  return page
}

try {
  await waitForServer()
  browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true })

  const desktop = await openPage({ width: 1440, height: 1000 }, 'Desktop')
  await desktop.getByRole('button', { name: 'Show Image & film contribution' }).click()
  await desktop.waitForTimeout(750)
  const desktopTitle = await desktop.locator('.team-detail h3').textContent()
  const desktopPressed = await desktop.getByRole('button', { name: 'Show Image & film contribution' }).getAttribute('aria-pressed')
  await desktop.locator('.team-section').screenshot({ path: path.join(output, 'team-desktop-visual.png') })

  const mobile = await openPage({ width: 390, height: 844 }, 'Mobile')
  await mobile.getByRole('button', { name: 'Show Community & outreach contribution' }).click()
  await mobile.waitForTimeout(750)
  const mobileTitle = await mobile.locator('.team-detail h3').textContent()
  const mobilePressed = await mobile.getByRole('button', { name: 'Show Community & outreach contribution' }).getAttribute('aria-pressed')
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  await mobile.locator('.team-section').screenshot({ path: path.join(output, 'team-mobile-outreach.png') })
  await mobile.getByRole('button', { name: 'Explore next contribution: Field & research' }).click()
  await mobile.waitForTimeout(650)
  const nextTitle = await mobile.locator('.team-detail h3').textContent()

  const reduced = await openPage({ width: 390, height: 844 }, 'Reduced', 'reduce')
  const reducedOpacity = await reduced.locator('.team-heading > div').first().evaluate((element) => getComputedStyle(element).opacity)

  const result = { desktopTitle, desktopPressed, mobileTitle, mobilePressed, nextTitle, overflow, reducedOpacity, consoleErrors: errors }
  console.log(JSON.stringify(result, null, 2))
  if (desktopTitle !== 'Image & film' || desktopPressed !== 'true' || mobileTitle !== 'Community & outreach' || mobilePressed !== 'true' || nextTitle !== 'Field & research' || overflow || reducedOpacity !== '1' || errors.length) process.exitCode = 1
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
