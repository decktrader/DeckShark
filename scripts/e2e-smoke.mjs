/**
 * Local end-to-end smoke test (Playwright).
 *
 * Drives a real headless browser through the core signed-in flows to catch
 * runtime/hydration errors and broken interactions that build/type-check miss.
 *
 * Prereqs: `supabase start` (seeded testuser@test.com / 123456) and the dev
 * server running (`pnpm dev`). Then: `pnpm e2e`.
 *
 * Override the target with E2E_BASE (e.g. against a preview deploy).
 */
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const BASE = process.env.E2E_BASE || 'http://localhost:3000'
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
const EMAIL = process.env.E2E_EMAIL || 'testuser@test.com'
const PASSWORD = process.env.E2E_PASSWORD || '123456'
const WL_PREFIX = 'E2E smoke'

const results = []
const errors = []
const ok = (n) => results.push(`  ✓ ${n}`)
const failStep = (n, e) => results.push(`  ✗ ${n} — ${e?.message ?? e}`)

async function cleanupWantLists() {
  try {
    const supa = createClient(SUPABASE_URL, SUPABASE_ANON)
    const { data } = await supa.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD,
    })
    if (data?.user) {
      await supa
        .from('want_lists')
        .delete()
        .eq('user_id', data.user.id)
        .like('title', `${WL_PREFIX}%`)
    }
  } catch {
    /* best effort */
  }
}

await cleanupWantLists() // remove leftovers from a prior interrupted run

const browser = await chromium.launch()
const page = await (await browser.newContext()).newPage()
page.on('console', (m) => {
  if (m.type() !== 'error') return
  const t = m.text()
  if (/favicon|manifest|404|net::ERR|React DevTools/i.test(t)) return
  errors.push(`console.error @ ${page.url()}: ${t}`)
})
page.on('pageerror', (e) => errors.push(`pageerror @ ${page.url()}: ${e.message}`))

async function step(name, fn) {
  try {
    await fn()
    ok(name)
  } catch (e) {
    failStep(name, e)
  }
}

await step('Login (form submit + redirect)', async () => {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ])
})

await step('User-menu dropdown opens', async () => {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: new RegExp(EMAIL.split('@')[0], 'i') }).first().click()
  await page.getByRole('menuitem', { name: /sign out/i }).waitFor({ timeout: 5000 })
  await page.keyboard.press('Escape')
})

await step('Browse decks → open a deck → detail renders', async () => {
  await page.goto(`${BASE}/decks`, { waitUntil: 'networkidle' })
  await page.locator('main a[href^="/decks/"]:not([href="/decks/new"])').first().click()
  await page.waitForURL(/\/decks\/[0-9a-f-]{36}/, { timeout: 10000 })
  await page.getByRole('heading').first().waitFor({ timeout: 5000 })
})

await step('Notification bell dropdown opens', async () => {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /notifications/i }).first().click()
  await page.getByText('Notifications', { exact: false }).first().waitFor({ timeout: 5000 })
})

await step('Create a want list (form → submit → DB write → redirect)', async () => {
  await page.goto(`${BASE}/want-lists/new`, { waitUntil: 'networkidle' })
  await page.fill('#title', `${WL_PREFIX} ${Date.now()}`)
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 15000 }),
    page.getByRole('button', { name: /create|save|post/i }).first().click(),
  ])
})

await step('Toggle a deck trade-availability switch', async () => {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  const toggle = page.getByRole('switch').first()
  if ((await toggle.count()) === 0) throw new Error('no trade toggle found')
  await toggle.click()
  await page.waitForTimeout(1200)
})

await step('Sign out → home', async () => {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: new RegExp(EMAIL.split('@')[0], 'i') }).first().click()
  const signOut = page.getByRole('menuitem', { name: /sign out/i })
  await signOut.waitFor({ timeout: 5000 })
  await Promise.all([
    page.waitForURL((u) => u.pathname === '/', { timeout: 12000 }),
    signOut.click(),
  ])
})

await browser.close()
await cleanupWantLists() // remove the want list this run created

console.log('\n=== E2E smoke results ===')
console.log(results.join('\n'))
console.log(`\n=== console/page errors (${errors.length}) ===`)
console.log(errors.length ? errors.join('\n') : '  (none)')
const failed = results.filter((r) => r.includes('✗')).length
console.log(
  `\nSUMMARY: ${results.length - failed}/${results.length} steps passed, ${errors.length} JS errors`,
)
process.exit(failed || errors.length ? 1 : 0)
