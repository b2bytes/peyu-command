import { useState } from 'react';
import { Target } from 'lucide-react';
import ChatCardShell from './ChatCardShell';
import PropuestaViewerModal from '../PropuestaViewerModal';
import LeadRow from './LeadRow';

// ── Embudo B2B canónico — orden lógico de principio a fin ────────────────
// Nuevo → Contactado → En revisión → Propuesta enviada → Aceptado / Perdido.
const ETAPA_ORDEN = { 'Nuevo': 0, 'Contactado': 1, 'En revisión': 2, 'Propuesta enviada': 3, 'Aceptado': 4, 'Perdido': 5 };

// Pipeline B2B en el chat: resumen del embudo arriba, leads accionables abajo.
export default function LeadsCard({ leads = [], onDone }) {
  const [verPropuesta, setVerPropuesta] = useState(null); // { id, titulo }

  // Orden lógico: por etapa del embudo y, dentro de la etapa, por score.
  const ordenados = [...leads].sort((a, b) => {
    const ea = ETAPA_ORDEN[a.status] ?? 9;
    const eb = ETAPA_ORDEN[b.status] ?? 9;
    if (ea !== eb) return ea - eb;
    return (b.lead_score || 0) - (a.lead_score || 0);
  });

  const nuevos = ordenados.filter((l) => l.status === 'Nuevo').length;
  const conPropuesta = ordenados.filter((l) => l.status === 'Propuesta enviada').length;

  return (
    <>
      <ChatCardShell
        icon={Target}
        title="Leads B2B · embudo"
        subtitle={ordenados.length ? 'Toca un lead para ver su contacto y actuar' : undefined}
        count={ordenados.length}
        metrics={ordenados.length ? [
          { label: 'Activos', value: ordenados.length },
          { label: 'Nuevos', value: nuevos, tone: nuevos ? 'warn' : undefined },
          { label: 'Con propuesta', value: conPropuesta, tone: 'accent' },
        ] : []}
        items={ordenados}
        renderItem={(l) => <LeadRow key={l.id} lead={l} onDone={onDone} onVerPropuesta={setVerPropuesta} />}
        emptyText="No hay leads B2B activos."
        linkTo="/admin/pipeline"
        linkLabel="Ver embudo"
      />

      {verPropuesta && (
        <PropuestaViewerModal
          proposalId={verPropuesta.id}
          titulo={verPropuesta.titulo}
          onClose={() => setVerPropuesta(null)}
        />
      )}
    </>
  );
}