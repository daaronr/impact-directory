import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const SITE = '78da1569-75bd-4690-8f8f-e20cd14b5720'
const BASE = 'https://impact-products-directory.netlify.app'
const result = JSON.parse(readFileSync('.netlify-deploy.json', 'utf8'))
assert(result.deploy_id, 'CLI must return an explicit deployment ID')
assert(process.env.NETLIFY_AUTH_TOKEN, 'Deployment read-back needs the existing token')
const response = await fetch(`https://api.netlify.com/api/v1/sites/${SITE}`, {
  headers: { Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}` },
})
assert(response.ok, 'Site metadata read-back failed')
const site = await response.json()
assert.equal(site.id, SITE)
assert.equal(site.name, 'impact-products-directory')
assert.equal(site.published_deploy.id, result.deploy_id, 'Returned deploy must be currently published')
assert.equal(site.published_deploy.state, 'ready')
assert.equal(site.published_deploy.context, 'production')
for (const [path, text] of [['/', 'with giving commitments'], ['/org/humanitix/', 'Humanitix']]) {
  const page = await fetch(BASE + path, { headers: { 'User-Agent': 'EngagementAudit/1.0' } })
  assert.equal(page.status, 200, path)
  const html = await page.text()
  assert(html.includes('<h1') && html.includes(text), `${path} must contain real initial HTML`)
  const expected = `href="${BASE}${path}"`
  assert(html.includes(expected), `${path} must carry its own canonical`)
}
const missing = await fetch(BASE + '/org/not-a-real-organization/', { headers: { 'User-Agent': 'EngagementAudit/1.0' } })
assert.equal(missing.status, 404, 'Missing catalogue slug must not become successful homepage HTML')
console.log(`Verified production deployment ${result.deploy_id} on ${SITE}; initial HTML, canonicals and 404 behavior`)
