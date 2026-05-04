import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Check } from 'lucide-react';

/**
 * Tarjeta inline de suscripción dentro del chat Peyu.
 * Renderizada por el tag [[NEWSLETTER:segmento]] que el agente puede emitir
 * en momentos estratégicos (cierre B2C, lead B2B capturado, conversación larga).
 *
 * Props:
 *   segmento: 'B2C' | 'B2B' | 'Blog' | 'General'
 */
const COPY = {
  B2C: {
    title: 'Únete al club PEYU 💚',
    sub: 'Drops exclusivos + cupón -10% bienvenida',
    btn: 'Sumarme',
  },
  B2B: {
    title: 'Calendario corporativo PEYU',
    sub: 'Briefs estacionales + casos ESG (1 email/mes)',
    btn: 'Recibir',
  },
  Blog: {
    title: 'Newsletter educativo',
    sub: 'Ideas sostenibles cada 15 días',
    btn: 'Suscribirme',
  },
  General: {
    title: 'Newsletter PEYU',
    sub: '~2 emails al mes, sin spam',
    btn: 'Sumarme',
  },
};

export default function ChatNewsletterCard({ segmento = 'General' }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const cfg = COPY[segmento] || COPY.General;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setLoading(true);
    try {
      await base44.functions.invoke('suscribirNewsletter', {
        email,
        segmento,
        origen: 'chat_agente',
        page_path: typeof window !== 'undefined' ? window.location.pathname : '',
      });
      setDone(true);
    } catch {}
    setLoading(false);
  };

  if (done) {
    return (
      <div className="my-2 bg-green-500/20 border border-green-400/40 rounded-xl px-3 py-2.5 text-xs text-green-100 flex items-center gap-2">
        <Check className="w-3.5 h-3.5" />
        <span>¡Listo! Revisa tu email 💚</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="my-2 bg-gradient-to-br from-pink-500/15 to-teal-500/15 border border-pink-300/30 rounded-xl p-3 backdrop-blur">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-3.5 h-3.5 text-pink-200 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-white leading-tight">{cfg.title}</p>
          <p className="text-[10px] text-white/60 leading-tight">{cfg.sub}</p>
        </div>
      </div>
      <div className="flex gap-1.5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          className="flex-1 h-8 px-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-xs focus:outline-none focus:border-pink-400/60"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-8 px-3 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-[10px] font-bold disabled:opacity-50"
        >
          {loading ? '...' : cfg.btn}
        </button>
      </div>
    </form>
  );
}