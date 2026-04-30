import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initWebVitals } from '@/lib/web-vitals.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Core Web Vitals tracking → GA4 (LCP, CLS, INP, FCP, TTFB)
initWebVitals();