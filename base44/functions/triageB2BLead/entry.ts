import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * B2B Lead Triage Function
 * 
 * This function automatically processes new B2B leads:
 * 1. Scores the lead based on company data, quantity, urgency signals
 * 2. Routes to appropriate workflow (auto-proposal vs manual review)
 * 3. Generates AI recommendation for sales team
 * 4. Updates lead with routing decision
 * 5. Optionally triggers auto-proposal generation for high-score leads
 */

// Pricing tiers for deal value estimation
const PRODUCT_BASE_PRICES = {
  'Kit Escritorio (5 piezas)': 15000,
  'Posavasos Corporativos': 3500,
  'Maceteros Corporativos': 8000,
  'Cachos / Cubiletes': 5000,
  'Lamparas Corporativas': 25000,
  'Paletas Corporativas': 2500,
  'Otro / Consultar': 5000,
};

function estimateDealValue(product: string, qty: number): number {
  const basePrice = PRODUCT_BASE_PRICES[product] || 5000;
  let discount = 0;
  if (qty >= 500) discount = 0.25;
  else if (qty >= 200) discount = 0.15;
  else if (qty >= 50) discount = 0.08;
  return Math.round(basePrice * (1 - discount) * qty);
}

function calculateLeadScore(lead: any): { score: number; factors: string[] } {
  let score = 10;
  const factors: string[] = [];

  // Quantity scoring (max 40 points)
  const qty = lead.qty_estimate || 0;
  if (qty >= 500) { score += 40; factors.push('+40 qty>=500'); }
  else if (qty >= 200) { score += 30; factors.push('+30 qty>=200'); }
  else if (qty >= 50) { score += 20; factors.push('+20 qty>=50'); }
  else if (qty >= 10) { score += 10; factors.push('+10 qty>=10'); }

  // Contact completeness (max 35 points)
  if (lead.email) { score += 15; factors.push('+15 email'); }
  if (lead.phone) { score += 10; factors.push('+10 phone'); }
  if (lead.rut) { score += 10; factors.push('+10 rut'); }

  // Engagement signals (max 20 points)
  if (lead.logo_url || lead.brief_url) { score += 10; factors.push('+10 logo/brief'); }
  if (lead.personalization_needs) { score += 5; factors.push('+5 personalizacion'); }
  if (lead.delivery_date) { score += 5; factors.push('+5 fecha'); }

  // Sustainability bonus
  if (lead.has_plastic) { score += 5; factors.push('+5 plastico'); }

  return { score: Math.min(score, 100), factors };
}

