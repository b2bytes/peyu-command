import { Search, Package, FileText, Users, Briefcase, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ClientVCard from './ClientVCard';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');
const fmtFecha = (d) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }); }
  catch { return ''; }
};

const ESTADO_CLS = {
  Entregado: 'bg-ld-action-soft text-ld-action', Despachado: 'bg-ld-action-soft text-ld-action',
  Aceptada: 'bg-ld-action-soft text-ld-action', Enviada: 'bg-ld-action-soft text-ld-action',
  Cancelado: 'bg-ld-highlight-soft text-ld-highlight', Rechazada: 'bg-ld-highlight-soft text-ld-highlight',
};

const Section = ({ icon: Icon, title, children }) => (
  <div>
    <div className="flex items-center gap-1.5 mb-1.5 px-1">
      <Icon className="w-3.5 h-3.5 text-ld-action" />
      <span className="text-[11px] font-bold text-ld-fg-soft uppercase tracking-wide">{title}</span>
    </div>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const MiniRow = ({ titulo, sub, monto, estado, to }) => {
  const inner = (
    <div className="flex items-center gap-2 rounded-xl bg-ld-bg-soft/60 border border-ld-border px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ld-fg truncate">{titulo}</p>
        {sub && <p className="text-[11px] text-ld-fg-muted truncate">{sub}</p>}
      </div>
      {monto != null && <span className="text-sm font-bold text-ld-fg flex-shrink-0">{fmtCLP(monto)}</span>}
      {estado && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${ESTADO_CLS[estado] || 'bg-ld-bg-elevated text-ld-fg-muted'}`}>{estado}</span>}
      {to && <ChevronRight className="w-4 h-4 text-ld-fg-muted flex-shrink-0" />}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};

// Tarjeta de resultados de la búsqueda universal del Agente OS. Muestra TODO lo
// encontrado por agentOSBuscar agrupado por tipo. Los clientes vienen como
// vCards editables (editar perfil sin salir del chat); el resto como filas con
// CTA a su módulo de admin.
export default function SearchResultsCard({ resultados, onChanged }) {
  const { query, total, clientes = [], pedidos = [], leads = [], cotizaciones = [], propuestas = [] } = resultados || {};

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
          <Search className="w-4 h-4 text-ld-action" />
        </span>
        <span className="text-sm font-semibold text-ld-fg">
          {total > 0 ? `${total} resultado${total > 1 ? 's' : ''}` : 'Sin resultados'} para “{query}”
        </span>
      </div>

      {total === 0 ? (
        <p className="text-sm text-ld-fg-muted">No encontré registros que coincidan. Prueba con el nombre, email, RUT, teléfono o número del pedido/cotización.</p>
      ) : (
        <div className="space-y-4">
          {clientes.length > 0 && (
            <Section icon={Users} title="Clientes">
              {clientes.map((c) => <ClientVCard key={c.id} cliente={c} onChanged={onChanged} />)}
            </Section>
          )}
          {pedidos.length > 0 && (
            <Section icon={Package} title="Pedidos">
              {pedidos.map((p) => (
                <MiniRow key={p.id} titulo={`${p.numero_pedido || p.id?.slice(-6)} · ${p.cliente_nombre || ''}`}
                  sub={`${p.cliente_email || ''}${p.fecha ? ` · ${fmtFecha(p.fecha)}` : ''}`}
                  monto={p.total} estado={p.estado} to="/admin/procesar-pedidos" />
              ))}
            </Section>
          )}
          {leads.length > 0 && (
            <Section icon={Briefcase} title="Leads B2B">
              {leads.map((l) => (
                <MiniRow key={l.id} titulo={`${l.company_name}${l.contact_name ? ` · ${l.contact_name}` : ''}`}
                  sub={`${l.email || 'sin email'} · ${l.phone || 'sin tel'}${l.product_interest ? ` · ${l.product_interest}` : ''}`}
                  estado={l.status} to="/admin/pipeline" />
              ))}
            </Section>
          )}
          {cotizaciones.length > 0 && (
            <Section icon={FileText} title="Cotizaciones">
              {cotizaciones.map((c) => (
                <MiniRow key={c.id} titulo={`${c.numero || c.id?.slice(-6)} · ${c.empresa || ''}`}
                  sub={`${c.sku || ''}${c.cantidad ? ` · ${c.cantidad}u` : ''}${c.contacto ? ` · ${c.contacto}` : ''}`}
                  monto={c.total} estado={c.estado} to="/admin/cotizaciones" />
              ))}
            </Section>
          )}
          {propuestas.length > 0 && (
            <Section icon={FileText} title="Propuestas">
              {propuestas.map((p) => (
                <MiniRow key={p.id} titulo={`${p.numero || p.id?.slice(-6)} · ${p.empresa || ''}`}
                  sub={`${p.contacto || ''}${p.email ? ` · ${p.email}` : ''}`}
                  monto={p.total} estado={p.status} to="/admin/propuestas" />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}