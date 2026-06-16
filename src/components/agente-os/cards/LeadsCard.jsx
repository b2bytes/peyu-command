import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Target, Trash2, CalendarDays, FileText, Eye, Loader2, Phone, ClipboardCheck, CheckCircle2 } from 'lucide-react';
import ActionButton from '../ActionButton';
import PropuestaViewerModal from '../PropuestaViewerModal';
import { fmtFechaCompleta } from '@/lib/fecha-relativa';

const fmtNum = (n) => (n != null ? Number(n).toLocaleString('es-CL') : '—');

// ── Embudo B2B canónico — orden lógico de principio a fin ────────────────
// Nuevo → Contactado → En revisión → Propuesta enviada → Aceptado / Perdido.
// Cada etapa tiene su orden y solo muestra la acción que corresponde avanzar.
const ETAPA_ORDEN = { 'Nuevo': 0, 'Contactado': 1, 'En revisión': 2, 'Propuesta enviada': 3, 'Aceptado': 4, 'Perdido': 5 };
const ETAPA_STYLE = {
  'Nuevo': 'bg-ld-highlight-soft text-ld-highlight',
  'Contactado': 'bg-ld-action-soft text-ld-action',
  'En revisión': 'bg-ld-action-soft text-ld-action',
  'Propuesta enviada': 'bg-ld-action-soft text-ld-action',
  'Aceptado': 'bg-ld-action-soft text-ld-action',
  'Perdido': 'bg-ld-bg-soft text-ld-fg-muted',
};

// Botón "Ver propuesta" — busca la CorporateProposal vinculada al lead
// (b2b_lead_id) y la abre en el visor PDF embebido en el chat.
function VerPropuestaLead({ lead, onOpen }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const ver = async () => {
    setBusy(true);
    setErr('');
    try {
      const props = await base44.entities.CorporateProposal.filter({ b2b_lead_id: lead.id }, '-created_date', 1);
      const prop = props?.[0];
      if (prop?.id) onOpen({ id: prop.id, titulo: `${lead.company_name || ''}${prop.numero ? ` · ${prop.numero}` : ''}` });
      else setErr('Sin propuesta');
    } catch {
      setErr('Error');
    }
    setBusy(false);
  };

  return (
    <button onClick={ver} disabled={busy}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ld-glass-soft text-ld-fg-soft hover:text-ld-fg hover:border-ld-action/50 transition-colors disabled:opacity-60">
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
      {err || 'Ver propuesta'}
    </button>
  );
}

// Pipeline B2B en el río: leads ORDENADOS por etapa del embudo, cada uno con
// la acción que toca según su etapa (no todos los botones siempre). Si ya tiene
// propuesta, se puede ver el PDF; si no, generarla. Datos desde peyuBrainOps.
export default function LeadsCard({ leads = [], onDone }) {
  const [verPropuesta, setVerPropuesta] = useState(null); // { id, titulo }

  if (leads.length === 0) {
    return (
      <div className="ld-glass rounded-2xl p-4 sm:p-5">
        <p className="text-sm text-ld-fg-muted">No hay leads B2B activos.</p>
      </div>
    );
  }

  // Orden lógico: por etapa del embudo y, dentro de la etapa, por score (calientes arriba).
  const ordenados = [...leads].sort((a, b) => {
    const ea = ETAPA_ORDEN[a.status] ?? 9;
    const eb = ETAPA_ORDEN[b.status] ?? 9;
    if (ea !== eb) return ea - eb;
    return (b.lead_score || 0) - (a.lead_score || 0);
  });

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Target className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Leads B2B · embudo</span>
        </div>
        <span className="text-[11px] text-ld-fg-subtle">{leads.length}</span>
      </div>
      {/* Orden del embudo visible — guía al founder sobre el flujo correcto */}
      <p className="text-[10px] text-ld-fg-subtle mb-3">
        Nuevo → Contactado → En revisión → Propuesta enviada → Aceptado
      </p>

      <div className="space-y-2.5">
        {ordenados.map((l) => {
          const etapa = ETAPA_ORDEN[l.status] ?? 0;
          const tienePropuesta = etapa >= 3; // Propuesta enviada o más
          return (
            <div key={l.id} className="rounded-xl px-3 py-2.5 bg-ld-bg-soft/60 border border-ld-border">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ld-fg truncate">{l.company_name || 'Sin empresa'}</div>
                  <div className="text-[11px] text-ld-fg-muted truncate">
                    {l.contact_name || 'N/A'}{l.qty_estimate ? ` · ${fmtNum(l.qty_estimate)}u` : ''}{l.product_interest ? ` · ${l.product_interest}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {l.lead_score != null && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${l.lead_score >= 70 ? 'bg-ld-highlight-soft text-ld-highlight' : 'bg-ld-action-soft text-ld-action'}`}>
                      🔥 {l.lead_score}
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ETAPA_STYLE[l.status] || 'bg-ld-bg-soft text-ld-fg-muted'}`}>{l.status}</span>
                </div>
              </div>
              {/* Fecha precisa: cuándo llegó el lead y por qué canal */}
              {l.created_date && (
                <div className="text-[10px] text-ld-fg-subtle mt-1.5 flex items-center gap-1">
                  <CalendarDays className="w-2.5 h-2.5" /> Llegó {fmtFechaCompleta(l.created_date)}{l.source ? ` · ${l.source}` : ''}
                </div>
              )}

              {/* ── Acción CONTEXTUAL según la etapa del embudo ──────────────── */}
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                {etapa === 0 && (
                  <ActionButton action="updateLeadEstado" payload={{ id: l.id, status: 'Contactado' }} label="Marcar contactado" icon={Phone} confirm={false} onDone={onDone} />
                )}
                {etapa === 1 && (
                  <ActionButton action="updateLeadEstado" payload={{ id: l.id, status: 'En revisión' }} label="Pasar a revisión" icon={ClipboardCheck} confirm={false} onDone={onDone} />
                )}
                {/* En revisión → la acción clave es generar la propuesta */}
                {etapa === 2 && (
                  <ActionButton action="autoCotizarLead" payload={{ id: l.id }} label="Generar propuesta" icon={FileText} variant="primary" confirm={true} onDone={onDone} />
                )}
                {/* Ya tiene propuesta → verla y marcarla aceptada */}
                {tienePropuesta && (
                  <>
                    <VerPropuestaLead lead={l} onOpen={setVerPropuesta} />
                    {l.status === 'Propuesta enviada' && (
                      <ActionButton action="updateLeadEstado" payload={{ id: l.id, status: 'Aceptado' }} label="Marcar aceptado" icon={CheckCircle2} confirm={true} onDone={onDone} />
                    )}
                  </>
                )}
                <ActionButton action="eliminarLead" payload={{ id: l.id }} label="Eliminar" icon={Trash2} confirm={true} onDone={onDone} className="ml-auto bg-ld-highlight-soft text-ld-highlight hover:text-ld-highlight" />
              </div>
            </div>
          );
        })}
      </div>

      {verPropuesta && (
        <PropuestaViewerModal
          proposalId={verPropuesta.id}
          titulo={verPropuesta.titulo}
          onClose={() => setVerPropuesta(null)}
        />
      )}
    </div>
  );
}