import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAccountIntelligence · Informe ejecutivo "McKinsey" de la cuenta Meta.
// En una sola llamada trae todo lo que el agente necesita para diagnosticar
// la salud de la cuenta SIN que el founder entre a Meta:
//   • KPIs agregados del periodo (spend, ROAS, CPA, ingresos, conversiones)
//   • Tendencia DÍA A DÍA (serie temporal de spend, ingresos, ROAS)
//   • Salud por campaña: señales de fatiga (frecuencia), hook débil (CTR),
//     saturación (CPM), eficiencia (ROAS/CPA) → con un veredicto por campaña.
//   • Señales accionables agregadas (ganadoras a escalar, perdedoras a pausar).
//
// Payload: { date_preset?: 'last_30d', objetivo_roas?: 3, objetivo_cpl_clp?: 8000 }
// ============================================================================

const GRAPH_VERSION = 'v21.0';

function fmtAccountId(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  return s.startsWith('act_') ? s : `act_${s.replace(/\D/g, '')}`;
}

function diagnoseMetaError(err) {
  const code = err?.code;
  const msg = err?.message || 'Error desconocido de Meta.';
  if (code === 190) return { reason: 'token_invalido', error: 'Token de Meta inválido o expirado.', detail: msg };
  if (code === 200 || code === 10 || code === 272) return { reason: 'sin_permiso', error: 'El System User no tiene permiso ads_read sobre la cuenta.', detail: msg };
  if (code === 100) return { reason: 'no_encontrado', error: 'Recurso no encontrado. Revisa META_AD_ACCOUNT_ID.', detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

const PURCHASE_TYPES = ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase'];
const CONV_TYPES = [...PURCHASE_TYPES, 'lead', 'offsite_conversion.fb_pixel_lead'];

function parseRow(d) {
  const conv = (d.actions || []).find(a => CONV_TYPES.includes(a.action_type));
  const conversions = conv ? Number(conv.value) : 0;
  const valObj = (d.action_values || []).find(a => PURCHASE_TYPES.includes(a.action_type));
  const conversion_value = valObj ? Number(valObj.value) : 0;
  const spend = Number(d.spend || 0);
  const roasObj = (d.purchase_roas || [])[0];
  const roas = roasObj ? Number(roasObj.value) : (spend > 0 && conversion_value > 0 ? conversion_value / spend : 0);
  return {
    spend,
    impressions: Number(d.impressions || 0),
    clicks: Number(d.clicks || 0),
    ctr: Number(d.ctr || 0),
    cpm: Number(d.cpm || 0),
    reach: Number(d.reach || 0),
    frequency: Number(d.frequency || 0),
    conversions,
    conversion_value,
    roas,
    cpa: conversions > 0 ? spend / conversions : 0,
  };
}

// Genera el veredicto de salud de una campaña según sus señales.
function diagnoseCampaign(r, objetivoRoas) {
  const flags = [];
  if (r.frequency > 2.5) flags.push({ tipo: 'fatiga', sev: 'alta', msg: `Frecuencia ${r.frequency.toFixed(1)} — el público está saturado, refresca creativos o amplía audiencia.` });
  else if (r.frequency > 1.8) flags.push({ tipo: 'fatiga', sev: 'media', msg: `Frecuencia ${r.frequency.toFixed(1)} subiendo — vigila fatiga.` });
  if (r.ctr > 0 && r.ctr < 1) flags.push({ tipo: 'hook_debil', sev: 'media', msg: `CTR ${r.ctr.toFixed(2)}% bajo 1% — el creativo no engancha en los primeros 3s.` });
  if (r.spend > 0 && r.conversions === 0) flags.push({ tipo: 'sin_conversiones', sev: 'alta', msg: `Gastó $${Math.round(r.spend).toLocaleString('es-CL')} sin conversiones — revisa segmentación o landing.` });
  if (objetivoRoas && r.roas > 0 && r.roas < objetivoRoas) flags.push({ tipo: 'roas_bajo', sev: 'media', msg: `ROAS ${r.roas.toFixed(2)} bajo el objetivo ${objetivoRoas} — optimiza o reduce gasto.` });

  let veredicto = 'estable';
  if (objetivoRoas && r.roas >= objetivoRoas * 1.3 && r.conversions >= 2) veredicto = 'ganadora_escalar';
  else if (flags.some(f => f.sev === 'alta')) veredicto = 'critica_revisar';
  else if (flags.length) veredicto = 'vigilar';
  return { veredicto, flags };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const token = Deno.env.get('META_SYSTEM_USER_TOKEN');
    const accountId = fmtAccountId(Deno.env.get('META_AD_ACCOUNT_ID'));
    if (!token || !accountId) return Response.json({ ok: false, error: 'Faltan credenciales de Meta.' });

    const body = await req.json().catch(() => ({}));
    const datePreset = body.date_preset || 'last_30d';
    const objetivoRoas = Number(body.objetivo_roas || 0) || null;
    const objetivoCplClp = Number(body.objetivo_cpl_clp || 0) || null;
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);
    const fields = 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,purchase_roas';

    // 1 · Cuenta
    const acctRes = await fetch(`${base}/${accountId}?fields=name,currency,account_status,amount_spent&access_token=${t}`);
    const acct = await acctRes.json();
    if (acct.error) return Response.json({ ok: false, ...diagnoseMetaError(acct.error) });

    // 2 · Insights por campaña (salud individual)
    const campRes = await fetch(`${base}/${accountId}/insights?level=campaign&date_preset=${datePreset}&fields=campaign_name,campaign_id,${fields}&limit=200&access_token=${t}`);
    const campData = await campRes.json();
    if (campData.error) return Response.json({ ok: false, ...diagnoseMetaError(campData.error) });

    const campaigns = (campData.data || []).map(d => {
      const r = parseRow(d);
      const { veredicto, flags } = diagnoseCampaign(r, objetivoRoas);
      return { campaign_id: d.campaign_id, campaign_name: d.campaign_name, ...r, veredicto, flags };
    }).sort((a, b) => b.spend - a.spend);

    // 3 · Tendencia día a día (serie temporal agregada de la cuenta)
    const trendRes = await fetch(`${base}/${accountId}/insights?level=account&date_preset=${datePreset}&time_increment=1&fields=${fields}&limit=120&access_token=${t}`);
    const trendData = await trendRes.json();
    const serie = (trendData.data || []).map(d => {
      const r = parseRow(d);
      return { date: d.date_start, spend: r.spend, conversion_value: r.conversion_value, conversions: r.conversions, roas: r.roas, cpm: r.cpm };
    });

    // 4 · KPIs agregados
    const tot = campaigns.reduce((s, r) => {
      s.spend += r.spend; s.impressions += r.impressions; s.clicks += r.clicks;
      s.conversions += r.conversions; s.conversion_value += r.conversion_value; s.reach += r.reach;
      return s;
    }, { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversion_value: 0, reach: 0 });
    const totales = {
      ...tot,
      ctr: tot.impressions > 0 ? (tot.clicks / tot.impressions) * 100 : 0,
      cpc: tot.clicks > 0 ? tot.spend / tot.clicks : 0,
      cpa: tot.conversions > 0 ? tot.spend / tot.conversions : 0,
      roas: tot.spend > 0 && tot.conversion_value > 0 ? tot.conversion_value / tot.spend : 0,
    };

    // 5 · Señales accionables agregadas
    const ganadoras = campaigns.filter(c => c.veredicto === 'ganadora_escalar');
    const criticas = campaigns.filter(c => c.veredicto === 'critica_revisar');
    const vigilar = campaigns.filter(c => c.veredicto === 'vigilar');
    const activas = campaigns.filter(c => c.spend > 0).length;

    // 6 · Lectura de tendencia (¿el ROAS sube o baja en la 2ª mitad del periodo?)
    let tendencia_roas = 'estable';
    if (serie.length >= 6) {
      const mid = Math.floor(serie.length / 2);
      const avg = (arr, k) => arr.reduce((s, x) => s + (x[k] || 0), 0) / (arr.length || 1);
      const roas1 = avg(serie.slice(0, mid), 'roas');
      const roas2 = avg(serie.slice(mid), 'roas');
      if (roas2 > roas1 * 1.1) tendencia_roas = 'mejorando';
      else if (roas2 < roas1 * 0.9) tendencia_roas = 'empeorando';
    }

    return Response.json({
      ok: true,
      account: { id: accountId, name: acct.name, currency: acct.currency, status: acct.account_status, status_ok: acct.account_status === 1, amount_spent_total: Number(acct.amount_spent || 0) },
      date_preset: datePreset,
      objetivo_roas: objetivoRoas,
      objetivo_cpl_clp: objetivoCplClp,
      totales,
      tendencia: { serie, roas_direccion: tendencia_roas },
      campaigns,
      resumen: {
        campañas_activas: activas,
        ganadoras_a_escalar: ganadoras.map(c => ({ name: c.campaign_name, id: c.campaign_id, roas: c.roas })),
        criticas_a_revisar: criticas.map(c => ({ name: c.campaign_name, id: c.campaign_id, flags: c.flags })),
        a_vigilar: vigilar.map(c => ({ name: c.campaign_name, id: c.campaign_id })),
      },
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});