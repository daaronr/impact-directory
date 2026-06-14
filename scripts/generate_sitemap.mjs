// Generates public/sitemap.xml from the consolidated data.
// Runs as an npm `prebuild` step (Node-only, so it works in both the
// Node-only deploy workflow and the Python+Node refresh workflow).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SITE = 'https://impact-products-directory.netlify.app'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = join(root, 'public', 'data', 'all_data.json')

const STATIC_ROUTES = ['/', '/search', '/about', '/faq', '/sources', '/feedback']

function urlTag(path) {
  return `  <url><loc>${SITE}${path}</loc></url>`
}

function escapeSlug(slug) {
  // slugs are already URL-safe, but guard against stray XML-special chars
  return String(slug).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const urls = [...STATIC_ROUTES.map(urlTag)]

if (existsSync(dataPath)) {
  const data = JSON.parse(readFileSync(dataPath, 'utf8'))
  for (const org of data.organizations || []) {
    if (org.slug) urls.push(urlTag(`/org/${escapeSlug(org.slug)}`))
  }
  for (const off of data.offerings || []) {
    if (off.slug) urls.push(urlTag(`/offering/${escapeSlug(off.slug)}`))
  }
} else {
  console.warn('[sitemap] data file not found, emitting static routes only:', dataPath)
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`

writeFileSync(join(root, 'public', 'sitemap.xml'), xml)
console.log(`[sitemap] wrote ${urls.length} URLs to public/sitemap.xml`)
