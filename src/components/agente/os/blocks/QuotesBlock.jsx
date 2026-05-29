// ============================================================================
// PEYU OS · Tabla de cotizaciones activas, ordenada por urgencia.
// La que vence antes va arriba, en terracota. Acciones reales por fila.
// ============================================================================
import { AlertTriangle, FileText, MessageCircle, Archive, Loader2 } from 'lucide-react';
import { fmtCLP, diasParaVencer } from '../helpers';

export default function QuotesBlock({ cotizaciones, onAction, busyId }) {
  // Ordenar por urgencia: menor días-para-vencer primero (las sin fecha al final)
  const ordenadas = [...cotizaciones]
    .filter((c) => !['Aceptada', 'Rechazada'].includes(c.status))
    .sort((a, b) => {
      const da = diasParaVencer(a.fecha_vencimiento);
      const db = diasParaVencer(b.fecha_vencimiento);
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    })
    .slice(0, 8);

  if (ordenadas.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-[#ece4d8] p-6 text-center text-sm text-[#9aa6a0]">
        No hay cotizaciones activas ahora mismo.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-[#ece4d8] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#f0ebe2] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#6f7d77]">Cotizaciones activas · por urgencia</span>
        <span className="text-[11px] text-[#9aa6a0]">{ordenadas.length}</span>
      </div>
      <div className="divide-y divide-[#f0ebe2]">
        {ordenadas.map((c) => {
          const dias = diasParaVencer(c.fecha_vencimiento);
          const urgente = dias != null && dias >= 0 && dias <= 3;
          const vencida = dias != null && dias < 0;
          const busy = busyId === c.id;
          return (
            <div key={c.id} className={`p-3.5 ${urgente ? 'bg-[#fbeee9]' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {(urgente || vencida) && <AlertTriangle className="w-3.5 h-3.5 text-[#D96B4D] flex-shrink-0" />}
                    <span className="text-sm font-semibold text-[#22302c] truncate">{c.empresa}</span>
                  </div>
                  <div className="text-[11px] text-[#9aa6a0] mt-0.5 truncate">
                    {c.contacto || '—'} · {c.numero || c.id?.slice(-6)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-[#0F8B6C] tabular-nums">{fmtCLP(c.total)}</span>
                    {dias != null && (
                      <span className={`text-[11px] font-medium ${urgente || vencida ? 'text-[#D96B4D]' : 'text-[#9aa6a0]'}`}>
                        {vencida ? `venció hace ${Math.abs(dias)}d` : dias === 0 ? 'vence hoy' : `vence en ${dias}d`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Acciones ejecutables */}
              <div className="flex items-center gap-1.5 mt-2.5">
                <ActionBtn icon={busy ? Loader2 : FileText} spin={busy} primary onClick={() => onAction?.('propuesta', c)}>
                  Generar y enviar
                </ActionBtn>
                <ActionBtn icon={MessageCircle} onClick={() => onAction?.('whatsapp', c)}>WhatsApp</ActionBtn>
                <ActionBtn icon={Archive} onClick={() => onAction?.('archivar', c)}>Archivar</ActionBtn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, children, onClick, primary, spin }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
        primary
          ? 'bg-[#0F8B6C] text-white hover:bg-[#0b6e55]'
          : 'bg-[#f6f1ea] text-[#6f7d77] hover:text-[#22302c] hover:bg-[#efe7da]'
      }`}
    >
      <Icon className={`w-3 h-3 ${spin ? 'animate-spin' : ''}`} />
      {children}
    </button>
  );
}