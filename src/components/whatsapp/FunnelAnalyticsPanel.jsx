import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, TrendingDown, Globe, MessageCircle } from 'lucide-react';
import { WEB_STAGES, clasificarChatLead } from '@/lib/webchat-pipeline';
import { WA_STAGES } from '@/components/whatsapp/WhatsAppPipeline';
import FunnelStageRow from '@/components/whatsapp/FunnelStageRow';

const DIAS_ESTANCADO = 3;

// Calcula, por etapa: cuántos hay, cuántos llevan +3 días sin avanzar y el
// promedio de días desde el último mensaje.
function resumir(stages, registros, getEtapa) {
  const now = Date.now();
  return stages.map((s) => {
    const items = registros.filter((r) => getEtapa(r) === s.id);
    const dias = items.map((r) => {
      const t = new Date(r.ultimo_mensaje_at || r.created_date || 0).getTime();
      return t ? (now - t) / 86400000 : 0;
    });
    const estancados = dias.filter((d) => d > DIAS_ESTANCADO).length;
    const diasProm = dias.length ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : 0;
    return { ...s, count: items.length, estancados, diasProm };
  });
}

// La etapa más "atascada": la que concentra más conversaciones detenidas y que
// no es la etapa final de conversión.
function cuelloDeBotella(resumen) {
  const candidatas = resumen.filter((s) => s.id !== 'convertido' && s.count > 0);
  if (!candidatas.length) return null;
  return candidatas.sort((a, b) => (b.estancados - a.estancados) || (b.count - a.count))[0].id;
}

export default function FunnelAnalyticsPanel() {
  const [web, setWeb] = useState([]);
  const [wa, setWa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canal, setCanal] = useState('web'); // 'web' | 'whatsapp'

  const load = async () => {
    setLoading(true);
    const [leads, etapas] = await Promise.all([
      base44.entities.ChatLead.list('-ultimo_mensaje_at', 500).catch(() => []),
      base44.entities.WhatsAppConvEtapa.list('-ultimo_mensaje_at', 500).catch(() => []),
    ]);
    setWeb(leads || []);
    setWa(etapas || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resumen = canal === 'web'
    ? resumir(WEB_STAGES, web, clasificarChatLead)
    : resumir(WA_STAGES, wa, (e) => e.etapa);
  const total = resumen.reduce((a, s) => a + s.count, 0);
  const cuello = cuelloDeBotella(resumen);
  const cuelloLabel = resumen.find((s) => s.id === cuello)?.label;
  const convertidos = resumen.find((s) => s.id === 'convertido')?.count || 0;
  const tasa = total ? Math.round((convertidos / total) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full" style={{ background: 'var(--ld-bg-soft)' }}>
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-ld-border bg-ld-bg">
        <TrendingDown className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
        <p className="text-xs font-bold text-ld-fg">Dónde se estancan los clientes</p>

        <div className="ml-auto flex items-center gap-0.5 p-0.5 rounded-full" style={{ background: 'var(--ld-bg-soft)' }}>
          {[
            { id: 'web', label: 'Chat web', icon: Globe },
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCanal(id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${canal === id ? 'text-white' : 'text-ld-fg-muted'}`}
              style={canal === id ? { background: '#8B5CF6' } : undefined}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Actualizar
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 peyu-scrollbar">
        {/* Resumen del canal */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Conversaciones', valor: total },
            { label: 'Convertidas', valor: `${convertidos} (${tasa}%)` },
            { label: 'Se traban en', valor: cuelloLabel || '—' },
          ].map((k) => (
            <div key={k.label} className="rounded-xl p-3" style={{ background: 'var(--ld-bg-elevated)', border: '1px solid var(--ld-border)' }}>
              <p className="text-[10px] text-ld-fg-muted">{k.label}</p>
              <p className="text-sm font-bold text-ld-fg mt-1 truncate">{k.valor}</p>
            </div>
          ))}
        </div>

        {/* Embudo etapa por etapa */}
        <div className="space-y-2">
          {resumen.map((s) => (
            <FunnelStageRow key={s.id} stage={s} total={total} cuello={s.id === cuello} />
          ))}
        </div>

        {cuelloLabel && (
          <p className="text-[11px] text-ld-fg-muted leading-relaxed">
            La mayor pérdida está en <strong className="text-ld-fg">{cuelloLabel}</strong>: ahí es donde el vendedor
            necesita mejor respuesta o un seguimiento más rápido.
          </p>
        )}
      </div>
    </div>
  );
}