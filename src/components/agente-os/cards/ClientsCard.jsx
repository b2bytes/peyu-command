import { Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ClientVCard from './ClientVCard';

// Clientes en la página agente: vCards inteligentes con TODA la info real
// (contacto, RUT, KPIs de compra, NPS, notas). Soporta dos modos: clientes
// nuevos (últimos registrados, con fecha) o top compradores históricos.
export default function ClientsCard({ clientes = [], titulo = 'Clientes', mostrarFecha = false, onChanged }) {
  const lista = clientes.slice(0, 12);

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Users className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">{titulo}</span>
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
            <div key={c.id}>
              {mostrarFecha && c.created_date && (
                <p className="text-[10px] font-bold text-ld-fg-subtle mb-0.5 px-1">
                  Registrado el {new Date(c.created_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              <ClientVCard cliente={c} onChanged={onChanged} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}