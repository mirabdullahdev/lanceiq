import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/* Self-hosted variable fonts. No Google Fonts request, no third-party
   connection before first paint, nothing to disclose in a cookie banner. */
import '@fontsource-variable/fraunces'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'

import './index.css'
import App from './App'
import { PLAUSIBLE_DOMAIN } from './config/site'

/** Cookieless analytics, loaded only when a domain is configured. */
function mountAnalytics() {
  if (!PLAUSIBLE_DOMAIN) return
  const s = document.createElement('script')
  s.defer = true
  s.dataset['domain'] = PLAUSIBLE_DOMAIN
  s.src = 'https://plausible.io/js/script.js'
  document.head.appendChild(s)
}

mountAnalytics()

const root = document.getElementById('root')
if (!root) throw new Error('#root is missing from index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
