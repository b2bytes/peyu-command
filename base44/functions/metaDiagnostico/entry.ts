import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const V = 'v21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const token = Deno.env.get('META_SYSTEM_USER_TOKEN');
    let acct = (Deno.env.get('META_AD_ACCOUNT_ID') || '').trim();
    const acctNorm = acct.startsWith('act_') ? acct : `act_${acct}`;
    const base = `https://graph.facebook.com/${V}`;
    const out = { account_id_ingresado: acct, account_id_normalizado: acctNorm };

    // ¿Qué cuentas ve el token?
    out.adaccounts_visibles = await fetch(`${base}/me/adaccounts?fields=id,name,account_status,currency&access_token=${encodeURIComponent(token)}`).then(r => r.json()).catch(e => ({ err: e.message }));

    // Intentar leer la cuenta directamente
    out.cuenta_directa = await fetch(`${base}/${acctNorm}?fields=id,name,account_status,currency,business&access_token=${encodeURIComponent(token)}`).then(r => r.json()).catch(e => ({ err: e.message }));

    return Response.json(out);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});