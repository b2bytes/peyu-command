// ════════════════════════════════════════════════════════════════════════
// webchat-pipeline.js — Clasificación inteligente de las conversaciones del
// vendedor Peyu de la tienda web (agente vendedor_peyu → entidad ChatLead).
// Misma lógica de etapas que el pipeline de WhatsApp, pero leída del avance
// real de la conversación: qué datos entregó el cliente y si convirtió.
// ════════════════════════════════════════════════════════════════════════

export const WEB_STAGES = [
  { id: 'nuevo', label: 'Nuevo', color: '#64748B' },
  { id: 'explorando', label: 'Explorando catálogo', color: '#0EA5E9' },
  { id: 'datos', label: 'Capturando datos', color: '#8B5CF6' },
  { id: 'cotizado', label: 'Cotización B2B', color: '#F59E0B' },
  { id: 'convertido', label: 'Convertido', color: '#10B981' },
  { id: 'abandonado', label: 'Sin respuesta', color: '#EF4444' },
];

const DIAS_ABANDONO = 7;

export function clasificarChatLead(lead) {
  if (!lead) return 'nuevo';

  if (lead.estado === 'Convertido' || lead.convertido_a_pedido_id || lead.convertido_a_b2b_lead_id) {
    return 'convertido';
  }
  if (lead.estado === 'Abandonado' || lead.estado === 'Descartado') return 'abandonado';

  // Inactiva hace más de una semana → se enfrió
  const last = lead.ultimo_mensaje_at ? new Date(lead.ultimo_mensaje_at).getTime() : 0;
  if (last && (Date.now() - last) > DIAS_ABANDONO * 86400000) return 'abandonado';

  const esB2B = lead.tipo === 'B2B' || !!lead.empresa || (lead.cantidad_estimada || 0) >= 10;
  if (esB2B && (lead.empresa || lead.cantidad_estimada)) return 'cotizado';

  const tieneContacto = !!(lead.nombre || lead.email || lead.telefono);
  if (tieneContacto) return 'datos';

  if (lead.producto_interes_sku || lead.producto_interes_nombre) return 'explorando';

  return 'nuevo';
}

// Agrupa los leads en las columnas del kanban, ordenados por actividad.
export function agruparPorEtapa(leads = []) {
  return WEB_STAGES.map((s) => ({
    ...s,
    items: leads
      .filter((l) => clasificarChatLead(l) === s.id)
      .sort((a, b) => new Date(b.ultimo_mensaje_at || b.created_date || 0) - new Date(a.ultimo_mensaje_at || a.created_date || 0)),
  }));
}