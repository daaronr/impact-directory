import { Helmet } from 'react-helmet-async'

const SITE = 'https://impact-products-directory.netlify.app'
const SITE_NAME = 'Impact Directory'

/**
 * Per-route metadata used by both React and the build-time HTML renderer.
 * Canonicals match the generated directory URLs, including trailing slashes.
 *
 * Props:
 *   title       — page title (site name is appended automatically)
 *   description — meta description (~150-160 chars)
 *   path        — route path for canonical/og:url, e.g. "/org/humanitix"
 */
export default function Seo({ title, description, path = '' }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Products and Services with Charitable Giving Commitments`
  const canonicalPath = path && path !== '/' ? `${path.replace(/\/$/, '')}/` : '/'
  const url = `${SITE}${canonicalPath}`
  const desc = description || 'Find businesses, products and services with charitable giving commitments. Compare sourced claims, their scope and confidence before choosing.'

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
