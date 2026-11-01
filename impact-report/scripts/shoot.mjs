// Screenshot each <section class="panel"> of a rendered report as a 2x PNG, plus the full page.
//
//   node shoot.mjs out/index.html out/
//
// Playwright resolves from the current directory, then from a one-time install at
// ~/.cache/impact-report (see SETUP below). pnpm workspaces rarely expose it at the root.
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const CACHE = join(homedir(), '.cache', 'impact-report')
const SETUP = `mkdir -p ${CACHE} && cd ${CACHE} && npm i playwright@1.60.0 && npx playwright install chromium`

const [, , htmlPath, outDir] = process.argv
const { chromium } = loadPlaywright()

const browser = await chromium.launch()
// Reduced motion skips the reveal animation so every panel is captured in its final state.
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' })
await page.goto(`file://${resolve(htmlPath)}`)
await page.evaluate(() => document.fonts.ready)
const ids = await page.$$eval('section.panel', (els) => els.map((el) => el.id))
for (const [i, id] of ids.entries()) {
  await page.locator(`#${id}`).screenshot({ path: `${outDir}/${i + 1}-${id}.png`, omitBackground: true })
}
await page.screenshot({ path: `${outDir}/full.png`, fullPage: true })
await browser.close()
console.log(ids.map((id, i) => `${outDir}/${i + 1}-${id}.png`).join('\n'))

function loadPlaywright() {
  for (const dir of [process.cwd(), CACHE]) {
    try {
      return createRequire(join(dir, 'package.json'))('playwright')
    } catch {}
  }
  console.error(`playwright not found. One-time setup:\n  ${SETUP}`)
  process.exit(1)
}
