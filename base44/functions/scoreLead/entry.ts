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

    // AI enhancement for notes/message analysis
    let aiInsights = '';
    let urgency = lead.urgency || 'Normal';

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

    // Update lead
    await base44.asServiceRole.entities.B2BLead.update(leadId, {
      lead_score: score,
      urgency,
      notes: lead.notes ? `${lead.notes}${aiInsights ? `\n\n📋 Acción IA: ${aiInsights}` : ''}` : aiInsights,
    });

    return Response.json({
      lead_score: score,
      urgency,
      qualified: score >= 70,
      next_action: aiInsights,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});