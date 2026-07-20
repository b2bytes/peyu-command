// ============================================================================
// /fiestas-patrias/kits — Kits de regalo Fiestas Patrias 2026 (reemplaza la
// antigua "canasta"). 15 combinaciones para Casa, Regalo y Empresa.
// Diseño plano Warm Dusk + acentos patrios — sin sombras en botones.
// ============================================================================
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, ArrowRight, Sparkles, Truck, Recycle } from 'lucide-react';
import SEO from '@/components/SEO';
import CountdownDieciocho from '@/components/fiestas/CountdownDieciocho';
import KitCard from '@/components/fiestas/KitCard';
import { KITS_FIESTAS, TAGS_KITS } from '@/lib/fiestas-kits';
import { base44 } from '@/api/base44Client';

export default function FiestasKits() {
  const [tag, setTag] = useState('Todos');

  useEffect(() => {
    try { base44.analytics.track({ eventName: 'fiestas_landing_view', properties: { variante: 'kits' } }); } catch {}
  }, []);

  const kits = useMemo(
    () => (tag === 'Todos' ? KITS_FIESTAS : KITS_FIESTAS.filter((k) => k.tag === tag)),
    [tag]
  );

  return (
    <div className="min-h-screen font-inter" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <SEO
        title="Kits de Regalo Fiestas Patrias 2026 — PEYU Chile 🇨🇱"
        description="15 kits de regalo 100% chilenos y reciclados para el 18: cachos, paletas, posavasos y más, con grabado láser. Para tu casa, para regalar o para tu empresa. Entrega antes del 18 de septiembre."
        canonical="https://peyuchile.cl/fiestas-patrias/kits"
      />

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#FBF5EE 0%,#F6E7DB 60%,#F2D9C9 100%)' }} />
        <div className="absolute top-0 inset-x-0 h-1.5 flex">
          <div className="flex-1" style={{ background: '#0F3D91' }} />
          <div className="flex-1" style={{ background: '#FFFFFF' }} />
          <div className="flex-1" style={{ background: '#D52B1E' }} />
        </div>

        <div className="relative max-w-3xl mx-auto px-5 pt-14 pb-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: 'rgba(168,68,58,.1)', color: '#A8443A' }}>
            <Sparkles className="w-3.5 h-3.5" /> 15 kits · Edición Fiestas Patrias
          </span>
          <h1 className="font-fraunces text-4xl sm:text-5xl leading-[1.05] mb-4">
            Kits de regalo <span style={{ color: '#A8443A' }}>para el 18</span>
          </h1>
          <p className="text-base sm:text-lg max-w-xl mx-auto mb-8" style={{ color: '#7A6050' }}>
            Combinaciones listas para regalar: 100% chilenas, recicladas y con grabado láser.
            Recíbelas <strong style={{ color: '#2C1810' }}>antes del 18</strong>.
          </p>
          <div className="flex justify-center"><CountdownDieciocho /></div>
        </div>
      </section>

      {/* ── FILTRO + GRILLA DE KITS ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-5 py-10">
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {TAGS_KITS.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className="px-5 py-2 rounded-full text-sm font-bold transition-all"
              style={{
                background: tag === t ? '#A8443A' : 'white',
                color: tag === t ? 'white' : '#7A6050',
                border: `1.5px solid ${tag === t ? '#A8443A' : '#D4C4B0'}`,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kits.map((kit) => <KitCard key={kit.id} kit={kit} />)}
        </div>
      </section>

      {/* ── GARANTÍAS ───────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-5 pb-10">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Truck, t: 'Entrega antes del 18' },
            { icon: Recycle, t: '100% reciclado chileno' },
            { icon: Gift, t: 'Grabado láser incluido' },
          ].map(({ icon: Icon, t }) => (
            <div key={t} className="rounded-2xl p-4 text-center" style={{ background: 'white', border: '1px solid #D4C4B0' }}>
              <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: '#C0785C' }} />
              <p className="font-bold text-xs leading-snug">{t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CIERRE ──────────────────────────────────────────────────── */}
      <section className="px-5 pb-20">
        <div className="max-w-3xl mx-auto rounded-3xl p-8 text-center" style={{ background: 'linear-gradient(135deg,#A8443A,#7A2E26)' }}>
          <h2 className="font-fraunces text-2xl sm:text-3xl text-white mb-3">¿Prefieres armarlo tú?</h2>
          <p className="text-sm mb-6" style={{ color: '#F2D9C9' }}>
            Elige tus productos uno a uno en la tienda y personalízalos con grabado láser.
          </p>
          <Link to="/CatalogoNuevo"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold transition-all active:scale-[0.98] hover:brightness-95"
            style={{ background: 'white', color: '#A8443A' }}>
            Ir a la tienda <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}