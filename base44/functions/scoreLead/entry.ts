import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'leadId requerido' }, { status: 400 });
    }

    const leads = await base44.asServiceRole.entities.B2BLead.filter({ id: leadId });
    if (!leads || leads.length === 0) {
      return Response.json({ error: 'Lead no encontrado' }, { status: 404 });
    }
    const lead = leads[0];

    // Score rules (deterministic fast path)
    let score = 10;
    const qty = lead.qty_estimate || 0;
    if (qty >= 500) score += 40;
    else if (qty >= 200) score += 30;
    else if (qty >= 50) score += 20;
    else if (qty >= 10) score += 10;
    if (lead.email) score += 15;
    if (lead.phone) score += 10;
    if (lead.rut) score += 10;
    if (lead.personalization_needs) score += 5;
    if (lead.delivery_date) score += 5;
    if (lead.logo_url || lead.brief_url) score += 10;
    if (lead.has_plastic) score += 5;
    score = Math.min(score, 100);

    // AI enhancement: análisis de notas + perfil estratégico de la empresa (web search)
    let aiInsights = '';
    let companyProfile = null;
    let urgency = lead.urgency || 'Normal';

    // ── A) Análisis del mensaje/notas (urgency boost)
    if (lead.notes && lead.notes.length > 10) {
      const aiResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Analiza este mensaje/nota de un lead B2B de Peyu Chile (empresa de regalos corporativos sustentables):

"${lead.notes}"

Empresa: ${lead.company_name || 'N/A'}
Producto: ${lead.product_interest || 'N/A'}
Cantidad: ${qty} unidades
Tiene logo: ${lead.logo_url ? 'Sí' : 'No'}

Responde SOLO un JSON con:
{
  "urgency_boost": 0-15,
  "urgency": "Alta"|"Normal"|"Baja",
  "next_action": "string de máximo 80 caracteres con acción recomendada para el equipo de ventas",
  "insight": "string de máximo 100 caracteres con insight clave del lead"
}

Criterios urgency: Alta si menciona fecha próxima <2 semanas, evento inminente, decisión ya tomada. Baja si solo está explorando.`,
        response_json_schema: {
          type: "object",
          properties: {
            urgency_boost: { type: "number" },
            urgency: { type: "string" },
            next_action: { type: "string" },
            insight: { type: "string" }
          }
        }
      });

      if (aiResult?.urgency_boost) {
        score = Math.min(score + (aiResult.urgency_boost || 0), 100);
        urgency = aiResult.urgency || urgency;
        aiInsights = aiResult.next_action || '';
      }
    }

    // ── B) Perfil estratégico de la empresa (web search) → boost hasta +25 pts
    //    Evalúa: industria, tamaño, fit con PEYU (regalos corporativos sustentables).
    //    Boost alto = empresa grande + industria con presupuesto + foco ESG.
    if (lead.company_name && lead.company_name.length >= 3) {
      try {
        const profileRes = await base44.integrations.Core.InvokeLLM({
          prompt: `Eres analista comercial B2B de PEYU Chile (regalos corporativos en plástico 100% reciclado, hechos en Chile).
Investiga brevemente la empresa "${lead.company_name}" ${lead.rut ? `(RUT ${lead.rut})` : ''} y evalúa su fit como cliente B2B.

Devuelve SOLO un JSON:
{
  "industria": "Tecnología|Retail|Educación|Salud|Finanzas|Gobierno|Horeca|Manufactura|Servicios|Otro",
  "tamaño": "Startup|PyME|Mediana|Grande|Corporación",
  "empleados_estimados": "rango ej. '50-200' o 'desconocido'",
  "fit_peyu": "Alto|Medio|Bajo",
  "razonamiento": "máx 120 caracteres explicando por qué (presupuesto, foco ESG, eventos, etc.)",
  "score_boost": 0-25,
  "alerta": "máx 80 caracteres si hay riesgo (ej: empresa muy pequeña, industria sin presupuesto regalos)"
}

Criterios score_boost:
- 20-25: Corporación/Grande con foco ESG o eventos masivos (ideal PEYU)
- 12-19: Mediana/PyME con presupuesto marketing claro
- 5-11: PyME sin info clara o industria con poco presupuesto regalos
- 0-4: Startup pequeña, persona natural, info insuficiente`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: 'object',
            properties: {
              industria: { type: 'string' },
              tamaño: { type: 'string' },
              empleados_estimados: { type: 'string' },
              fit_peyu: { type: 'string' },
              razonamiento: { type: 'string' },
              score_boost: { type: 'number' },
              alerta: { type: 'string' },
            },
          },
        });

        if (profileRes && typeof profileRes === 'object') {
          companyProfile = profileRes;
          const boost = Math.max(0, Math.min(25, profileRes.score_boost || 0));
          score = Math.min(score + boost, 100);
        }
      } catch (e) {
        // Best-effort: si falla la web search, seguimos con el score actual
        console.warn('[scoreLead] perfil empresa falló:', e.message);
      }
    }

    // Construir notas enriquecidas (acción IA + perfil estratégico)
    const profileBlock = companyProfile
      ? `\n\n🏢 Perfil IA: ${companyProfile.tamaño || '?'} · ${companyProfile.industria || '?'} · Fit ${companyProfile.fit_peyu || '?'} (+${Math.max(0, Math.min(25, companyProfile.score_boost || 0))} pts)\n→ ${companyProfile.razonamiento || ''}${companyProfile.alerta ? `\n⚠️ ${companyProfile.alerta}` : ''}`
      : '';
    const actionBlock = aiInsights ? `\n\n📋 Acción IA: ${aiInsights}` : '';
    const enrichedNotes = `${lead.notes || ''}${actionBlock}${profileBlock}`.trim();

    // Update lead
    await base44.asServiceRole.entities.B2BLead.update(leadId, {
      lead_score: score,
      urgency,
      notes: enrichedNotes,
    });

    return Response.json({
      lead_score: score,
      urgency,
      qualified: score >= 70,
      next_action: aiInsights,
      company_profile: companyProfile,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});