import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initWebVitals } from '@/lib/web-vitals.js'
import { installGlobalErrorHandlers } from '@/lib/error-reporter.js'
import { applyLiquidMode } from '@/lib/liquid-dual.js'

// Aplica modo Liquid Dual (día/noche) ANTES del primer render
// para evitar flash de tema incorrecto.
applyLiquidMode();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Core Web Vitals tracking → GA4 (LCP, CLS, INP, FCP, TTFB)
initWebVitals();
// Captura global de errores → ErrorLog en BD
installGlobalErrorHandlers();