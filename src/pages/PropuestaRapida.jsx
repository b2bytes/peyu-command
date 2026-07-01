// ════════════════════════════════════════════════════════════════════════
// /empresas/propuesta-rapida — Landing B2B de conversión directa.
// DESKTOP: cockpit de 1 pantalla SIN scroll de página (form con scroll propio).
// MOBILE: flujo vertical con scroll normal.
// SEO completo: meta tags + JSON-LD Service (GEO Chile) + en el sitemap.
// ════════════════════════════════════════════════════════════════════════
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import MobileNavBarV2 from '@/components/shopv2/MobileNavBarV2';
import PropuestaRapidaForm from '@/components/b2b/PropuestaRapidaForm';
import {
  ArrowLeft, Building2, Clock, FileText, Sparkles, TrendingDown,
  Recycle, ShieldCheck, Check,
} from 'lucide-react';

const C = {
  bg: '#F8F3ED', border: '#D4C4B0', fg: '#2C1810', fgSoft: '#7A6050',
  fgMuted: '#A08070', action: '#0F8B6C', actionGrad: 'linear-gradient(135deg,#0F8B6C,#0B6E55)',
};

const PASOS = [
  { n: '1', t: 'Cuéntanos qué necesitas', s: 'Tipo de regalo, cantidad exacta y lugar de entrega — 60 segundos.' },
  { n: '2', t: 'Recibe tu propuesta en 24h', s: 'PDF formal con precios netos por volumen y mockup de tu logo.' },
  { n: '3', t: 'Apruébala y producimos', s: 'Grabado láser gratis desde 10u · despacho a todo Chile.' },
];

const TRUST = [
  { icon: TrendingDown, t: 'Hasta −54% por volumen' },
  { icon: Sparkles, t: 'Logo láser gratis desde 10u' },
  { icon: FileText, t: 'Factura empresa' },
  { icon: Recycle, t: '100% plástico reciclado' },
  { icon: ShieldCheck, t: '10 años de garantía' },
];

const CLIENTES = ['Entel', 'Nestlé', 'Metro de Santiago', 'Enel', 'Adidas', 'Santander', 'Siemens', 'DuocUC', 'Zurich', 'Teletón'];

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Propuesta rápida de regalos corporativos reciclados',
  provider: { '@type': 'Organization', name: 'PEYU Chile', url: 'https://peyuchile.cl' },
  serviceType: 'Regalos corporativos sustentables con personalización láser',
  areaServed: { '@type': 'Country', name: 'Chile' },
  url: 'https://peyuchile.cl/empresas/propuesta-rapida',
  description: 'Solicita una propuesta B2B formal en 24h hábiles: regalos corporativos hechos en Chile con plástico 100% reciclado, grabado láser gratis desde 10 unidades, precios por volumen y factura.',
};

