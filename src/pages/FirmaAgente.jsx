// ============================================================================
// FirmaAgente · Página PÚBLICA (sin login) que documenta la firma exacta de
// agentOSAction — la función única de escritura del Superagente de Base44 sobre
// las entidades de Peyu. Incluye un botón para descargar TODO en un PDF.
//
// Existe porque el Superagente (WhatsApp/scraper) no puede leer /admin/* (login).
// Esta ruta es pública: el founder la descarga y se la pega al Superagente, o el
// propio agente la lee directo. Solo es documentación de texto — no expone datos
// ni permite escribir nada por sí misma.
// ============================================================================
import { jsPDF } from 'jspdf';
import { Download, Bot, ShieldCheck, FileText } from 'lucide-react';

// Fuente de verdad de la firma. Editar aquí actualiza pantalla Y PDF.
const ACCIONES = [
  { action: 'updatePedidoEstado', payload: '{ id, estado }', desc: 'Cambia el estado de un pedido. estado: "Nuevo" | "Confirmado" | "En Producción" | "Listo para Despacho" | "Despachado" | "Entregado".' },
  { action: 'marcarPedidoPagado', payload: '{ id }', desc: 'Marca un pedido como pagado (payment_status=paid) y lo deja en Confirmado.' },
  { action: 'generarEtiqueta', payload: '{ id }', desc: 'Genera la etiqueta BlueExpress (OT) de un pedido pagado. Devuelve tracking y label_url.' },
  { action: 'generarEtiquetasMasivo', payload: '{ ids?: [] }', desc: 'Genera etiquetas en lote. Sin ids: toma los "Listo para Despacho" pagados sin tracking.' },
  { action: 'cancelarPedido', payload: '{ id, motivo }', desc: 'Cancela un pedido y registra el motivo en su historial.' },
  { action: 'marcarConsultaRespondida', payload: '{ id }', desc: 'Marca una consulta como Respondida.' },
  { action: 'responderConsulta', payload: '{ id, email, asunto, cuerpo }', desc: 'Envía respuesta por Gmail al cliente y marca la consulta como Respondida.' },
  { action: 'updateLeadEstado', payload: '{ id, status }', desc: 'Cambia el estado de un lead B2B. status: "Nuevo" | "Contactado" | "En revisión" | "Propuesta enviada" | "Aceptado" | "Perdido".' },
  { action: 'eliminarLead', payload: '{ id }', desc: 'Elimina un lead B2B.' },
  { action: 'autoCotizarLead', payload: '{ id }', desc: 'Genera automáticamente una propuesta corporativa para el lead y lo pasa a "Propuesta enviada".' },
  { action: 'updatePropuestaEstado', payload: '{ id, status }', desc: 'Cambia el estado de una propuesta. status: "Borrador" | "Enviada" | "Aceptada" | "Rechazada" | "Vencida".' },
  { action: 'enviarPropuesta', payload: '{ proposalId }', desc: 'Genera el PDF y envía la propuesta corporativa por correo.' },
  { action: 'reenviarPropuesta', payload: '{ proposalId }', desc: 'Reenvía una propuesta ya existente por correo.' },
  { action: 'ajustarStock', payload: '{ id, stock_actual }', desc: 'Fija el stock_actual (número) de un producto.' },
  { action: 'updateProducto', payload: '{ id, precio_b2c?, stock_actual?, activo?, imagen_url? }', desc: 'Actualiza campos de un producto (al menos uno). imagen_url debe empezar con http.' },
  { action: 'enviarEmail', payload: '{ to, asunto, cuerpo }', desc: 'Envía un correo libre vía Gmail PEYU.' },
  { action: 'generarImagenProducto', payload: '{ sku, efecto?, formato?, red_social? }', desc: 'Genera una imagen publicitaria IA del producto. Queda como Borrador en Social Studio.' },
  { action: 'generarVideoProducto', payload: '{ sku, efecto?, formato?, duracion? }', desc: 'Genera un video IA del producto. duracion: 4 | 6 | 8.' },
  { action: 'sincronizarTracking', payload: '{ }', desc: 'Sincroniza el tracking BlueExpress de todos los envíos.' },
];

