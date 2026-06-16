import { useState } from 'react';
import { User, Building2, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fmtCLP } from '@/lib/shop-v2-cart';

// ════════════════════════════════════════════════════════════════════════
// IntencionCompraV2 — Detector de intención de compra en la ficha (Shop v2).
// El cliente declara si compra como PERSONA (B2C) o EMPRESA (B2B):
//   · Persona → confirma los beneficios retail por cantidad (2u −10%, etc.).
//   · Empresa → despliega los precios por volumen reales del producto
//     (precio_b2b_tramos) y un acceso directo a la cotización corporativa.
// Solo presentación: no altera precios ni el carrito. Si el producto no tiene
// tramos B2B cargados, el camino empresa lleva igual a la cotización rápida.
// ════════════════════════════════════════════════════════════════════════
const C = {
  action: '#C0785C', fg: '#2C1810', fgSoft: '#7A6050', fgMuted: '#A08070',
  border: '#D4C4B0', green: '#5B7D5A', surface: '#FFFFFF',
};

const TRAMOS_B2B = [
  { key: 'unitario', label: '1 a 9 u' },
  { key: 't10_49', label: '10 a 49 u' },
  { key: 't50_99', label: '50 a 99 u' },
  { key: 't100_249', label: '100 a 249 u' },
  { key: 't250_499', label: '250 a 499 u' },
  { key: 't500_999', label: '500 a 999 u' },
];

export default function IntencionCompraV2({ producto }) {
  const [tipo, setTipo] = useState(null); // null | 'b2c' | 'b2b'

  const tramos = producto?.precio_b2b_tramos && typeof producto.precio_b2b_tramos === 'object'
    ? producto.precio_b2b_tramos : null;
  const filasB2B = tramos
    ? TRAMOS_B2B.map((t) => ({ ...t, valor: Number(tramos[t.key] || 0) })).filter((t) => t.valor > 0)
    : [];

  return (
    <div className="rounded-2xl p-3.5" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
      <p className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: C.fgMuted }}>
        ¿Cómo estás comprando?
      </p>

      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'b2c', icon: User, t: 'Para mí', s: 'Persona' },
          { id: 'b2b', icon: Building2, t: 'Mi empresa', s: 'Por volumen' },
        ].map((o) => {
          const sel = tipo === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setTipo(o.id)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all active:scale-[0.98]"
              style={{
                background: sel ? C.action : 'transparent',
                border: `1.5px solid ${sel ? C.action : C.border}`,
                color: sel ? 'white' : C.fg,
              }}
            >
              <o.icon className="w-4 h-4 flex-shrink-0" style={{ color: sel ? 'white' : C.action }} />
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight">{o.t}</p>
                <p className="text-[10px] leading-tight" style={{ color: sel ? 'rgba(255,255,255,.8)' : C.fgMuted }}>{o.s}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Persona → beneficios retail */}
      {tipo === 'b2c' && (
        <div className="mt-3 space-y-1.5 text-[11px]" style={{ color: C.fgSoft }}>
          {['2 unidades: −10%', '3 a 9 unidades: −15%', 'Desde 10: precio por mayor + grabado gratis'].map((t) => (
            <p key={t} className="flex items-center gap-1.5">
              <Check className="w-3 h-3 flex-shrink-0" style={{ color: C.green }} /> {t}
            </p>
          ))}
        </div>
      )}

      {/* Empresa → precios por volumen reales + CTA cotización */}
      {tipo === 'b2b' && (
        <div className="mt-3">
          {filasB2B.length > 0 ? (
            <div className="rounded-xl overflow-hidden mb-2.5" style={{ border: `1px solid ${C.border}` }}>
              {filasB2B.map((f, i) => (
                <div
                  key={f.key}
                  className="flex items-center justify-between px-3 py-1.5 text-[11px]"
                  style={{ background: i % 2 ? 'rgba(192,120,92,.04)' : 'transparent' }}
                >
                  <span style={{ color: C.fgSoft }}>{f.label}</span>
                  <span className="font-bold" style={{ color: C.fg }}>{fmtCLP(f.valor)} <span className="font-normal" style={{ color: C.fgMuted }}>+IVA c/u</span></span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] mb-2.5" style={{ color: C.fgSoft }}>
              Precios por volumen y logo grabado gratis desde 10 unidades. Pídenos una cotización a tu medida.
            </p>
          )}
          <Link
            to="/EmpresasNuevo"
            className="flex items-center justify-center gap-1.5 w-full h-10 rounded-xl text-white font-bold text-xs transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}
          >
            Cotización para empresas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}