function determineUrgency(lead: any, aiAnalysis: any): string {
  // Check delivery date
  if (lead.delivery_date) {
    const daysUntil = Math.ceil((new Date(lead.delivery_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 14) return 'Alta';
    if (daysUntil <= 30) return 'Normal';
  }
  
  // Use AI analysis if available
  if (aiAnalysis?.urgency) return aiAnalysis.urgency;
  
  // Default based on quantity
  const qty = lead.qty_estimate || 0;
  if (qty >= 200) return 'Alta';
  if (qty >= 50) return 'Normal';
  return 'Baja';
}

function determineRouting(score: number, qty: number, hasLogo: boolean): { 
  action: string; 
  autoProposal: boolean; 
  assignTo: string;
} {
  // High-value qualified leads: auto-generate proposal
  if (score >= 70 && qty >= 50 && hasLogo) {
    return { 
      action: 'auto_proposal', 
      autoProposal: true, 
      assignTo: 'Carlos' 
    };
  }
  
  // Medium-value leads: flag for quick review
  if (score >= 50 || qty >= 30) {
    return { 
      action: 'quick_review', 
      autoProposal: false, 
      assignTo: 'Equipo Ventas' 
    };
  }
  
  // Low-value leads: standard queue
  return { 
    action: 'standard_queue', 
    autoProposal: false, 
    assignTo: '' 
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId, autoGenerateProposal = true } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'leadId requerido' }, { status: 400 });
    }

    // Get lead
    const leads = await base44.asServiceRole.entities.B2BLead.filter({ id: leadId });
    if (!leads || leads.length === 0) {
      return Response.json({ error: 'Lead no encontrado' }, { status: 404 });
    }
    const lead = leads[0];

    // Calculate score
    const { score, factors } = calculateLeadScore(lead);
    
    // Estimate deal value
    const dealValue = estimateDealValue(lead.product_interest || '', lead.qty_estimate || 0);

    // AI analysis for notes and recommendations
    let aiAnalysis = null;
    if (lead.notes && lead.notes.length > 10) {
      try {
        aiAnalysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Analiza este lead B2B de Peyu (regalos corporativos sustentables):

Empresa: ${lead.company_name}
Contacto: ${lead.contact_name}
Producto: ${lead.product_interest || 'No especificado'}
Cantidad: ${lead.qty_estimate || 'No especificada'}
Fecha requerida: ${lead.delivery_date || 'No especificada'}
Notas: "${lead.notes}"
Tiene logo: ${lead.logo_url ? 'Si' : 'No'}
Tiene plastico: ${lead.has_plastic ? 'Si' : 'No'}

Responde SOLO JSON:
{
  "urgency": "Alta" | "Normal" | "Baja",
  "intent_level": "high" | "medium" | "low",
  "next_action": "string de max 100 chars con accion recomendada para ventas",
  "key_insight": "string de max 80 chars con insight clave del mensaje",
  "objections": "string de max 80 chars con posibles objeciones a anticipar"
}`,
          response_json_schema: {
            type: "object",
            properties: {
              urgency: { type: "string" },
              intent_level: { type: "string" },
              next_action: { type: "string" },
              key_insight: { type: "string" },
              objections: { type: "string" }
            }
          }
        });
      } catch (e) {
        console.error('AI analysis failed:', e);
      }
    }

    // Determine urgency and routing
    const urgency = determineUrgency(lead, aiAnalysis);
    const routing = determineRouting(score, lead.qty_estimate || 0, !!(lead.logo_url || lead.brief_url));

    // Build AI recommendation
    const recommendation = aiAnalysis?.next_action || 
      (score >= 70 ? 'Lead calificado - contactar en <24h con propuesta' :
       score >= 50 ? 'Revisar y solicitar mas detalles del proyecto' :
       'Agregar a nurturing automatico');

    // Update lead with triage results
    await base44.asServiceRole.entities.B2BLead.update(leadId, {
      lead_score: score,
      urgency,
      deal_value: dealValue,
      assigned_to: routing.assignTo || lead.assigned_to,
      ai_recommendation: recommendation,
      status: lead.status === 'Nuevo' ? 'Contactado' : lead.status,
    });

    // Auto-generate proposal for high-score leads with logo
    let proposalResult = null;
    if (autoGenerateProposal && routing.autoProposal && lead.product_interest) {
      try {
        // Get product info to build items
        const products = await base44.asServiceRole.entities.Producto.filter({ 
          nombre: lead.product_interest 
        });
        
        const basePrice = PRODUCT_BASE_PRICES[lead.product_interest] || 5000;
        const items = [{
          nombre: lead.product_interest,
          qty: lead.qty_estimate || 50,
          precio_base: basePrice,
          personalizacion: lead.personalization_needs || false,
        }];

        // Call createCorporateProposal
        proposalResult = await base44.functions.invoke('createCorporateProposal', {
          leadId,
          items,
          notes: lead.notes,
        });

        // Update lead with proposal link
        if (proposalResult?.proposal_id) {
          await base44.asServiceRole.entities.B2BLead.update(leadId, {
            proposal_id: proposalResult.proposal_id,
            status: 'Propuesta enviada',
          });
        }
      } catch (e) {
        console.error('Auto proposal generation failed:', e);
      }
    }

    return Response.json({
      success: true,
      leadId,
      score,
      urgency,
      deal_value: dealValue,
      routing: routing.action,
      assigned_to: routing.assignTo,
      recommendation,
      ai_analysis: aiAnalysis,
      score_factors: factors,
      proposal_generated: !!proposalResult,
      proposal_id: proposalResult?.proposal_id || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
