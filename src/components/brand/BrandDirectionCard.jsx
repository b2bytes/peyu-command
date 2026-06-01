import React, { useState } from 'react';
import { Sun, Moon, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrandSwatches from './BrandSwatches';
import BrandHomeMockup, { PEYU_LOGO } from './BrandHomeMockup';

export default function BrandDirectionCard({ direction, onChoose, choosing }) {
  const [mode, setMode] = useState('dark'); // arranca en oscuro (norte Warm Dusk OS)
  const tokens = direction.tokens || {};
  const palette = tokens.paleta?.[mode] || {};
  const tipografia = tokens.tipografia || {};
  const radios = tokens.radios || {};

  const titularFont = tipografia.titular || 'inherit';
  const cuerpoFont = tipografia.cuerpo || 'inherit';

  return (
    <div className="rounded-3xl overflow-hidden ring-1 ring-black/5 bg-white shadow-sm">
      {/* Encabezado con logo + toggle claro/oscuro */}
      <div
        className="p-5 flex items-start justify-between gap-3 transition-colors duration-300"
        style={{ background: palette.bg, color: palette.text }}
      >
        <div className="min-w-0">
          <img src={PEYU_LOGO} alt="PEYU" className="h-7 w-auto mb-3 object-contain" style={mode === 'dark' ? { filter: 'brightness(0) invert(1)' } : undefined} />
          <h3 className="text-xl font-bold leading-tight" style={{ fontFamily: titularFont }}>
            {direction.nombre}
          </h3>
          <p className="text-xs mt-1 leading-snug" style={{ fontFamily: cuerpoFont, color: palette.muted }}>
            {direction.descripcion}
          </p>
        </div>

        {/* Toggle claro / oscuro */}
        <div
          className="flex-shrink-0 flex items-center gap-0.5 p-0.5 rounded-full"
          style={{ background: palette.surface }}
        >
          <button
            onClick={() => setMode('light')}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={mode === 'light' ? { background: palette.accent } : undefined}
            aria-label="Modo claro"
          >
            <Sun className="w-4 h-4" style={{ color: mode === 'light' ? palette.bg : palette.muted }} />
          </button>
          <button
            onClick={() => setMode('dark')}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={mode === 'dark' ? { background: palette.accent } : undefined}
            aria-label="Modo oscuro"
          >
            <Moon className="w-4 h-4" style={{ color: mode === 'dark' ? palette.bg : palette.muted }} />
          </button>
        </div>
      </div>

      {/* Cuerpo: tipografía + swatches + mockups */}
      <div
        className="p-5 flex flex-col gap-4 transition-colors duration-300"
        style={{ background: palette.bg, color: palette.text }}
      >
        {/* Muestra tipográfica */}
        <div>
          <p className="text-2xl leading-tight" style={{ fontFamily: titularFont, color: palette.text }}>
            Regalos que cuidan el planeta
          </p>
          <p className="text-sm mt-1" style={{ fontFamily: cuerpoFont, color: palette.muted }}>
            Plástico 100% reciclado chileno · Garantía 10 años · Empresa B 🐢
          </p>
          <div className="flex gap-3 mt-2 text-[10px] uppercase tracking-wider" style={{ color: palette.muted }}>
            <span>Titular: {tipografia.titular?.split(',')[0]?.replace(/['"]/g, '') || '—'}</span>
            <span>Cuerpo: {tipografia.cuerpo?.split(',')[0]?.replace(/['"]/g, '') || '—'}</span>
          </div>
        </div>

        {/* Swatches */}
        <BrandSwatches palette={palette} />

        {/* Mockup realista de la HOME conversacional completa (estilo Agent OS) */}
        <BrandHomeMockup palette={palette} tipografia={tipografia} radios={radios} sombras={tokens.sombras} mode={mode} />
      </div>

      {/* CTA */}
      <div className="p-4 bg-white border-t border-black/5">
        {direction.activa ? (
          <div className="flex items-center justify-center gap-2 py-2 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-sm">
            <Check className="w-4 h-4" /> Dirección activa
          </div>
        ) : (
          <Button
            onClick={() => onChoose(direction)}
            disabled={choosing}
            className="w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold h-11"
          >
            {choosing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Elegir esta dirección'}
          </Button>
        )}
      </div>
    </div>
  );
}