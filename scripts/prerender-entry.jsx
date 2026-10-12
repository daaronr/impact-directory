import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server.js'
import { HelmetProvider } from 'react-helmet-async'
import App from '../src/App.jsx'

export function render(path, data) {
  const context = {}
  const html = renderToString(
    <HelmetProvider context={context}>
      <StaticRouter location={path}>
        <App initialData={data} />
      </StaticRouter>
    </HelmetProvider>,
  )
  const { helmet } = context
  return { html, head: helmet.title.toString() + helmet.meta.toString() + helmet.link.toString() }
}
