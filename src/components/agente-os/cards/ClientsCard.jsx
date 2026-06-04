import { Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Tarjetas de clientes recientes.
export default function ClientsCard({ clientes = [] }) {
  const recientes = clientes.slice(0, 6);

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Users className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Clientes nuevos</span>
        </div>
        <Link to="/admin/clientes" className="text-xs text-ld-action hover:underline flex items-center gap-0.5">
          Ver todos <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {recientes.length === 0 ? (
        <p className="text-sm text-ld-fg-muted">Sin clientes recientes.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {recientes.map((c) => {
            const nombre = c.empresa || c.contacto || c.nombre || 'Cliente';
            return (
              <div key={c.id} className="rounded-xl px-3 py-2.5 bg-ld-bg-soft/60 border border-ld-border flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-ld-action-soft text-ld-action flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {nombre.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ld-fg truncate">{nombre}</div>
                  <div className="text-[11px] text-ld-fg-muted truncate">{c.estado || c.email || ''}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}