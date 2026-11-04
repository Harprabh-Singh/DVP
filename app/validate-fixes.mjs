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
  await page.waitForTimeout(1900)
  return page
}

try {
  await waitForServer()
  browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true })

  const desktop = await openPage({ width: 1440, height: 1000 }, 'Desktop')
  const before = await desktop.evaluate(() => ({ scrollY: window.scrollY, heroTop: document.querySelector('.hero')?.getBoundingClientRect().top }))
  await desktop.getByRole('button', { name: 'Our purpose', exact: true }).first().click()
  await desktop.waitForTimeout(900)
  const modalState = await desktop.evaluate(() => ({
    fixed: getComputedStyle(document.querySelector('.story-dialog')).position,
    portal: document.querySelector('.story-dialog')?.parentElement === document.body,
    bodyLocked: document.body.style.overflow === 'hidden',
    htmlLocked: document.documentElement.style.overflow === 'hidden',
  }))
  await desktop.screenshot({ path: path.join(output, 'purpose-modal-desktop.png') })
  await desktop.keyboard.press('Escape')
  const closingClass = await desktop.locator('.story-dialog').getAttribute('class')
  await desktop.waitForTimeout(520)
  const closed = await desktop.locator('.story-dialog').count() === 0
  const after = await desktop.evaluate(() => ({
    scrollY: window.scrollY,
    heroTop: document.querySelector('.hero')?.getBoundingClientRect().top,
    bodyOverflow: document.body.style.overflow,
    htmlOverflow: document.documentElement.style.overflow,
  }))

  await desktop.getByRole('button', { name: 'Artists', exact: true }).first().click()
  await desktop.waitForTimeout(1900)
  await desktop.getByRole('button', { name: 'Show Folk instrumentalists' }).click()
  await desktop.waitForTimeout(650)
  const curtainMid = await desktop.locator('.artist-curtain-left').evaluate((element) => getComputedStyle(element).transform)
  await desktop.locator('.artist-portrait-frame').screenshot({ path: path.join(output, 'artist-curtains-mid.png') })
  await desktop.waitForTimeout(1150)
  const artistImage = await desktop.locator('.artist-portrait-image').getAttribute('src')
  const curtainEnd = await desktop.locator('.artist-curtain-left').evaluate((element) => getComputedStyle(element).transform)

  const mobile = await openPage({ width: 390, height: 844 }, 'Mobile')
  await mobile.getByRole('button', { name: 'Open navigation' }).click()
  await mobile.locator('.mobile-menu-inner').getByRole('button', { name: /Our purpose/ }).click()
  await mobile.waitForTimeout(900)
  const mobileModalVisible = await mobile.getByRole('dialog').isVisible()
  await mobile.screenshot({ path: path.join(output, 'purpose-modal-mobile.png') })
  await mobile.getByRole('button', { name: 'Close story preview' }).click()
  await mobile.waitForTimeout(520)
  const mobileClosed = await mobile.locator('.story-dialog').count() === 0
  const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)

  const contact = await openPage({ width: 390, height: 844 }, 'Contact')
  const emailHref = await contact.locator('.contact-direct > a').getAttribute('href')
  const phoneHref = await contact.locator('.contact-meta > a').getAttribute('href')

  const reduced = await openPage({ width: 390, height: 844 }, 'Reduced', 'reduce')
  await reduced.evaluate(() => document.querySelector('#artists')?.scrollIntoView({ behavior: 'instant' }))
  await reduced.waitForTimeout(500)
  await reduced.getByRole('button', { name: 'Show Folk instrumentalists' }).click()
  const reducedCurtain = await reduced.locator('.artist-curtain-left').evaluate((element) => getComputedStyle(element).display)

  const result = { before, modalState, closingClass, closed, after, curtainMid, curtainEnd, artistImage, mobileModalVisible, mobileClosed, mobileOverflow, emailHref, phoneHref, reducedCurtain, consoleErrors: errors }
  console.log(JSON.stringify(result, null, 2))
  if (modalState.fixed !== 'fixed' || !modalState.portal || !modalState.bodyLocked || !modalState.htmlLocked || !closingClass?.includes('is-closing') || !closed || before.scrollY !== after.scrollY || before.heroTop !== after.heroTop || after.bodyOverflow || after.htmlOverflow || curtainMid === curtainEnd || artistImage !== '/images/artist-instrumentalist.avif' || !mobileModalVisible || !mobileClosed || mobileOverflow || emailHref !== 'mailto:Hello.desertvoice@gmail.com' || phoneHref !== 'tel:+917690052055' || reducedCurtain !== 'none' || errors.length) process.exitCode = 1
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
