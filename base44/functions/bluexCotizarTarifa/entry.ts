// ─────────────────────────────────────────────────────────────────────────────
// bluexCotizarTarifa · Cotización de envío EN VIVO contra la API oficial
// BX-Pricing de BlueExpress (la misma cuenta corporativa con la que se emiten
// las OT). Esto reemplaza la dependencia del Excel estático: la tarifa que se
// cobra al cliente es la tarifa REAL y ACTUAL del contrato PEYU-Bluex.
//
// Uso: base44.functions.invoke('bluexCotizarTarifa', {
//   comuna: 'Providencia', peso_kg: 1.2,
//   alto_cm?, ancho_cm?, largo_cm?,
// })
// Devuelve: { ok, distrito, express: {costo, ...}, priority: {costo, ...} }
//
// Endpoint público de cotización (es solo lectura, sin datos sensibles), con
// validación de inputs y pesos acotados. Fallback: la tabla TarifaBluex.
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BX_BASE = 'https://bx-tracking.bluex.cl';
// Endpoint oficial Pricing 1.0.0 (doc Bluex): BFF e-commerce legacy-pricing.
// El doc lista 2 hosts PROD — probamos ambos en orden.
const PRICING_URLS = [
  'https://eplin.api.blue.cl/eplin/external/ecommerce/bff/v1/legacy-pricing',
  'https://cmkin.api.blue.cl/eplin/external/ecommerce/bff/v1/legacy-pricing',
];

// Bearer token OAuth corporativo PROD (mismo flujo que la emisión de OT)
let _bearerCache = { token: null, exp: 0 };
async function getBearerToken() {
  if (_bearerCache.token && Date.now() < _bearerCache.exp) return _bearerCache.token;
  const cid = Deno.env.get('BLUEX_CLIENT_ID') || '';
  const csec = Deno.env.get('BLUEX_CLIENT_SECRET') || '';
  const r = await fetch('https://sso.blue.cl/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${btoa(`${cid}:${csec}`)}` },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) throw new Error(`Token Bluex falló (${r.status})`);
  const j = await r.json();
  _bearerCache = { token: j.access_token, exp: Date.now() + 50 * 60 * 1000 };
  return j.access_token;
}

function bxHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': Deno.env.get('BLUEX_API_KEY') || '',
    'BX-TOKEN': Deno.env.get('BLUEX_TOKEN') || '',
    'BX-USERCODE': Deno.env.get('BLUEX_USER_CODE') || '',
    'BX-CLIENT_ACCOUNT': Deno.env.get('BLUEX_CLIENT_ACCOUNT') || '',
  };
}

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

// Alias: nombre "oficial" del usuario → nombre en el tarifario Bluex
const COMUNA_ALIASES = { 'santiago': 'santiago centro' };

// Resuelve el código de distrito Bluex (ej. PRO para Providencia).
// Fuente 1: tarifario importado (raw_columnas['Codigo Comuna'])
// Fuente 2: BluexGeoData (1,670 localidades del archivo oficial BX-GEO_DATA)
async function resolverDistrito(sr, comuna) {
  const candidates = [norm(comuna)];
  if (COMUNA_ALIASES[candidates[0]]) candidates.push(COMUNA_ALIASES[candidates[0]]);

  // 1) Tarifario oficial Bluex (rápido, incluye lead_time y región)
  for (const cand of candidates) {
    try {
      const tarifas = await sr.entities.TarifaBluex.filter({ comuna_normalizada: cand }, undefined, 1);
      const t = tarifas?.[0];
      const code = t?.raw_columnas?.['Codigo Comuna'];
      if (code) {
        return {
          code, name: t.comuna, region: t.region,
          state: Number(t.raw_columnas?.['ID Región']) || null,
          lead_time_dias: t.lead_time_dias || null,
          fuente: 'tarifario',
        };
      }
    } catch { /* sigue */ }
  }

  // 2) BluexGeoData: cobertura completa (1,670 localidades oficiales BlueExpress)
  for (const cand of candidates) {
    try {
      const geo = await sr.entities.BluexGeoData.filter({ comuna_normalizada: cand }, undefined, 1);
      const g = geo?.[0];
      if (g?.cod_localidad) {
        return {
          code: g.cod_localidad,
          name: g.nom_comuna,
          region: g.nom_region || '',
          state: g.cod_region || null,
          lead_time_dias: null,
          fuente: 'bluex_geo_data',
        };
      }
    } catch { /* sigue */ }
    // También buscar por localidad_normalizada
    try {
      const geoLoc = await sr.entities.BluexGeoData.filter({ localidad_normalizada: cand }, undefined, 1);
      const gl = geoLoc?.[0];
      if (gl?.cod_localidad) {
        return {
          code: gl.cod_localidad,
          name: gl.nom_comuna,
          region: gl.nom_region || '',
          state: gl.cod_region || null,
          lead_time_dias: null,
          fuente: 'bluex_geo_data_loc',
        };
      }
    } catch { /* sigue */ }
  }

  return null;
}

