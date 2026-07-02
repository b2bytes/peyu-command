// ════════════════════════════════════════════════════════════════════════
// /manual-peyu — Manual de Marca de "Peyu", la tortuga mascota de PEYU.
// Estructura de agencia (referencia: manual Zuri FIVB U17 Chile 2026):
// portada → relato → por qué → concepto → paletas → tipografía/formas →
// aplicaciones web → viaje → usos → versión minimalista → gracias.
// Botón "Descargar PDF" genera el manual diseñado (jsPDF, formato slide).
// ════════════════════════════════════════════════════════════════════════
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, Check, X } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import NoIndex from '@/components/NoIndex';
import ManualSlide from '@/components/brand/manual/ManualSlide';
import { generarManualPeyuPDF } from '@/lib/peyu-manual-pdf';
import {
  LOGO_OFICIAL, RELATO, POR_QUE_TORTUGA, POR_QUE_NOMBRE, CONCEPTO,
  PALETA_PRINCIPAL, PALETA_SECUNDARIA, TIPOGRAFIA, FORMAS,
  APLICACIONES, VIAJE, USOS,
} from '@/lib/peyu-brand-manual';

export default function ManualPeyu() {
  const [generating, setGenerating] = useState(false);

  const descargarPDF = async () => {
    setGenerating(true);
    try { await generarManualPeyuPDF(); } finally { setGenerating(false); }
  };

  return (
    <div className="min-h-screen font-inter pb-16" style={{ background: '#062A20' }}>
      <SEOHead title="Manual de Marca · Peyu la Tortuga | PEYU" description="Manual de marca oficial de Peyu, la tortuga mascota de PEYU Chile." url="https://peyuchile.cl/manual-peyu" />
      <NoIndex />

      {/* Header sticky */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(6,42,32,.92)', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ border: '1.5px solid rgba(255,255,255,.2)' }}>
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="font-jakarta font-bold text-sm text-white leading-tight">Manual de Marca · Peyu 🐢</p>
            <p className="text-[10px] font-semibold" style={{ color: '#A7D9C9' }}>La mascota es la marca · Edición 2026</p>
          </div>
          <button
            onClick={descargarPDF}
            disabled={generating}
            className="flex items-center gap-2 h-10 px-4 sm:px-5 rounded-full text-white font-bold text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', boxShadow: '0 6px 20px rgba(15,139,108,.4)' }}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? 'Generando…' : 'Descargar PDF'}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 sm:px-8 pt-6 space-y-6 sm:space-y-8">

        {/* ═══ 01 · PORTADA ═══ */}
        <ManualSlide num={1} center>
          <div className="py-10 sm:py-16 flex flex-col items-center">
            <h1 className="font-jakarta font-extrabold text-3xl sm:text-5xl text-white mb-8">"Peyu" la Mascota de</h1>
            <div className="rounded-3xl px-10 sm:px-16 py-8 sm:py-10" style={{ background: '#F8F3ED' }}>
              <img src={LOGO_OFICIAL} alt="PEYU" className="h-16 sm:h-24 w-auto" draggable={false} />
            </div>
            <p className="mt-8 text-sm sm:text-base font-semibold" style={{ color: '#A7D9C9' }}>Manual de Marca de la Mascota · Edición 2026</p>
            <p className="mt-2 font-fraunces italic text-base sm:text-lg" style={{ color: '#E7D8C6' }}>«Hasta que el plástico deje de ser basura»</p>
          </div>
        </ManualSlide>

        {/* ═══ 02 · RELATO ═══ */}
        <ManualSlide label="Relato Mascota" num={2}>
          <h2 className="font-jakarta font-extrabold text-base sm:text-xl text-white mb-5">{RELATO.titulo}</h2>
          <ul className="space-y-4 max-w-4xl">
            {RELATO.parrafos.map((p, i) => (
              <li key={i} className="flex gap-3 text-sm sm:text-[15px] leading-relaxed" style={{ color: '#EDE7DD' }}>
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ background: '#A7D9C9' }} />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </ManualSlide>

        {/* ═══ 03 · POR QUÉ ═══ */}
        <ManualSlide label="Relato Mascota" num={3}>
          <h2 className="font-jakarta font-extrabold text-base sm:text-xl text-white mb-5">🐢✨ ¿POR QUÉ UNA TORTUGA?</h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {POR_QUE_TORTUGA.map((it) => (
              <div key={it.titulo} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
                <p className="font-bold text-sm mb-1" style={{ color: '#A7D9C9' }}>{it.icono} {it.titulo}</p>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#EDE7DD' }}>{it.texto}</p>
              </div>
            ))}
          </div>
          <h3 className="font-jakarta font-extrabold text-sm sm:text-lg text-white mb-3">¿por qué "Peyu"?</h3>
          <ul className="space-y-2 max-w-3xl">
            {POR_QUE_NOMBRE.map((p, i) => (
              <li key={i} className="flex gap-3 text-xs sm:text-sm" style={{ color: '#EDE7DD' }}>
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: '#D96B4D' }} />
                {p}
              </li>
            ))}
          </ul>
        </ManualSlide>

        {/* ═══ 04 · CONCEPTO ═══ */}
        <ManualSlide label="Concepto Mascota" num={4}>
          <p className="text-sm sm:text-base mb-1" style={{ color: '#EDE7DD' }}><strong className="text-white">Nombre:</strong> {CONCEPTO.nombre}</p>
          <p className="text-sm sm:text-base mb-5" style={{ color: '#EDE7DD' }}><strong className="text-white">Especie:</strong> {CONCEPTO.especie}</p>
          <p className="text-sm sm:text-base leading-relaxed max-w-3xl mb-6" style={{ color: '#EDE7DD' }}>{CONCEPTO.descripcion}</p>
          <p className="font-bold text-white text-sm sm:text-base mb-3">Sus rasgos principales son:</p>
          <ul className="space-y-3">
            {CONCEPTO.rasgos.map((r) => (
              <li key={r.rasgo} className="flex items-center gap-3 text-sm sm:text-base" style={{ color: '#EDE7DD' }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#0F8B6C' }} />
                <strong className="text-white">{r.rasgo}</strong> → {r.arrow}
              </li>
            ))}
          </ul>
        </ManualSlide>

        {/* ═══ 05 · PALETA PRINCIPAL ═══ */}
        <ManualSlide label="Paleta de Colores Mascota" num={5}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="text-[10px] sm:text-xs uppercase tracking-wider" style={{ color: '#A7D9C9' }}>
                  <th className="pb-3 font-bold">Color</th><th className="pb-3 font-bold">Uso</th>
                  <th className="pb-3 font-bold">HEX</th><th className="pb-3 font-bold">RGB</th>
                </tr>
              </thead>
              <tbody>
                {PALETA_PRINCIPAL.map((c) => (
                  <tr key={c.hex} style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
                    <td className="py-3 pr-3">
                      <span className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl flex-shrink-0" style={{ background: c.hex, border: '2px solid rgba(255,255,255,.25)' }} />
                        <span className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">{c.nombre}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-[11px] sm:text-sm" style={{ color: '#EDE7DD' }}>{c.uso}</td>
                    <td className="py-3 pr-3 text-xs sm:text-sm font-mono font-bold text-white">{c.hex}</td>
                    <td className="py-3 text-[11px] sm:text-sm" style={{ color: '#EDE7DD' }}>{c.rgb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ManualSlide>

        {/* ═══ 06 · SECUNDARIOS + TIPOGRAFÍA + FORMAS ═══ */}
        <ManualSlide label="Paleta Secundaria · Tipografía · Formas" num={6}>
          <div className="grid sm:grid-cols-3 gap-3 mb-7">
            {PALETA_SECUNDARIA.map((c) => (
              <div key={c.hex} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
                <span className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: c.hex, border: '2px solid rgba(255,255,255,.25)' }} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{c.nombre} <span className="font-mono text-[10px]" style={{ color: '#A7D9C9' }}>{c.hex}</span></p>
                  <p className="text-[11px]" style={{ color: '#EDE7DD' }}>{c.uso}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="font-jakarta font-extrabold text-white text-sm sm:text-base mb-3">TIPOGRAFÍA</p>
              <ul className="space-y-3">
                {TIPOGRAFIA.map((t) => (
                  <li key={t.fuente} className="text-xs sm:text-sm" style={{ color: '#EDE7DD' }}>
                    <span className={`block text-base sm:text-lg text-white ${t.fuente === 'Fraunces' ? 'font-fraunces italic' : t.fuente === 'Plus Jakarta Sans' ? 'font-jakarta font-extrabold' : 'font-hanken'}`}>{t.fuente}</span>
                    {t.rol}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-jakarta font-extrabold text-white text-sm sm:text-base mb-3">FORMAS</p>
              <ul className="space-y-2">
                {FORMAS.map((f, i) => (
                  <li key={i} className="flex gap-2.5 text-xs sm:text-sm" style={{ color: '#EDE7DD' }}>
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: '#D96B4D' }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ManualSlide>

        {/* ═══ 07 · APLICACIONES ═══ */}
        <ManualSlide label="Aplicaciones en la Web PEYU" num={7}>
          <div className="space-y-3">
            {APLICACIONES.map((a) => (
              <div key={a.donde} className="rounded-2xl px-4 sm:px-5 py-3.5 flex flex-wrap sm:flex-nowrap items-start gap-2 sm:gap-4" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white">{a.donde}</p>
                  <p className="text-xs sm:text-[13px] mt-0.5 leading-relaxed" style={{ color: '#EDE7DD' }}>{a.detalle}</p>
                </div>
                <span className="flex-shrink-0 text-[10px] font-bold px-3 py-1 rounded-full text-white" style={{ background: '#0F8B6C' }}>{a.canal}</span>
              </div>
            ))}
          </div>
        </ManualSlide>

        {/* ═══ 08 · EL VIAJE DE PEYU ═══ */}
        <ManualSlide label="El Viaje de Peyu" num={8}>
          <p className="text-sm sm:text-base mb-6 max-w-3xl" style={{ color: '#EDE7DD' }}>
            Peyu acompaña el recorrido completo del cliente: de visitante a embajador de la marca.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {VIAJE.map((v) => (
              <div key={v.paso} className="rounded-2xl p-4 flex sm:flex-col items-start sm:items-center gap-3 sm:text-center" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
                <span className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: '#0F8B6C' }}>{v.paso}</span>
                <div>
                  <p className="font-jakarta font-extrabold text-sm mb-1" style={{ color: '#A7D9C9' }}>{v.etapa}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#EDE7DD' }}>{v.detalle}</p>
                </div>
              </div>
            ))}
          </div>
        </ManualSlide>

        {/* ═══ 09 · USOS ═══ */}
        <ManualSlide label="Usos Correctos e Incorrectos" num={9}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(15,139,108,.15)', border: '1px solid rgba(167,217,201,.3)' }}>
              <p className="font-jakarta font-extrabold text-lg mb-4" style={{ color: '#A7D9C9' }}>SÍ</p>
              <ul className="space-y-3">
                {USOS.si.map((u, i) => (
                  <li key={i} className="flex gap-2.5 text-xs sm:text-sm" style={{ color: '#EDE7DD' }}>
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#A7D9C9' }} /> {u}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(217,107,77,.14)', border: '1px solid rgba(240,160,140,.3)' }}>
              <p className="font-jakarta font-extrabold text-lg mb-4" style={{ color: '#F0A08C' }}>NO</p>
              <ul className="space-y-3">
                {USOS.no.map((u, i) => (
                  <li key={i} className="flex gap-2.5 text-xs sm:text-sm" style={{ color: '#EDE7DD' }}>
                    <X className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#F0A08C' }} /> {u}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ManualSlide>

        {/* ═══ 10 · VERSIÓN MINIMALISTA ═══ */}
        <ManualSlide label="Mascota · Versión Minimalista" num={10}>
          <div className="grid sm:grid-cols-2 gap-6 items-center">
            <div>
              <p className="font-bold text-sm sm:text-base text-white mb-3 leading-relaxed">
                El logo oficial de Peyu es vectorial: puede utilizarse para la producción de pines, stickers, grabado láser e impresión en distintos formatos.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#EDE7DD' }}>
                Versión monocroma: <strong className="text-white">tinta #2C1810</strong> sobre fondos claros · <strong className="text-white">crema #F8F3ED</strong> sobre fondos oscuros. El punto blanco del ojo siempre visible.
              </p>
            </div>
            <div className="rounded-3xl p-8 sm:p-12 flex items-center justify-center" style={{ background: '#F8F3ED' }}>
              <img src={LOGO_OFICIAL} alt="Peyu versión minimalista" className="w-full max-w-xs h-auto" draggable={false} />
            </div>
          </div>
        </ManualSlide>

        {/* ═══ 11 · GRACIAS ═══ */}
        <ManualSlide num={11} center>
          <div className="py-12 sm:py-20 flex flex-col items-center">
            <h2 className="font-jakarta font-extrabold text-4xl sm:text-6xl text-white mb-8">GRACIAS!!</h2>
            <div className="rounded-3xl px-10 py-7" style={{ background: '#F8F3ED' }}>
              <img src={LOGO_OFICIAL} alt="PEYU" className="h-12 sm:h-16 w-auto" draggable={false} />
            </div>
            <p className="mt-6 text-sm font-semibold" style={{ color: '#A7D9C9' }}>peyuchile.cl · Hasta que el plástico deje de ser basura 🐢</p>
          </div>
        </ManualSlide>
      </div>
    </div>
  );
}