import { MessageCircle } from 'lucide-react';
import ChatCardShell from './ChatCardShell';
import ConsultaRow from './ConsultaRow';
import { fmtRelativo } from '@/lib/fecha-relativa';

// Consultas SIN RESPONDER con datos reales + respuesta por email en el chat.
export default function ConsultasCard({ consultas = [], onDone }) {
  const calientes = consultas.filter((c) => c.calidad === 'Caliente').length;
  const masAntigua = consultas
    .map((c) => c.created_date)
    .filter(Boolean)
    .sort()[0];

  return (
    <ChatCardShell
      icon={MessageCircle}
      title="Consultas sin responder"
      subtitle={consultas.length ? 'Responde por email sin salir del chat' : undefined}
      count={consultas.length}
      metrics={consultas.length ? [
        { label: 'Pendientes', value: consultas.length, tone: 'warn' },
        { label: 'Calientes', value: calientes, tone: calientes ? 'warn' : undefined },
        { label: 'Más antigua', value: masAntigua ? fmtRelativo(masAntigua) : '—' },
      ] : []}
      items={consultas}
      renderItem={(c) => <ConsultaRow key={c.id} consulta={c} onDone={onDone} />}
      emptyText="No hay consultas sin responder 🎉"
      linkTo="/admin/soporte"
      linkLabel="Ver soporte"
    />
  );
}