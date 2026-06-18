import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const V = 'v21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const token = Deno.env.get('META_SYSTEM_USER_TOKEN');
    const acct = (Deno.env.get('META_AD_ACCOUNT_ID') || '').trim();
    const acctNorm = acct.startsWith('act_') ? acct : `act_${acct}`;
    const base = `https://graph.facebook.com/${V}`;
    const t = encodeURIComponent(token);
    const out = { account_id: acct, account_id_normalizado: acctNorm };

    // 1. ¿A quién pertenece este token? (System User vs persona)
    out.quien_soy = await fetch(`${base}/me?fields=id,name&access_token=${t}`).then(r => r.json()).catch(e => ({ err: e.message }));

    // 2. ¿Qué permisos / scopes trae el token realmente?
    out.token_debug = await fetch(`${base}/debug_token?input_token=${t}&access_token=${t}`).then(r => r.json()).catch(e => ({ err: e.message }));

    // 3. ¿Qué businesses ve el token?
    out.businesses = await fetch(`${base}/me/businesses?fields=id,name&access_token=${t}`).then(r => r.json()).catch(e => ({ err: e.message }));

    // 4. Cuentas owned + client (no solo /me/adaccounts)
    out.adaccounts = await fetch(`${base}/me/adaccounts?fields=id,name,account_status&access_token=${t}`).then(r => r.json()).catch(e => ({ err: e.message }));

    return Response.json(out);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});