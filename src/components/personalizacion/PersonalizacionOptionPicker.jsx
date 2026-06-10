import { Pencil, Palette, Upload, Ban, Check } from 'lucide-react';
import { PRECIO_PERSONALIZACION } from '@/lib/personalizacion-config';

// ============================================================================
// PersonalizacionOptionPicker — Selector de las 4 opciones de personalización
// ----------------------------------------------------------------------------
// El cliente elige UNA: frase ($3.990) · diseño PEYU ($4.990) · logo propio
// ($7.990) · sin personalización ($0). Regla: GRATIS desde el MOQ (≥10u).
// Estética Warm Dusk de ALTO CONTRASTE: cards blancas sólidas sobre crema,
// texto café oscuro, selección terracota. El control concreto (input/galería/
// uploader) lo renderiza el padre según la opción elegida.
// ============================================================================
const W = {
  border: '#D4C4B0',
  fg: '#2C1810',
  fgSoft: '#7A6050',
  action: '#C0785C',
  actionGrad: 'linear-gradient(135deg,#C0785C,#A86440)',
  green: '#5B7D5A',
  iconBg: '#F2EBE0',
};

const OPCIONES = [
  { id: 'frase',   Icon: Pencil,  label: 'Frase / texto',       sub: 'Tu nombre, empresa o una frase',     fee: PRECIO_PERSONALIZACION.frase },
  { id: 'peyu',    Icon: Palette, label: 'Diseño PEYU',         sub: 'Elige de nuestra galería',           fee: PRECIO_PERSONALIZACION.peyu },
  { id: 'archivo', Icon: Upload,  label: 'Subir mi logo',       sub: 'PNG, SVG o tu archivo',              fee: PRECIO_PERSONALIZACION.archivo },
  { id: 'none',    Icon: Ban,     label: 'Sin personalización', sub: 'Producto tal cual, sin grabado',     fee: 0 },
];

export default function PersonalizacionOptionPicker({ value, onSelect, gratis, moq }) {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 gap-2">
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
              className="relative flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all hover:-translate-y-0.5"
              style={{
                border: sel ? `2px solid ${W.action}` : `1.5px solid ${W.border}`,
                background: sel ? 'rgba(192,120,92,.08)' : '#FFFFFF',
                boxShadow: sel ? '0 4px 16px rgba(192,120,92,.20)' : '0 1px 4px rgba(44,24,16,.05)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: sel ? W.actionGrad : W.iconBg,
                  color: sel ? 'white' : W.fgSoft,
                  border: sel ? 'none' : `1px solid ${W.border}`,
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm" style={{ color: W.fg }}>{label}</div>
                <div className="text-[11px] truncate" style={{ color: W.fgSoft }}>{sub}</div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="font-poppins font-bold text-sm"
                  style={{ color: feeLabel === 'GRATIS' ? W.green : sel ? W.action : W.fg }}>
                  {feeLabel}
                </span>
                {sel && (
                  <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: W.action }}>
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-center font-semibold" style={{ color: W.fgSoft }}>
        Grabado láser UV · <strong style={{ color: W.green }}>Gratis desde {moq} unidades ✓</strong>
      </p>
    </div>
  );
}