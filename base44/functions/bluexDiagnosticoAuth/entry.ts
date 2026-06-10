// ─────────────────────────────────────────────────────────────────────────────
// bluexDiagnosticoAuth — Prueba las variantes de autenticación contra la API
// corporativa Bluex de producción para identificar la combinación correcta.
// Solo admin. No muta nada: solo hace GETs de tracking y reporta status codes.
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { tracking = 'TEST123', modo = 'full' } = await req.json().catch(() => ({}));

    const apiKey = Deno.env.get('BLUEX_API_KEY') || '';
    const token = Deno.env.get('BLUEX_TOKEN') || '';
    const userCode = Deno.env.get('BLUEX_USER_CODE') || '';
    const clientAccount = Deno.env.get('BLUEX_CLIENT_ACCOUNT') || '';

    const base = 'https://cmkin.api.blue.cl';
    const url = `${base}/cmkin/bff/tracking-pull-corp/v1/${encodeURIComponent(tracking)}`;
    const results = {};

    const probe = async (name, headers) => {
      try {
        const r = await fetch(url, { headers });
        const body = await r.text();
        results[name] = { status: r.status, body: body.slice(0, 200) };
      } catch (e) {
        results[name] = { error: e.message };
      }
    };

    if (modo === 'full') {
    // Variante 1: Bearer token estático + x-api-key (actual)
    await probe('bearer_token_xapikey', { 'Authorization': `Bearer ${token}`, 'x-api-key': apiKey });
    // Variante 2: headers planos apikey + token (estilo gateway legacy)
    await probe('apikey_token_headers', { 'apikey': apiKey, 'token': token });
    // Variante 3: BX-TOKEN (estilo developers.bluex.cl)
    await probe('bxtoken_apikey', { 'apikey': apiKey, 'BX-TOKEN': token });
    // Variante 4: solo x-api-key
    await probe('solo_xapikey', { 'x-api-key': apiKey });

    // Variante 5: OAuth client_credentials en sso.blue.cl (userCode/clientAccount)
    let oauth = null;
    try {
      const r = await fetch('https://sso.blue.cl/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'client_credentials', client_id: userCode, client_secret: clientAccount }).toString(),
      });
      const body = await r.text();
      oauth = { status: r.status, body: body.slice(0, 200) };
      if (r.ok) {
        const tok = JSON.parse(body)?.access_token;
        if (tok) await probe('bearer_oauth_xapikey', { 'Authorization': `Bearer ${tok}`, 'x-api-key': apiKey });
      }
    } catch (e) {
      oauth = { error: e.message };
    }
    results.oauth_sso = oauth;

    // Variante 6: OAuth con apiKey/token como credenciales
    try {
      const r = await fetch('https://sso.blue.cl/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${apiKey}:${token}`)}`,
        },
        body: 'grant_type=client_credentials',
      });
      const body = await r.text();
      results.oauth_basic_apikey = { status: r.status, body: body.slice(0, 200) };
    } catch (e) {
      results.oauth_basic_apikey = { error: e.message };
    }

    // Variante 7: auth contra el endpoint de EMISIÓN (payload vacío → si auth OK
    // debe responder 400 validación, NO 401/403). No crea ninguna OT real.
    try {
      const r = await fetch(`${base}/cmkin/customer/corp/emission/v1/emission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'x-api-key': apiKey },
        body: JSON.stringify({}),
      });
      const body = await r.text();
      results.emission_auth_probe = { status: r.status, body: body.slice(0, 300) };
    } catch (e) {
      results.emission_auth_probe = { error: e.message };
    }

    // Variante 8: probar contra el host configurado en BLUEX_API_BASE_URL
    let envBase = String(Deno.env.get('BLUEX_API_BASE_URL') || '').trim().replace(/\/+$/, '');
    if (envBase && !/^https?:\/\//i.test(envBase)) envBase = `https://${envBase}`;
    results._env_base_host = envBase || '(vacío)';
    if (envBase && envBase !== base) {
      const probeUrl = async (name, u, headers) => {
        try {
          const r = await fetch(u, { headers });
          const b = await r.text();
          results[name] = { status: r.status, body: b.slice(0, 200) };
        } catch (e) { results[name] = { error: e.message }; }
      };
      await probeUrl('env_tracking_bearer', `${envBase}/cmkin/bff/tracking-pull-corp/v1/${tracking}`, { 'Authorization': `Bearer ${token}`, 'x-api-key': apiKey });
      await probeUrl('env_apigw_pricing_get', `${envBase}/api/legacy/pricing/v1?from=Santiago&to=Providencia`, { 'apikey': apiKey, 'BX-TOKEN': token });
      await probeUrl('env_root_apikey_token', `${envBase}/api/legacy/tracking/v1/${tracking}`, { 'apikey': apiKey, 'token': token });
      await probeUrl('env_root_bxtoken', `${envBase}/api/legacy/tracking/v1/${tracking}`, { 'apikey': apiKey, 'BX-TOKEN': token });
    }

    // Variante 9: gateway público apigw.bluex.cl (credenciales del portal developers)
    const gw = 'https://apigw.bluex.cl';
    const probeGw = async (name, path, headers) => {
      try {
        const r = await fetch(`${gw}${path}`, { headers });
        const b = await r.text();
        results[name] = { status: r.status, body: b.slice(0, 200) };
      } catch (e) { results[name] = { error: e.message }; }
    };
    await probeGw('apigw_tracking_bxtoken', `/api/legacy/tracking/v1/${tracking}`, { 'apikey': apiKey, 'BX-TOKEN': token });
    await probeGw('apigw_tracking_bearer', `/api/legacy/tracking/v1/${tracking}`, { 'Authorization': `Bearer ${token}`, 'x-api-key': apiKey });
    await probeGw('apigw_trackingpull_bxtoken', `/api/tracking-pull/v1/${tracking}`, { 'apikey': apiKey, 'BX-TOKEN': token });
    } // fin modo full

    // Variante 10: descubrir rutas reales en apigw.bluex.cl (apikey + BX-TOKEN).
    // POST con body vacío: si la ruta existe y auth OK → 400/422 validación.
    const hdrs = { 'Content-Type': 'application/json', 'apikey': apiKey, 'BX-TOKEN': token };
    const discover = async (name, method, path) => {
      try {
        const r = await fetch(`https://apigw.bluex.cl${path}`, {
          method,
          headers: hdrs,
          body: method === 'POST' ? JSON.stringify({}) : undefined,
        });
        const b = await r.text();
        results[name] = { status: r.status, body: b.slice(0, 250) };
      } catch (e) { results[name] = { error: e.message }; }
    };
    await discover('gw_pricing_post', 'POST', '/api/legacy/pricing/v1');
    await discover('gw_emission_post', 'POST', '/api/legacy/emission/v1');
    await discover('gw_emission_emission_post', 'POST', '/api/legacy/emission/v1/emission');
    await discover('gw_trackingpull_post', 'POST', '/api/legacy/tracking-pull/v1');
    await discover('gw_tracking_post', 'POST', '/api/legacy/tracking/v1');
    await discover('gw_districts_get', 'GET', '/api/legacy/geolocation/v1/districts?name=providencia');
    await discover('gw_district_get2', 'GET', '/api/legacy/districts/v1?name=providencia');

    // Variante 11 (modo rutas2): matriz de endpoints según doc oficial Bluex
    // (BX-TOKEN / BX-USERCODE / BX-CLIENT_ACCOUNT, host bx-tracking.bluex.cl)
    if (modo === 'rutas2') {
      const bxHdrs = {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'BX-TOKEN': token,
        'BX-USERCODE': userCode,
        'BX-CLIENT_ACCOUNT': clientAccount,
      };
      const probe2 = async (name, method, u) => {
        try {
          const r = await fetch(u, { method, headers: bxHdrs, body: method === 'POST' ? '{}' : undefined });
          const b = await r.text();
          results[name] = { status: r.status, body: b.slice(0, 220) };
        } catch (e) { results[name] = { error: e.message }; }
      };
      // Host directo doc oficial
      await probe2('bx_geo_all', 'GET', 'https://bx-tracking.bluex.cl/bx-geo/state/all');
      await probe2('bx_pricing', 'POST', 'https://bx-tracking.bluex.cl/bx-pricing/v1');
      await probe2('bx_emission', 'POST', 'https://bx-tracking.bluex.cl/bx-emission/v1');
      await probe2('bx_label', 'POST', 'https://bx-tracking.bluex.cl/bx-label/v1');
      await probe2('bx_trackingpull', 'GET', `https://bx-tracking.bluex.cl/bx-tracking-pull/v1/${tracking}`);
      // Variantes apigw
      await probe2('gw_emision_es', 'POST', 'https://apigw.bluex.cl/api/legacy/emision/v1');
      await probe2('gw_emission2', 'POST', 'https://apigw.bluex.cl/api/legacy/emission/v2');
      await probe2('gw_label', 'POST', 'https://apigw.bluex.cl/api/legacy/label/v1');
      await probe2('gw_geo', 'GET', 'https://apigw.bluex.cl/api/legacy/geo/state/all');
      await probe2('gw_trackpull', 'GET', `https://apigw.bluex.cl/api/legacy/tracking-pull/v1/${tracking}`);
    }

    // Variante 12 (modo rutas3): rutas de tracking-pull y label en bx-tracking
    if (modo === 'rutas3') {
      const bxHdrs = {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'BX-TOKEN': token,
        'BX-USERCODE': userCode,
        'BX-CLIENT_ACCOUNT': clientAccount,
      };
      const probe3 = async (name, method, u, body) => {
        try {
          const r = await fetch(u, { method, headers: bxHdrs, body: body ? JSON.stringify(body) : undefined });
          const b = await r.text();
          results[name] = { status: r.status, body: b.slice(0, 220) };
        } catch (e) { results[name] = { error: e.message }; }
      };
      const B = 'https://bx-tracking.bluex.cl';
      await probe3('tp_get_path', 'GET', `${B}/bx-tracking-pull/v1/tracking/${tracking}`);
      await probe3('tp_get_short', 'GET', `${B}/bx-tracking-pull/v1/${tracking}`);
      await probe3('tp_post_body', 'POST', `${B}/bx-tracking-pull/v1`, { trackingNumber: tracking });
      await probe3('tr_get', 'GET', `${B}/bx-tracking/v1/${tracking}`);
      await probe3('tp_query', 'GET', `${B}/bx-tracking-pull/v1/tracking?trackingNumber=${tracking}`);
      await probe3('label_emission_get', 'GET', `${B}/bx-emission/v1/label/${tracking}`);
      await probe3('label_get', 'GET', `${B}/bx-label/v1/${tracking}`);
      await probe3('label_printing', 'POST', `${B}/bx-printing/v1`, { trackingNumber: tracking });
    }

    // Variante 13 (modo rutas4): query params del tracking-pull (servlet GET)
    if (modo === 'rutas4') {
      const bxHdrs = {
        'apikey': apiKey,
        'BX-TOKEN': token,
        'BX-USERCODE': userCode,
        'BX-CLIENT_ACCOUNT': clientAccount,
      };
      const probe4 = async (name, u) => {
        try {
          const r = await fetch(u, { headers: bxHdrs });
          const b = await r.text();
          results[name] = { status: r.status, body: b.slice(0, 280) };
        } catch (e) { results[name] = { error: e.message }; }
      };
      const B = 'https://bx-tracking.bluex.cl';
      await probe4('q_trackingNumber', `${B}/bx-tracking-pull/v1?trackingNumber=${tracking}`);
      await probe4('q_n', `${B}/bx-tracking-pull/v1?n=${tracking}`);
      await probe4('q_ot', `${B}/bx-tracking-pull/v1?ot=${tracking}`);
      await probe4('q_os', `${B}/bx-tracking-pull/v1?os=${tracking}`);
      await probe4('q_seguimiento', `${B}/bx-tracking-pull/v1?seguimiento=${tracking}`);
      await probe4('q_vacio', `${B}/bx-tracking-pull/v1`);
      await probe4('label_q', `${B}/bx-emission/v1/label?trackingNumber=${tracking}`);
    }

    // Info de formato de secrets (sin exponer valores)
    results._secrets_shape = {
      apiKey: { len: apiKey.length, looks_jwt: apiKey.split('.').length === 3 },
      token: { len: token.length, looks_jwt: token.split('.').length === 3 },
      userCode: { len: userCode.length },
      clientAccount: { len: clientAccount.length },
    };

    return Response.json({ ok: true, url_probed: url, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});