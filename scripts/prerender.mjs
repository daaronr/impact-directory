// Render the actual React pages at build time; never send catalogue data to an
// external rendering service. No second copy of the public claims is maintained.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

process.env.NODE_ENV = 'production'
const { render } = await import('../.prerender/prerender-entry.js')
const root = resolve(import.meta.dirname, '..')
const data = JSON.parse(readFileSync(join(root, 'public/data/all_data.json'), 'utf8'))
let template = readFileSync(join(root, 'dist/index.html'), 'utf8')
// Replace only metadata supplied by the React Seo component. Keep verification,
// social image, viewport and asset tags. Helmet marks server tags for replacement.
template = template.replace(/<title>[\s\S]*?<\/title>/g, '')
  .replace(/<meta\b[^>]*(?:name="(?:description|twitter:card|twitter:title|twitter:description)"|property="og:(?:type|site_name|title|description|url)")[^>]*>/g, '')
  .replace(/<link\b[^>]*rel="canonical"[^>]*>/g, '')

const paths = ['/', '/search/', '/about/', '/faq/', '/sources/', '/feedback/']
for (const [family, records] of [['org', data.organizations], ['offering', data.offerings]]) {
  for (const item of records) {
    if (!item.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) throw new Error(`Unsafe ${family} slug`)
    paths.push(`/${family}/${item.slug}/`)
  }
}
// Existing React detail routes select the first record with a matching slug.
// Render each URL once, preserving that behavior for duplicate imported slugs.
const uniquePaths = [...new Set(paths)]
for (const path of uniquePaths) {
  const page = render(path, data)
  if (!page.html.includes('<h1') || !page.head.includes('canonical')) throw new Error(`Incomplete page: ${path}`)
  const html = template.replace('</head>', `${page.head}${path === '/feedback/' ? '<meta name="robots" content="noindex,follow">' : ''}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${page.html}</div>`)
  const dir = join(root, 'dist', path)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
}
console.log(`[prerender] ${uniquePaths.length} React pages with initial HTML and route metadata`)
