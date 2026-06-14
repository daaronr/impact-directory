import { Helmet } from 'react-helmet-async'

const SITE = 'https://impact-products-directory.netlify.app'
const SITE_NAME = 'Impact Directory'

/**
 * Per-route SEO tags. Renders <title>, description, canonical, and Open Graph /
 * Twitter meta. Effective for Google's JS rendering immediately; for non-JS
 * social crawlers it requires Netlify prerendering to be enabled (see README).
 *
 * Props:
 *   title       — page title (site name is appended automatically)
 *   description — meta description (~150-160 chars)
 *   path        — route path for canonical/og:url, e.g. "/org/humanitix"
 */
export default function Seo({ title, description, path = '' }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Organizations & Products with Verified Impact Claims`
  const url = `${SITE}${path}`
  const desc = description || 'A searchable directory of organizations and offerings with meaningful social or environmental commitments — verified impact claims, not just branding.'

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
    </Helmet>
  )
}
