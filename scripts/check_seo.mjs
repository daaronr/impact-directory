import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const data = JSON.parse(readFileSync(join(root, 'public/data/all_data.json')))
const sitemap = readFileSync(join(root, 'dist/sitemap.xml'), 'utf8')
const paths = ['/', '/search/', '/about/', '/faq/', '/sources/']
for (const [family, records] of [['org', data.organizations], ['offering', data.offerings]]) {
  for (const record of records) paths.push(`/${family}/${record.slug}/`)
}
for (const path of new Set(paths)) {
  const page = readFileSync(join(root, 'dist', path, 'index.html'), 'utf8')
  assert.equal((page.match(/<title\b/g) || []).length, 1, path)
  assert.equal((page.match(/rel="canonical"/g) || []).length, 1, path)
  assert(page.includes(`href="https://impact-products-directory.netlify.app${path}"`), path)
  assert(page.includes('<h1'), path)
  assert(sitemap.includes(`<loc>https://impact-products-directory.netlify.app${path}</loc>`), path)
  assert(!page.includes('with Verified Impact Claims'), path)
}
const home = readFileSync(join(root, 'dist/index.html'), 'utf8')
assert(home.includes('action="/search/"') && home.includes('name="q"'), 'Initial HTML must provide a native search fallback')
const humanitix = readFileSync(join(root, 'dist/org/humanitix/index.html'), 'utf8')
assert(humanitix.includes('Humanitix'))
assert(humanitix.includes('100% of profits from booking fees are donated to education charities.'))
assert(humanitix.includes('data-engagement="website_open"'))
assert(!existsSync(join(root, 'dist/org/not-a-real-organization/index.html')))
const routing = readFileSync(join(root, 'netlify.toml'), 'utf8')
assert(!routing.includes('from = "/org/*"'))
assert(!routing.includes('from = "/offering/*"'))
assert(routing.includes('status = 404'))
assert(!sitemap.includes('/feedback'))
console.log(`[seo] verified ${new Set(paths).size} rendered, canonical, sitemap pages; real claim/tracking markup; missing slugs retain 404`)
