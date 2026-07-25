import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import PeyuChatAvatar from '@/components/PeyuChatAvatar';
import GuideMissionRow from '@/components/admin/GuideMissionRow';
import GuideAreaCard from '@/components/admin/GuideAreaCard';
import { GUIDE_AREAS } from '@/lib/peyu-guide-areas';

// ════════════════════════════════════════════════════════════════════════
// PeyuGuide — el avatar que acompaña a fundadores y equipo dentro del admin.
// Al abrirlo dice qué hacer AHORA (misiones reales del negocio) y ofrece 4
// caminos guiados en vez de 80 pantallas. Presente en todo el panel.
// ════════════════════════════════════════════════════════════════════════
export default function PeyuGuide() {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [missions, setMissions] = useState([]);
  const [critical, setCritical] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const me = await base44.auth.me().catch(() => null);
      setNombre((me?.full_name || '').split(' ')[0] || '');
      const r = await base44.functions.invoke('cockpitMissions', {}).catch(() => null);
      const list = r?.data?.missions || [];
      setMissions(list.slice(0, 5));
      setCritical((r?.data?.by_priority?.critical || 0) + (r?.data?.by_priority?.high || 0));
      setLoading(false);
    })();
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Peyu te acompaña — ¿qué hago ahora?"
        className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B4634)', border: '1px solid rgba(255,255,255,.22)' }}
      >
        <span className="relative">
          <PeyuChatAvatar size={34} />
          {critical > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0B4634]">
              {critical}
            </span>
          )}
        </span>
        <span className="text-xs font-bold text-white">
          {critical > 0 ? `${critical} por hacer` : 'Peyu'}
        </span>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] w-[380px] max-w-[calc(100vw-2rem)] max-h-[76vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: 'rgba(4,17,14,.92)', backdropFilter: 'blur(22px)', border: '1px solid rgba(255,255,255,.12)' }}
    >
      {/* Header con el avatar y el saludo */}
      <div className="flex-shrink-0 flex items-center gap-2.5 px-3.5 py-3" style={{ background: 'linear-gradient(135deg,rgba(15,139,108,.45),rgba(11,70,52,.35))', borderBottom: '1px solid rgba(255,255,255,.10)' }}>
        <PeyuChatAvatar size={36} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white leading-none">
            {nombre ? `Hola ${nombre} 🐢` : 'Hola 🐢'}
          </p>
          <p className="text-[10px] text-white/55 mt-0.5">Soy Peyu, te acompaño en el panel</p>
        </div>
        <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white" aria-label="Cerrar">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto peyu-scrollbar-light p-3 space-y-3">
        {/* Qué hacer ahora */}
        <div>
          <p className="text-[9px] uppercase tracking-wider text-white/35 font-bold mb-2">Qué hacer ahora</p>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-white/40 py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Revisando el negocio…
            </div>
          ) : missions.length === 0 ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-200">Todo al día. Aprovecha para crecer 🚀</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {missions.map((m) => (
                <GuideMissionRow key={m.id} mission={m} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          )}
        </div>

        {/* Caminos guiados */}
        <div>
          <p className="text-[9px] uppercase tracking-wider text-white/35 font-bold mb-2">¿Por dónde partir?</p>
          <div className="space-y-1.5">
            {GUIDE_AREAS.map((a) => (
              <GuideAreaCard key={a.id} area={a} onNavigate={() => setOpen(false)} />
            ))}
          </div>
        </div>

        <Link
          to="/admin/agente"
          onClick={() => setOpen(false)}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110"
          style={{ background: 'linear-gradient(135deg,rgba(139,92,246,.28),rgba(15,139,108,.22))', border: '1px solid rgba(139,92,246,.28)' }}
        >
          <Sparkles className="w-3.5 h-3.5" /> Pregúntame lo que sea
        </Link>
      </div>
    </div>
  );
}