const NOTAS = [
  'Invocación: llama la función backend agentOSAction con el cuerpo { action, payload }. Los campos del payload van ANIDADOS dentro de "payload", NUNCA sueltos en la raíz.',
  'Ejemplo correcto: { "action": "marcarPedidoPagado", "payload": { "id": "abc123" } }.',
  'Ejemplo INCORRECTO: { "action": "update", "id": "abc123" } — será rechazado.',
  'Devuelve siempre { ok: true, message: "..." } en éxito, o { error: "..." } en fallo.',
  'Requiere que el usuario sea admin (role=admin). El Superagente debe actuar como founder.',
  'Para LEER usa peyuBrainOps (métricas/listas) o agentOSBuscar (buscar por nombre/email/RUT/N°). Obtén el "id" real ahí ANTES de escribir.',
  'NUNCA uses update_entities ni create_entity_records sobre entidades de Peyu: no aceptan app_id cruzado. Toda escritura pasa SOLO por agentOSAction.',
];

function buildPdf() {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const M = 40;
  const W = doc.internal.pageSize.getWidth();
  let y = M;

  const line = (txt, size, style = 'normal', color = [20, 30, 28], gap = 4) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const wrapped = doc.splitTextToSize(txt, W - M * 2);
    wrapped.forEach((l) => {
      if (y > doc.internal.pageSize.getHeight() - M) { doc.addPage(); y = M; }
      doc.text(l, M, y);
      y += size + gap;
    });
  };

  doc.setFillColor(15, 139, 108);
  doc.rect(0, 0, W, 64, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Firma de agentOSAction · PEYU', M, 40);
  y = 90;

  line('Función única de ESCRITURA del Superagente sobre las entidades de Peyu (peyuchile.cl).', 11, 'normal', [80, 90, 88], 6);
  line('Cómo invocar', 13, 'bold', [15, 139, 108], 6);
  NOTAS.forEach((n) => line('• ' + n, 10, 'normal', [40, 50, 48], 4));
  y += 8;

  line('Acciones válidas', 13, 'bold', [15, 139, 108], 8);
  ACCIONES.forEach((a) => {
    if (y > doc.internal.pageSize.getHeight() - M - 40) { doc.addPage(); y = M; }
    line(`${a.action}  ${a.payload}`, 11, 'bold', [20, 30, 28], 2);
    line(a.desc, 9.5, 'normal', [80, 90, 88], 6);
  });

  y += 6;
  line(`Generado ${new Date().toLocaleString('es-CL')} · peyuchile.cl/firma-agente`, 8, 'italic', [150, 160, 158], 2);

  doc.save('firma-agentOSAction-peyu.pdf');
}

export default function FirmaAgente() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Firma de agentOSAction</h1>
              <p className="text-sm text-slate-500">La función única de escritura del Superagente sobre Peyu</p>
            </div>
          </div>

          <button
            onClick={buildPdf}
            className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
          >
            <Download className="w-5 h-5" /> Descargar PDF completo
          </button>

          <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
            <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4" /> Cómo invocar
            </p>
            <ul className="space-y-1.5">
              {NOTAS.map((n, i) => (
                <li key={i} className="text-[13px] text-slate-700 leading-snug flex gap-2">
                  <span className="text-emerald-500">•</span> <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 mb-3 text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" /> Acciones válidas ({ACCIONES.length})
          </p>
          <div className="space-y-2.5">
            {ACCIONES.map((a) => (
              <div key={a.action} className="rounded-lg border border-slate-200 p-3">
                <p className="font-mono text-[13px] text-slate-900 font-semibold break-words">
                  {a.action} <span className="text-emerald-600">{a.payload}</span>
                </p>
                <p className="text-[12.5px] text-slate-600 mt-1 leading-snug">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}