export default function PropuestaRapida() {
  // Fondo crema fijo (Warm Dusk): forzamos modo día mientras está abierta.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute('data-liquid-mode');
    html.setAttribute('data-liquid-mode', 'day');
    return () => { if (prev) html.setAttribute('data-liquid-mode', prev); };
  }, []);

  return (
    <div className="min-h-screen font-inter max-w-[100vw] overflow-x-hidden pb-[6.5rem] lg:pb-10" style={{ background: C.bg, color: C.fg }}>
      <SEOHead
        title="Propuesta Rápida B2B en 24h — Regalos Corporativos Reciclados | PEYU"
        description="Solicita tu propuesta corporativa en 60 segundos y recíbela en 24h hábiles: regalos sustentables hechos en Chile con plástico 100% reciclado, logo láser gratis desde 10u, precios por volumen y factura."
        url="https://peyuchile.cl/empresas/propuesta-rapida"
        type="website"
        schema={SCHEMA}
      />

      {/* ── TOP NAV sticky (mismo patrón cockpit B2B) ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(248,243,237,.97)', borderBottom: `1px solid ${C.border}`, boxShadow: '0 1px 10px rgba(44,24,16,.07)' }}>
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-2.5 flex items-center gap-3">
          <Link to="/EmpresasNuevo"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white flex-shrink-0"
            style={{ border: `1.5px solid ${C.border}` }}>
            <ArrowLeft className="w-4 h-4" style={{ color: C.fgSoft }} />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: C.actionGrad }}>
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-poppins font-bold text-sm leading-tight truncate">Propuesta rápida B2B</p>
              <p className="text-[10px] leading-tight font-semibold flex items-center gap-1" style={{ color: C.action }}>
                <Clock className="w-3 h-3" /> Respuesta en 24h hábiles
              </p>
            </div>
          </div>
          <Link to="/EmpresasNuevo" className="ml-auto hidden sm:block text-xs font-bold underline flex-shrink-0" style={{ color: C.fgSoft }}>
            Prefiero explorar el catálogo →
          </Link>
        </div>
      </header>

      {/* ── BODY DESKTOP: ancho completo, flujo natural (en pantallas normales
          cabe sin scroll; si la pantalla es baja, la página scrollea sin
          cortar nada). ── */}
      <div className="hidden lg:flex w-full max-w-[1600px] mx-auto px-10 xl:px-16 py-8 gap-12 xl:gap-20 items-start">

        {/* Izquierda: hero + pasos + confianza */}
        <div className="w-[48%] flex-shrink-0 lg:sticky lg:top-20">
          <div className="space-y-6">
            <div>
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-lg mb-3" style={{ background: C.action, color: 'white' }}>
                ⚡ La vía rápida para empresas
              </span>
              <h1 className="font-fraunces text-4xl xl:text-5xl 2xl:text-6xl leading-[1.05] font-bold mb-3">
                Tu propuesta corporativa
                <br /><span style={{ color: C.action }}>lista en 24 horas</span>
              </h1>
              <p className="text-sm xl:text-base leading-relaxed font-semibold max-w-lg" style={{ color: C.fgSoft }}>
                Sin navegar catálogos: dinos qué necesitas y nuestro equipo B2B arma tu
                propuesta formal con precios netos, mockup de tu logo y plazos reales.
              </p>
            </div>

            {/* Pasos compactos */}
            <div className="space-y-2 xl:space-y-2.5">
              {PASOS.map((p) => (
                <div key={p.n} className="flex items-start gap-3 rounded-2xl px-4 py-3" style={{ background: 'white', border: `1.5px solid ${C.border}` }}>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0" style={{ background: C.actionGrad }}>
                    {p.n}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm xl:text-base font-bold leading-tight">{p.t}</p>
                    <p className="text-xs xl:text-sm mt-0.5" style={{ color: C.fgSoft }}>{p.s}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust chips */}
            <div className="flex flex-wrap gap-1.5">
              {TRUST.map(({ icon: Icon, t }) => (
                <span key={t} className="flex items-center gap-1.5 text-[11px] xl:text-xs font-bold px-2.5 py-1.5 rounded-full" style={{ background: 'white', border: `1px solid ${C.border}`, color: C.fgSoft }}>
                  <Icon className="w-3 h-3" style={{ color: C.action }} /> {t}
                </span>
              ))}
            </div>

            {/* Clientes */}
            <div className="pt-1">
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: C.fgMuted }}>Confían en PEYU</p>
              <div className="flex flex-wrap gap-1.5">
                {CLIENTES.map((c) => (
                  <span key={c} className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'white', border: `1px solid ${C.border}`, color: C.fgSoft }}>
                    <Check className="w-2.5 h-2.5" style={{ color: C.action }} /> {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Derecha: formulario a todo el ancho restante */}
        <div className="flex-1 min-w-0 flex justify-center">
          <div className="w-full max-w-2xl">
            <PropuestaRapidaForm />
          </div>
        </div>
      </div>

      {/* ── BODY MOBILE: flujo vertical con scroll normal ── */}
      <div className="lg:hidden w-full max-w-2xl mx-auto px-4 pt-5 min-w-0 overflow-x-hidden">
        <div className="mb-5">
          <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-lg mb-2.5" style={{ background: C.action, color: 'white' }}>
            ⚡ La vía rápida para empresas
          </span>
          <h1 className="font-fraunces text-3xl leading-[1.08] font-bold mb-2">
            Tu propuesta corporativa
            <br /><span style={{ color: C.action }}>lista en 24 horas</span>
          </h1>
          <p className="text-[13px] leading-relaxed font-semibold" style={{ color: C.fgSoft }}>
            Cuéntanos qué necesitas en 60 segundos y recibe tu propuesta formal con precios netos y mockup de tu logo.
          </p>
        </div>

        <PropuestaRapidaForm />

        {/* Pasos */}
        <div className="space-y-2 mt-6">
          {PASOS.map((p) => (
            <div key={p.n} className="flex items-start gap-3 rounded-2xl px-3.5 py-2.5" style={{ background: 'white', border: `1.5px solid ${C.border}` }}>
              <span className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0" style={{ background: C.actionGrad }}>
                {p.n}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight">{p.t}</p>
                <p className="text-xs mt-0.5" style={{ color: C.fgSoft }}>{p.s}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust + clientes */}
        <div className="flex flex-wrap gap-1.5 mt-5">
          {TRUST.map(({ icon: Icon, t }) => (
            <span key={t} className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full" style={{ background: 'white', border: `1px solid ${C.border}`, color: C.fgSoft }}>
              <Icon className="w-3 h-3" style={{ color: C.action }} /> {t}
            </span>
          ))}
        </div>
        <div className="mt-6">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2 text-center" style={{ color: C.fgMuted }}>Confían en PEYU</p>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {CLIENTES.map((c) => (
              <span key={c} className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'white', border: `1px solid ${C.border}`, color: C.fgSoft }}>
                {c}
              </span>
            ))}
          </div>
        </div>

        <footer className="mt-8 pt-4 text-center text-[9px] flex items-center justify-center gap-2" style={{ borderTop: `1.5px solid ${C.border}`, color: C.fgMuted }}>
          <Recycle className="w-3 h-3 flex-shrink-0" style={{ color: '#8BAD8A' }} />
          <span className="font-semibold">PEYU · Plástico 100% reciclado · Santiago 🇨🇱</span>
        </footer>
      </div>

      <MobileNavBarV2 />
    </div>
  );
}