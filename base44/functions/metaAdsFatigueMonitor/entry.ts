import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsFatigueMonitor · Detección PROACTIVA de fatiga creativa en Meta Ads.
// ----------------------------------------------------------------------------
// La fatiga creativa es el asesino #1 del ROAS: cuando la misma audiencia ve
// el mismo anuncio demasiadas veces, el CTR cae, el CPC sube y el CPA explota.
// Esta función la detecta ANTES de que el founder lo note.
//
// Qué hace:
//   1. Trae insights a nivel de AD SET con frecuencia, CTR, impressions.
//   2. Compara el CTR de los primeros 3 días vs los últimos 3 días del período.
//   3. Flaggea ad sets con: frecuencia > 3, caída de CTR > 30%, o frecuencia > 5.
//   4. Para cada ad set fatigado, lista los creativos activos y sugiere
//      renovación vía metaAdsCreativeDoctor.
//   5. Devuelve un reporte de fatiga con severidad y acción recomendada.
//
// Payload:
//   { date_preset?: string }  — período (default 'last_14d')
//   { frequency_threshold?: number }  — umbral de fatiga (default 3.0)
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
  if (code === 190) return { reason: 'token_invalido', error: 'Token inválido.', detail: msg };
  if (code === 200 || code === 10) return { reason: 'sin_permiso', error: 'Sin permiso.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
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
    const datePreset = body.date_preset || 'last_14d';
    const freqThreshold = Number(body.frequency_threshold) || 3.0;
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);

    // 1 · Insights a nivel de ad set — período completo
    const asRes = await fetch(`${base}/${accountId}/insights?level=adset&fields=adset_id,adset_name,campaign_id,spend,impressions,reach,frequency,ctr,clicks,cpm&date_preset=${datePreset}&limit=200&access_token=${t}`);
    const asData = await asRes.json();
    if (asData.error) return Response.json({ ok: false, ...diagnoseMetaError(asData.error) });
    const adsets = asData.data || [];

    // 2 · Insights de los primeros 3 días y últimos 3 días para comparar CTR
    const now = Math.floor(Date.now() / 1000);
    const since3 = now - 3 * 86400;
    const until3 = now;
    const sinceStart = now - 14 * 86400;
    const untilStart = now - 11 * 86400;

    const earlyRes = await fetch(`${base}/${accountId}/insights?level=adset&fields=adset_id,ctr,impressions&time_range=${encodeURIComponent(JSON.stringify({ since: new Date(sinceStart * 1000).toISOString().slice(0, 10), until: new Date(untilStart * 1000).toISOString().slice(0, 10) }))}&limit=200&access_token=${t}`);
    const earlyData = await earlyRes.json();
    const earlyMap = {};
    if (!earlyData.error) for (const e of (earlyData.data || [])) earlyMap[e.adset_id] = e;

    const lateRes = await fetch(`${base}/${accountId}/insights?level=adset&fields=adset_id,ctr,impressions&time_range=${encodeURIComponent(JSON.stringify({ since: new Date(since3 * 1000).toISOString().slice(0, 10), until: new Date(until3 * 1000).toISOString().slice(0, 10) }))}&limit=200&access_token=${t}`);
    const lateData = await lateRes.json();
    const lateMap = {};
    if (!lateData.error) for (const e of (lateData.data || [])) lateMap[e.adset_id] = e;

    // 3 · Analizar fatiga por ad set
    const report = [];
    for (const as of adsets) {
      const freq = Number(as.frequency || 0);
      const ctr = Number(as.ctr || 0);
      const spend = Number(as.spend || 0);
      const impressions = Number(as.impressions || 0);

      if (spend < 1000) continue; // sin suficiente data

      const earlyCtr = Number(earlyMap[as.adset_id]?.ctr || 0);
      const lateCtr = Number(lateMap[as.adset_id]?.ctr || 0);
      const ctrDecline = earlyCtr > 0 ? ((earlyCtr - lateCtr) / earlyCtr * 100) : 0;

      let severity = 'ok';
      let status = 'saludable';
      const reasons = [];

      if (freq >= 5.0) {
        severity = 'critical';
        status = 'fatigado_critico';
        reasons.push(`Frecuencia ${freq.toFixed(1)} (≥5.0 — fatiga severa, CTR en caída libre).`);
      } else if (freq >= freqThreshold) {
        severity = 'high';
        status = 'fatigado';
        reasons.push(`Frecuencia ${freq.toFixed(1)} (≥${freqThreshold} — fatiga creativa detectada).`);
      }

      if (ctrDecline > 30 && earlyCtr > 0) {
        if (severity === 'ok') { severity = 'medium'; status = 'degradando'; }
        reasons.push(`CTR cayó ${ctrDecline.toFixed(0)}% (${earlyCtr.toFixed(2)}% → ${lateCtr.toFixed(2)}% en últimos 3 días).`);
      }

      if (severity === 'ok' && ctr < 1.0 && impressions > 5000) {
        severity = 'low';
        status = 'bajo_ctr';
        reasons.push(`CTR ${ctr.toFixed(2)}% (<1.0% — engagement bajo, posible fatiga incipiente).`);
      }

      if (severity === 'ok') continue; // solo reportar los que necesitan atención

      report.push({
        adset_id: as.adset_id,
        adset_name: as.adset_name,
        campaign_id: as.campaign_id || null,
        severity,
        status,
        reasons,
        metrics: {
          frequency: Number(freq.toFixed(1)),
          ctr_pct: Number(ctr.toFixed(2)),
          early_ctr_pct: earlyCtr > 0 ? Number(earlyCtr.toFixed(2)) : null,
          late_ctr_pct: lateCtr > 0 ? Number(lateCtr.toFixed(2)) : null,
          ctr_decline_pct: ctrDecline > 0 ? Number(ctrDecline.toFixed(0)) : 0,
          spend_clp: Math.round(spend),
          impressions,
          clicks: Number(as.clicks || 0),
          cpm_clp: Math.round(Number(as.cpm || 0)),
        },
        recommended_action: severity === 'critical'
          ? `Pausar renovar YA. Llama metaAdsCreativeDoctor({ adset_id: '${as.adset_id}' }) para generar variantes, luego metaAdsCreateMultiAd para A/B.`
          : severity === 'high'
            ? `Renovar creativos esta semana. metaAdsCreativeDoctor({ adset_id: '${as.adset_id}' }) + metaAdsCreateMultiAd.`
            : `Monitorear. Preparar variantes con metaAdsCreativeDoctor({ adset_id: '${as.adset_id}' }).`,
      });
    }

    // 4 · Resumen
    const critical = report.filter(r => r.severity === 'critical').length;
    const high = report.filter(r => r.severity === 'high').length;
    const medium = report.filter(r => r.severity === 'medium').length;

    return Response.json({
      ok: true,
      date_preset: datePreset,
      frequency_threshold: freqThreshold,
      summary: {
        total_adsets_analyzed: adsets.filter(a => Number(a.spend || 0) >= 1000).length,
        fatigued_count: report.length,
        critical,
        high,
        medium,
        needs_immediate_action: critical + high,
      },
      report: report.sort((a, b) => {
        const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (sevOrder[a.severity] || 4) - (sevOrder[b.severity] || 4);
      }),
      recommended_actions: [
        ...(critical > 0 ? [`🚨 ${critical} ad set(s) con fatiga CRÍTICA — renovar creativos HOY.`] : []),
        ...(high > 0 ? [`⚠️ ${high} ad set(s) con fatiga alta — renovar esta semana.`] : []),
        ...(medium > 0 ? [`📊 ${medium} ad set(s) degradando — preparar variantes.`] : []),
        ...(critical + high === 0 && medium === 0 ? [`✅ Sin fatiga detectada. Los creativos están frescos.`] : []),
      ],
      nota: 'Para cada ad set fatigado, usa metaAdsCreativeDoctor para generar variantes y metaAdsCreateMultiAd para A/B testing. Renovar creativos cada 7-14 días previene la fatiga.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});