// Cotiza UN servicio contra BX-Pricing corporativo (esquema oficial Bluex).
// serviceType: 'EX' | 'PY'. NOTA: requiere que Bluex habilite el producto
// "pricing" en la x-api-key de PEYU (hoy responde 403; emisión y tracking sí
// están habilitados). Mientras tanto el frontend cae a la tabla TarifaBluex.
async function cotizarServicio({ distrito, pesoKg, alto, ancho, largo, serviceType }) {
  // Esquema oficial Pricing 1.0.0: datosProducto.bultos[] con enteros
  const body = {
    from: { country: 'CL', district: 'PUD' }, // origen: galpón PEYU Pudahuel
    to: { country: 'CL', ...(distrito.state ? { state: distrito.state } : {}), district: distrito.code },
    serviceType,
    datosProducto: {
      producto: 'P',
      familiaProducto: 'PAQU',
      bultos: [{
        largo: Math.max(1, Math.round(largo || 20)),
        ancho: Math.max(1, Math.round(ancho || 15)),
        alto: Math.max(1, Math.round(alto || 10)),
        pesoFisico: Math.max(1, Math.ceil(pesoKg)),
        cantidad: 1,
      }],
    },
  };
  // Headers oficiales: BX-TOKEN + Bearer OAuth (sso.blue.cl) + x-api-key
  const bearer = await getBearerToken();
  const headers = {
    'Content-Type': 'application/json',
    'BX-TOKEN': Deno.env.get('BLUEX_TOKEN') || '',
    'Authorization': `Bearer ${bearer}`,
    'x-api-key': Deno.env.get('BLUEX_API_KEY') || '',
  };
  let res = null, data = {};
  for (const url of PRICING_URLS) {
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    data = await res.json().catch(() => ({}));
    if (res.ok && data?.status !== false) break; // host respondió OK
  }
  if (!res?.ok || data?.status === false) {
    console.warn(`[bx-pricing ${serviceType}] HTTP ${res?.status}:`, JSON.stringify(data).slice(0, 400));
    return { error: `HTTP ${res?.status}`, raw: data };
  }
  // Respuesta oficial: { status: true, data: { tarifa, flete, servicioAdicional, total, fechaEstimadaEntrega } }
  const d = data?.data || {};
  const costo = Number(d.total ?? d.flete ?? NaN);
  if (!Number.isFinite(costo) || costo <= 0) {
    console.warn(`[bx-pricing ${serviceType}] respuesta sin total:`, JSON.stringify(data).slice(0, 400));
    return { error: 'sin_total', raw: data };
  }
  return {
    costo: Math.round(costo),
    fecha_estimada_entrega: d.fechaEstimadaEntrega || null,
    raw: d,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const { comuna, peso_kg = 0.5, alto_cm, ancho_cm, largo_cm } = await req.json();
    if (!comuna || typeof comuna !== 'string') {
      return Response.json({ error: 'comuna requerida' }, { status: 400 });
    }
    // Peso acotado: evita abuso del endpoint público
    const pesoKg = Math.min(Math.max(Number(peso_kg) || 0.5, 0.1), 60);

    if (!Deno.env.get('BLUEX_API_KEY')) {
      return Response.json({ error: 'Credenciales Bluex no configuradas' }, { status: 503 });
    }

    const distrito = await resolverDistrito(sr, comuna);
    if (!distrito) {
      return Response.json({ ok: false, error: 'comuna_no_encontrada', comuna }, { status: 404 });
    }

    const params = { distrito, pesoKg, alto: alto_cm, ancho: ancho_cm, largo: largo_cm };
    const [ex, py] = await Promise.all([
      cotizarServicio({ ...params, serviceType: 'EX' }),
      cotizarServicio({ ...params, serviceType: 'PY' }),
    ]);

    if (ex.error && py.error) {
      return Response.json({ ok: false, error: 'pricing_no_disponible', detail: { ex: ex.error, py: py.error } }, { status: 502 });
    }

    const wrap = (r, servicio) => r.error ? null : {
      servicio,
      comuna: distrito.name,
      region: distrito.region || '',
      costo: r.costo,
      peso_kg: pesoKg,
      lead_time_dias: distrito.lead_time_dias || null,
      fecha_estimada_entrega: r.fecha_estimada_entrega,
      tramo: 'bx_pricing_live',
      es_estimado: false,
    };

    const express = wrap(ex, 'EXPRESS');
    let priority = wrap(py, 'PRIORITY');
    // PRIORITY solo se ofrece si realmente aporta (precio o fecha distinta a
    // EXPRESS). En RM urbana la API devuelve lo mismo para ambos → solo EXPRESS.
    if (express && priority
      && priority.costo === express.costo
      && priority.fecha_estimada_entrega === express.fecha_estimada_entrega) {
      priority = null;
    }

    return Response.json({
      ok: true,
      distrito,
      peso_cotizado_kg: pesoKg,
      express,
      priority,
    });
  } catch (error) {
    console.error('[bluexCotizarTarifa]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});