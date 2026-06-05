import { Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ClientVCard from './ClientVCard';

// Clientes en la página agente: vCards inteligentes con TODA la info real
// (contacto, RUT, KPIs de compra, NPS, notas). Prioriza la lista enriquecida
// del brain (clientes_top); cae al CRM básico si no hay.
export default function ClientsCard({ clientes = [] }) {
  const lista = clientes.slice(0, 12);

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Users className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Clientes</span>
        </div>
        <Link to="/admin/clientes" className="text-xs text-ld-action hover:underline flex items-center gap-0.5">
          Ver todos <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {lista.length === 0 ? (
        <p className="text-sm text-ld-fg-muted">Sin clientes registrados.</p>
      ) : (
        <div className="space-y-2">
          {lista.map((c) => (
            <ClientVCard key={c.id} cliente={c} />
          ))}
        </div>
      )}
    </div>
  );
}