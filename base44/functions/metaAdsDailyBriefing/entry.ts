import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsDailyBriefing · Análisis PROACTIVO diario de toda la cuenta de Meta.
// ----------------------------------------------------------------------------
// Es la función que hace al agente una "ayuda constante": sin que el founder
// pregunte, el agente puede llamarla para detectar problemas, oportunidades y
// acciones concretas. Piensa en ella como el "morning brief" de un performance
// director de agencia.
//
// Qué hace:
//   1. Trae TODAS las campañas activas con performance de últimos 7 días.
//   2. Calcula ROAS, CPA, CTR, frecuencia y pace de gasto por campaña.
//   3. Flaggea problemas: CPA alto, CTR bajo, fatiga creativa, gasto sin
//      conversiones, presupuesto sin usar, campañas pausadas con presupuesto.
//   4. Detecta oportunidades: campañas ganadoras para escalar, audiences
//      saturadas, creativos agotados.
//   5. Devuelve un briefing estructurado con acciones priorizadas.
//
// Payload:
//   { date_preset?: 'last_7d' | 'last_14d' | 'last_30d' | 'yesterday' }
//   { target_roas?: number }  — ROAS objetivo (default 1.5)
//   { target_cpa_clp?: number } — CPA máximo aceptable (default 15000)
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
  if (code === 200 || code === 10) return { reason: 'sin_permiso', error: 'Sin permiso sobre la cuenta.', detail: msg };
  if (code === 17 || code === 4) return { reason: 'rate_limit', error: 'Meta limitando consultas. Reintenta.', detail: msg };
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
    const datePreset = body.date_preset || 'last_7d';
    const targetRoas = Number(body.target_roas) || 1.5;
    const targetCpa = Number(body.target_cpa_clp) || 15000;
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);

    // 1 · Listar TODAS las campañas (incluidas pausadas)
    const campRes = await fetch(`${base}/${accountId}/campaigns?fields=id,name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time&limit=200&access_token=${t}`);
    const campData = await campRes.json();
    if (campData.error) return Response.json({ ok: false, ...diagnoseMetaError(campData.error) });
    const allCampaigns = campData.data || [];

    // 2 · Insights a nivel de campaña (gasto + resultados del período)
    const insightsFields = 'campaign_id,campaign_name,spend,impressions,clicks,reach,frequency,ctr,cpm,cpp,purchase_roas,actions';
    const insRes = await fetch(`${base}/${accountId}/insights?level=campaign&fields=${insightsFields}&date_preset=${datePreset}&limit=200&access_token=${t}`);
    const insData = await insRes.json();
    if (insData.error) return Response.json({ ok: false, ...diagnoseMetaError(insData.error) });
    const insights = insData.data || [];
    const insMap = {};
    for (const ins of insights) {
      insMap[ins.campaign_id] = ins;
    }

    // 3 · Ad set level insights para detectar fatiga creativa (frecuencia)
    const asInsRes = await fetch(`${base}/${accountId}/insights?level=adset&fields=adset_id,adset_name,spend,frequency,ctr,impressions&date_preset=${datePreset}&limit=200&access_token=${t}`);
    const asInsData = await asInsRes.json();
    const adsetInsights = asInsData.error ? [] : (asInsData.data || []);

    // 4 · Construir el briefing por campaña
    const totalSpend = insights.reduce((s, i) => s + Number(i.spend || 0), 0);
    const totalConversions = insights.reduce((s, i) => {
      const acts = Array.isArray(i.actions) ? i.actions : [];
      return s + Number(acts.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase' || a.action_type === 'purchase' || a.action_type === 'offsite_conversion')?.value || 0);
    }, 0);
    const totalRevenue = insights.reduce((s, i) => {
      const roas = Number(i.purchase_roas || 0);
      const spend = Number(i.spend || 0);
      return s + (roas > 0 ? roas * spend : 0);
    }, 0);
    const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const blendedCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

    const issues = [];
    const opportunities = [];
    const campaignBriefings = [];

    for (const camp of allCampaigns) {
      const ins = insMap[camp.id] || {};
      const spend = Number(ins.spend || 0);
      const actionsArr = Array.isArray(ins.actions) ? ins.actions : [];
      const conversions = Number(actionsArr.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase' || a.action_type === 'purchase' || a.action_type === 'offsite_conversion')?.value || 0);
      const ctr = Number(ins.ctr || 0);
      const freq = Number(ins.frequency || 0);
      const roas = Number(ins.purchase_roas || 0);
      const reach = Number(ins.reach || 0);
      const impressions = Number(ins.impressions || 0);
      const clicks = Number(ins.clicks || 0);
      const cpa = conversions > 0 ? spend / conversions : 0;
      const cpp = Number(ins.cpp || 0);
      const cpm = Number(ins.cpm || 0);
      const dailyBudget = camp.daily_budget ? Number(camp.daily_budget) : (camp.lifetime_budget ? Number(camp.lifetime_budget) : 0);

      // Presupuesto sin usar (campaña activa con budget pero gasto 0)
      if (camp.status === 'ACTIVE' && dailyBudget > 0 && spend === 0) {
        issues.push({
          severity: 'high',
          type: 'sin_gasto',
          campaign_id: camp.id,
          campaign_name: camp.name,
          message: `Campaña ACTIVA con presupuesto $${dailyBudget}/día pero $0 de gasto en ${datePreset}. Posible ad set sin creativos, audience muy pequeña, o error de entrega.`,
          action: 'Revisar ad sets y creativos. Usar metaAdsManage(list_adsets, campaign_id) y metaAdsReadAds(campaign_id).',
        });
      }

      // CPA alto
      if (spend > 5000 && conversions > 0 && cpa > targetCpa) {
        issues.push({
          severity: 'medium',
          type: 'cpa_alto',
          campaign_id: camp.id,
          campaign_name: camp.name,
          cpa: Math.round(cpa),
          target_cpa: targetCpa,
          message: `CPA de $${Math.round(cpa)} supera el objetivo de $${targetCpa}. Gasto: $${Math.round(spend)}.`,
          action: 'Revisar creativos con metaAdsCreativeDoctor. Considerar pausar si no mejora en 3 días.',
        });
      }

      // CTR bajo
      if (spend > 3000 && ctr > 0 && ctr < 1.0) {
        issues.push({
          severity: 'medium',
          type: 'ctr_bajo',
          campaign_id: camp.id,
          campaign_name: camp.name,
          ctr: ctr,
          message: `CTR de ${ctr.toFixed(2)}% (bajo). El creativo no engancha o la audiencia es muy amplia.`,
          action: 'Mejorar el hook visual de los primeros 3 segundos. Usar metaAdsCreativeDoctor(campaign_id).',
        });
      }

      // Fatiga creativa (frecuencia alta)
      if (freq > 3.0 && spend > 2000) {
        issues.push({
          severity: 'high',
          type: 'fatiga_creativa',
          campaign_id: camp.id,
          campaign_name: camp.name,
          frequency: freq,
          message: `Frecuencia ${freq.toFixed(1)} — fatiga creativa. La audiencia ya vio el anuncio demasiadas veces; el CTR va a caer.`,
          action: 'Renovar creativos YA. Usar metaAdsCreativeDoctor(campaign_id) para generar variantes y metaAdsCreateMultiAd para A/B.',
        });
      }

      // Gasto sin conversiones
      if (spend > 10000 && conversions === 0) {
        issues.push({
          severity: 'high',
          type: 'sin_conversiones',
          campaign_id: camp.id,
          campaign_name: camp.name,
          spend: Math.round(spend),
          message: `$${Math.round(spend)} de gasto con 0 conversiones. Oferta, landing o público desalineados.`,
          action: 'Verificar pixel con metaSetupAudit. Revisar landing URL. Considerar pausar.',
        });
      }

      // Oportunidad: campaña ganadora para escalar
      if (roas > targetRoas && spend > 3000 && camp.status === 'ACTIVE') {
        const suggestedIncrease = Math.round(dailyBudget * 0.3);
        opportunities.push({
          type: 'escalar',
          campaign_id: camp.id,
          campaign_name: camp.name,
          roas: roas,
          current_budget: dailyBudget,
          suggested_budget: dailyBudget + suggestedIncrease,
          suggested_increase: suggestedIncrease,
          message: `ROAS ${roas.toFixed(2)}x (objetivo ${targetRoas}x). Escalar +$${suggestedIncrease}/día.`,
          action: `Subir presupuesto de $${dailyBudget} a $${dailyBudget + suggestedIncrease}/día con metaAdsManage(set_daily_budget). Confirmar con founder.`,
        });
      }

      // Oportunidad: ROAS bueno pero poco gasto
      if (roas > targetRoas && spend > 0 && spend < 5000) {
        opportunities.push({
          type: 'infrainvertida',
          campaign_id: camp.id,
          campaign_name: camp.name,
          roas: roas,
          spend: Math.round(spend),
          message: `ROAS ${roas.toFixed(2)}x con solo $${Math.round(spend)} de gasto. Está infrainvertida.`,
          action: 'Subir presupuesto gradualmente para capturar más volumen.',
        });
      }

      campaignBriefings.push({
        campaign_id: camp.id,
        name: camp.name,
        status: camp.status,
        effective_status: camp.effective_status,
        objective: camp.objective,
        daily_budget_clp: dailyBudget || null,
        spend_clp: Math.round(spend),
        conversions,
        roas: roas > 0 ? Number(roas.toFixed(2)) : null,
        cpa_clp: cpa > 0 ? Math.round(cpa) : null,
        ctr_pct: ctr > 0 ? Number(ctr.toFixed(2)) : null,
        frequency: freq > 0 ? Number(freq.toFixed(1)) : null,
        reach,
        impressions,
        clicks,
        cpm_clp: cpm > 0 ? Math.round(cpm) : null,
        cpp_clp: cpp > 0 ? Math.round(cpp) : null,
        health: camp.status !== 'ACTIVE' ? 'paused' : (roas > targetRoas ? 'winner' : (cpa > targetCpa && conversions > 0 ? 'underperforming' : (spend === 0 ? 'no_spend' : 'monitoring'))),
      });
    }

    // 5 · Fatiga por ad set (detalle)
    const fatiguedAdsets = adsetInsights
      .filter(a => Number(a.frequency || 0) > 3.0 && Number(a.spend || 0) > 2000)
      .map(a => ({
        adset_id: a.adset_id,
        adset_name: a.adset_name,
        frequency: Number(a.frequency).toFixed(1),
        ctr: Number(a.ctr || 0).toFixed(2),
        spend: Math.round(Number(a.spend || 0)),
      }));

    // 6 · Resumen ejecutivo
    const activeCampaigns = allCampaigns.filter(c => c.status === 'ACTIVE').length;
    const pausedWithBudget = allCampaigns.filter(c => c.status === 'PAUSED' && (c.daily_budget || c.lifetime_budget)).length;
    const highSeverity = issues.filter(i => i.severity === 'high').length;

    return Response.json({
      ok: true,
      date_preset: datePreset,
      briefing_at: new Date().toISOString(),
      summary: {
        total_campaigns: allCampaigns.length,
        active_campaigns: activeCampaigns,
        paused_with_budget: pausedWithBudget,
        total_spend_clp: Math.round(totalSpend),
        total_conversions: totalConversions,
        total_revenue_clp: Math.round(totalRevenue),
        blended_roas: Number(blendedRoas.toFixed(2)),
        blended_cpa_clp: blendedCpa > 0 ? Math.round(blendedCpa) : null,
        target_roas: targetRoas,
        target_cpa_clp: targetCpa,
      },
      issues: {
        count: issues.length,
        high_severity: highSeverity,
        items: issues.sort((a, b) => (a.severity === 'high' ? -1 : 1)),
      },
      opportunities: {
        count: opportunities.length,
        items: opportunities,
      },
      fatigued_adsets: fatiguedAdsets,
      campaigns: campaignBriefings.sort((a, b) => b.spend_clp - a.spend_clp),
      recommended_actions: [
        ...(highSeverity > 0 ? [`🚨 ${highSeverity} problema(s) crítico(s) requieren atención HOY.`] : []),
        ...(fatiguedAdsets.length > 0 ? [`🔄 ${fatiguedAdsets.length} ad set(s) con fatiga creativa — renovar creativos.`] : []),
        ...(opportunities.filter(o => o.type === 'escalar').length > 0 ? [`📈 ${opportunities.filter(o => o.type === 'escalar').length} campaña(s) ganadora(s) lista(s) para escalar.`] : []),
        ...(issues.filter(i => i.type === 'sin_gasto').length > 0 ? [`⚠️ ${issues.filter(i => i.type === 'sin_gasto').length} campaña(s) activa(s) sin gasto — revisar entrega.`] : []),
        ...(totalConversions === 0 && totalSpend > 0 ? [`🔴 $${Math.round(totalSpend)} de gasto total con 0 conversiones — posible problema de pixel/tracking.`] : []),
      ],
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});