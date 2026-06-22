import { useState } from 'react';
import { Target, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PropuestaViewerModal from '../PropuestaViewerModal';
import LeadRow from './LeadRow';

// ── Embudo B2B canónico — orden lógico de principio a fin ────────────────
// Nuevo → Contactado → En revisión → Propuesta enviada → Aceptado / Perdido.
const ETAPA_ORDEN = { 'Nuevo': 0, 'Contactado': 1, 'En revisión': 2, 'Propuesta enviada': 3, 'Aceptado': 4, 'Perdido': 5 };

// Pipeline B2B en el chat del agente: cada lead es una fila EXPANDIBLE con todo
// su contacto real (email, teléfono/WhatsApp, RUT, producto) + acción según
// etapa + acceso a su ficha en el embudo. La lógica de cada fila vive en LeadRow.
export default function LeadsCard({ leads = [], onDone }) {
  const [verPropuesta, setVerPropuesta] = useState(null); // { id, titulo }

  if (leads.length === 0) {
    return (
      <div className="ld-glass rounded-2xl p-4 sm:p-5">
        <p className="text-sm text-ld-fg-muted">No hay leads B2B activos.</p>
      </div>
    );
  }

  // Orden lógico: por etapa del embudo y, dentro de la etapa, por score.
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
        <Link to="/admin/pipeline" className="text-xs text-ld-action hover:underline flex items-center gap-0.5">
          Ver embudo <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <p className="text-[10px] text-ld-fg-subtle mb-3">
        Toca un lead para ver su contacto · Nuevo → Contactado → En revisión → Propuesta enviada → Aceptado
      </p>

      <div className="space-y-2.5">
        {ordenados.map((l) => (
          <LeadRow key={l.id} lead={l} onDone={onDone} onVerPropuesta={setVerPropuesta} />
        ))}
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