import { Pencil, Palette, Upload, Ban, Check } from 'lucide-react';
import { PRECIO_PERSONALIZACION } from '@/lib/personalizacion-config';

// ============================================================================
// PersonalizacionOptionPicker — Selector de las 4 opciones de personalización
// ----------------------------------------------------------------------------
// El cliente elige UNA: frase ($3.990) · diseño PEYU ($4.990) · logo propio
// ($7.990) · sin personalización ($0). Regla: GRATIS desde el MOQ (≥10u).
// Estética Warm Dusk (--ld-*). El control concreto (input/galería/uploader) lo
// renderiza el padre según la opción elegida.
// ============================================================================

const OPCIONES = [
  { id: 'frase',   Icon: Pencil,  label: 'Frase / texto',       sub: 'Tu nombre, empresa o una frase',     fee: PRECIO_PERSONALIZACION.frase },
  { id: 'peyu',    Icon: Palette, label: 'Diseño PEYU',         sub: 'Elige de nuestra galería',           fee: PRECIO_PERSONALIZACION.peyu },
  { id: 'archivo', Icon: Upload,  label: 'Subir mi logo',       sub: 'PNG, SVG o tu archivo',              fee: PRECIO_PERSONALIZACION.archivo },
  { id: 'none',    Icon: Ban,     label: 'Sin personalización', sub: 'Producto tal cual, sin grabado',     fee: 0 },
];

export default function PersonalizacionOptionPicker({ value, onSelect, gratis, moq }) {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 gap-2.5">
        {OPCIONES.map(({ id, Icon, label, sub, fee }) => {
          const sel = value === id;
          const feeLabel = fee === 0
            ? (id === 'none' ? '$0' : 'Incluido')
            : gratis
              ? 'GRATIS'
              : `+$${fee.toLocaleString('es-CL')}`;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`relative flex items-center gap-3.5 p-3.5 rounded-2xl border-2 text-left transition-all ${
                sel
                  ? 'border-ld-action bg-ld-action-soft shadow-lg'
                  : 'border-ld-border bg-ld-glass-soft hover:border-ld-border-strong'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                sel ? 'bg-ld-action text-white' : 'bg-ld-glass text-ld-fg-muted'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-ld-fg">{label}</div>
                <div className="text-[11px] text-ld-fg-muted truncate">{sub}</div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`font-poppins font-bold text-sm ${
                  feeLabel === 'GRATIS' ? 'text-ld-action' : 'text-ld-fg'
                }`}>{feeLabel}</span>
                {sel && (
                  <span className="w-5 h-5 rounded-full bg-ld-action flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-ld-fg-muted text-center">
        Grabado láser UV · <strong className="text-ld-action">Gratis desde {moq} unidades ✓</strong>
      </p>
    </div>
  );
}