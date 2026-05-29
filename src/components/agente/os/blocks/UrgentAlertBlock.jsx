// ============================================================================
// PEYU OS · Alerta destacada para cotizaciones que vencen pronto.
// Terracota. Botones de acción reales.
// ============================================================================
import { Clock, FileText, MessageCircle, Archive, Loader2 } from 'lucide-react';
import { fmtCLP, diasParaVencer } from '../helpers';

export default function UrgentAlertBlock({ cotizaciones, onAction, busyId }) {
  const porVencer = cotizaciones
    .filter((c) => {
      const d = diasParaVencer(c.fecha_vencimiento);
      return d != null && d >= 0 && d <= 3 && !['Aceptada', 'Rechazada'].includes(c.status);
    })
    .sort((a, b) => diasParaVencer(a.fecha_vencimiento) - diasParaVencer(b.fecha_vencimiento));

  if (porVencer.length === 0) return null;

  return (
    <div className="rounded-2xl bg-[#fbeee9] border border-[#D96B4D]/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#D96B4D]/15 flex items-center justify-center">
          <Clock className="w-4 h-4 text-[#D96B4D]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#22302c] font-poppins">
            {porVencer.length} cotización{porVencer.length > 1 ? 'es' : ''} vence{porVencer.length > 1 ? 'n' : ''} pronto
          </p>
          <p className="text-[11px] text-[#a86a55]">Conviene actuar antes de que expiren</p>
        </div>
      </div>

      <div className="space-y-2">
        {porVencer.slice(0, 4).map((c) => {
          const dias = diasParaVencer(c.fecha_vencimiento);
          const busy = busyId === c.id;
          return (
            <div key={c.id} className="bg-white/70 rounded-xl p-3 border border-[#D96B4D]/15">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#22302c] truncate">{c.empresa}</p>
                  <p className="text-[11px] text-[#D96B4D] font-medium">
                    {dias === 0 ? 'vence hoy' : `vence en ${dias}d`} · {fmtCLP(c.total)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <button
                  onClick={() => onAction?.('propuesta', c)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-[#0F8B6C] text-white hover:bg-[#0b6e55] transition-colors"
                >
                  {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                  Generar propuesta y enviar
                </button>
                <button
                  onClick={() => onAction?.('whatsapp', c)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-white text-[#6f7d77] hover:text-[#22302c] border border-[#e7d8c6] transition-colors"
                >
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </button>
                <button
                  onClick={() => onAction?.('archivar', c)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-white text-[#6f7d77] hover:text-[#22302c] border border-[#e7d8c6] transition-colors"
                >
                  <Archive className="w-3 h-3" /> Archivar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}