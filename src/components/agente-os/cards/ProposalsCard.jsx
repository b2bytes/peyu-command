import { useState } from 'react';
import { FileText } from 'lucide-react';
import ChatCardShell from './ChatCardShell';
import PropuestaViewerModal from '../PropuestaViewerModal';
import ProposalRow from './ProposalRow';

const fmtCompacto = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
};

// Propuestas corporativas pendientes (enviadas sin respuesta) + acciones:
// reenviar / marcar aceptada. Acepta `cotizaciones` (CRM) o `lista` (brain).
export default function ProposalsCard({ cotizaciones = [], lista, onDone }) {
  const [verPropuesta, setVerPropuesta] = useState(null); // { id, titulo }
  const pendientes = lista
    ? lista
    : cotizaciones.filter((c) => c.status === 'Enviada' || c.status === 'Borrador');

  const montoTotal = pendientes.reduce((s, c) => s + (Number(c.total) || 0), 0);
  const enviadas = pendientes.filter((c) => c.status === 'Enviada').length;
  const borradores = pendientes.filter((c) => c.status === 'Borrador').length;

  return (
    <>
      <ChatCardShell
        icon={FileText}
        title="Propuestas pendientes"
        subtitle={pendientes.length ? 'Esperando respuesta del cliente' : undefined}
        count={pendientes.length}
        metrics={pendientes.length ? [
          { label: 'En juego', value: fmtCompacto(montoTotal), tone: 'accent' },
          { label: 'Enviadas', value: enviadas },
          { label: 'Borradores', value: borradores, tone: borradores ? 'warn' : undefined },
        ] : []}
        items={pendientes}
        renderItem={(c) => <ProposalRow key={c.id} propuesta={c} onVer={setVerPropuesta} onDone={onDone} />}
        emptyText="No hay propuestas pendientes."
        linkTo="/admin/propuestas"
        linkLabel="Ver todas"
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