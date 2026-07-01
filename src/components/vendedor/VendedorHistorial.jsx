import { getConversationHistory } from '@/lib/vendedor-chat';
import { MessageSquare, Plus, Clock } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// VendedorHistorial — Panel de conversaciones anteriores del chat de Peyu.
// Se muestra al abrir el chat en blanco: permite retomar un hilo previo
// (ordenados por más reciente) o iniciar uno nuevo.
// ════════════════════════════════════════════════════════════════════════

function tiempoRelativo(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export default function VendedorHistorial({ onRetomar, onNuevo }) {
  const historial = getConversationHistory();

  return (
    <div className="px-3.5 lg:px-4 py-4">
      {/* Iniciar nuevo */}
      <button
        onClick={onNuevo}
        className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-[0.98] mb-4"
        style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', boxShadow: '0 6px 18px rgba(15,139,108,.25)' }}
      >
        <Plus className="w-4 h-4" /> Iniciar nueva conversación
      </button>

      {historial.length > 0 && (
        <>
          <p className="text-[11px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: '#A08070' }}>
            <Clock className="w-3 h-3" /> Conversaciones anteriores
          </p>
          <div className="space-y-2">
            {historial.map((h) => (
              <button
                key={h.id}
                onClick={() => onRetomar(h.id)}
                className="w-full text-left px-3.5 py-3 rounded-2xl transition-all hover:shadow-md active:scale-[0.98]"
                style={{ background: 'white', border: '1px solid #E7D8C6' }}
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#EAF3EF' }}>
                    <MessageSquare className="w-4 h-4" style={{ color: '#0F8B6C' }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: '#2C1810' }}>{h.title || 'Conversación'}</p>
                    {h.preview && <p className="text-xs truncate mt-0.5" style={{ color: '#7A6050' }}>{h.preview}</p>}
                    <p className="text-[10px] mt-1" style={{ color: '#A08070' }}>{tiempoRelativo(h.at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}