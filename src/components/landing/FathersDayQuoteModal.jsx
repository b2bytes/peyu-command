// ============================================================================
// FathersDayQuoteModal · Modal flotante de 2 pasos — Embudo Día del Padre 🇨🇱
// ----------------------------------------------------------------------------
// Blueprint de máxima conversión:
//   Paso 1 → segmentación: ¿regalo para una persona o para tu empresa?
//   Paso 2 → compra rápida según el segmento:
//     • Persona natural → selección express de productos masculinos top +
//       cantidad → directo al carrito (checkout rápido).
//     • Empresa → mini-form (contacto, empresa, email, cantidad) que precarga
//       el flujo B2B Self-Service y salta a personalización.
// Diseño: Liquid Dual (día/noche auto-adaptativo) con acento azul Día del
// Padre. Usa tokens ld-* para contraste correcto en ambos modos.
// No cambia ninguna lógica existente: es un overlay opcional sobre los CTAs.
// ============================================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { getProductImage } from '@/utils/productImages';
import {
  X, ArrowLeft, ArrowRight, User, Building2, Gift, ShoppingCart,
  CheckCircle, Loader2, Sparkles, Truck, Award, Clock, Minus, Plus,
} from 'lucide-react';

// Acento "Día del Padre": azul. Lo aplicamos como detalle (íconos, foco,
// gradiente del CTA), NO como fondo del modal — el fondo lo da el sistema.
const ACCENT = '#0EA5E9';

// Keywords de productos masculinos/escritorio ideales para Día del Padre.
const MASC_KEYWORDS = ['escritorio', 'kit', 'notebook', 'soporte', 'celular', 'cacho', 'jenga', 'lampara', 'lámpara', 'llavero'];

function scoreMasculino(p) {
  const n = `${p.nombre || ''} ${p.categoria || ''}`.toLowerCase();
  return MASC_KEYWORDS.reduce((s, kw) => s + (n.includes(kw) ? 1 : 0), 0);
}

const clp = (n) => `$${Math.round(n || 0).toLocaleString('es-CL')}`;

export default function FathersDayQuoteModal({ open, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [segmento, setSegmento] = useState(null); // 'persona' | 'empresa'

  // Productos para selección express (persona natural)
  const [productos, setProductos] = useState([]);
  const [loadingProds, setLoadingProds] = useState(false);
  const [seleccion, setSeleccion] = useState({}); // { [id]: cantidad }

  // Mini-form empresa
  const [form, setForm] = useState({ contact_name: '', company_name: '', email: '', qty: 20 });

  useEffect(() => {
    if (!open) return;
    // Reset al abrir
    setStep(0);
    setSegmento(null);
    setSeleccion({});
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Cargar productos masculinos top cuando el usuario elige "persona"
  useEffect(() => {
    if (segmento !== 'persona' || productos.length > 0) return;
    setLoadingProds(true);
    base44.entities.Producto.filter({ activo: true })
      .then(list => {
        const ranked = (list || [])
          .filter(p => p.canal !== 'B2B Exclusivo')
          .map(p => ({ ...p, _score: scoreMasculino(p) }))
          .sort((a, b) => b._score - a._score || (b.precio_b2c || 0) - (a.precio_b2c || 0))
          .slice(0, 6);
        setProductos(ranked);
      })
      .finally(() => setLoadingProds(false));
  }, [segmento, productos.length]);

  if (!open) return null;

  const elegirSegmento = (seg) => {
    setSegmento(seg);
    setStep(1);
  };

  // ── Persona natural: agregar al carrito y al checkout ──────────────────
  const totalPersona = productos.reduce((s, p) => s + ((seleccion[p.id] || 0) * (p.precio_b2c || 0)), 0);
  const itemsPersona = Object.values(seleccion).reduce((s, q) => s + q, 0);

  const toggleProd = (p) => {
    setSeleccion(prev => {
      const next = { ...prev };
      if (next[p.id]) delete next[p.id];
      else next[p.id] = 1;
      return next;
    });
  };
  const setQtyProd = (p, delta) => {
    setSeleccion(prev => {
      const cur = prev[p.id] || 0;
      const val = Math.max(0, cur + delta);
      const next = { ...prev };
      if (val === 0) delete next[p.id];
      else next[p.id] = val;
      return next;
    });
  };

  const irAlCarritoPersona = () => {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    productos.forEach(p => {
      const qty = seleccion[p.id];
      if (!qty) return;
      const existing = carrito.find(c => c.sku === p.sku);
      if (existing) existing.cantidad += qty;
      else carrito.push({
        sku: p.sku, nombre: p.nombre, precio: p.precio_b2c || 0,
        cantidad: qty, imagen: getProductImage(p), personalizacion: '',
      });
    });
    localStorage.setItem('carrito', JSON.stringify(carrito));
    window.dispatchEvent(new Event('peyu:cart-added'));
    onClose();
    navigate('/cart');
  };

  // ── Empresa: precargar B2B self-service y saltar a personalización ─────
  const empresaValida = form.contact_name.trim() && form.company_name.trim() && /\S+@\S+\.\S+/.test(form.email);
  const irAB2B = () => {
    try {
      sessionStorage.setItem('peyu_b2b_repeat', JSON.stringify({
        cart: [],
        form: { contact_name: form.contact_name, company_name: form.company_name, email: form.email },
      }));
    } catch { /* noop */ }
    onClose();
    navigate('/b2b/self-service');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} />

      {/* Modal — fondo del sistema (claro en día, oscuro en noche) */}
      <div className="relative w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden ld-glass-strong shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
        {/* Glow decorativo azul (acento, sutil en ambos modos) */}
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: ACCENT }} />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, ${ACCENT}, #2563EB)` }}>
              👔
            </div>
            <div className="min-w-0">
              <p className="text-ld-fg font-poppins font-extrabold text-base leading-none truncate">Regalo Día del Padre</p>
              <p className="text-[11px] text-ld-fg-muted mt-1 leading-none">Domingo 21 de junio · Chile 🇨🇱</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-ld-glass-soft border border-ld-border hover:bg-ld-glass flex items-center justify-center text-ld-fg transition flex-shrink-0" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="relative flex items-center gap-2 px-5 pb-3 flex-shrink-0">
          {[0, 1].map(i => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-ld-border">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: step >= i ? '100%' : '0%', background: ACCENT }} />
            </div>
          ))}
          <span className="text-[10px] font-bold text-ld-fg-muted ml-1 tabular-nums">Paso {step + 1}/2</span>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-y-auto px-5 pb-5 peyu-scrollbar">
          {/* ─── PASO 0 — Segmentación ─── */}
          {step === 0 && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <h3 className="text-ld-fg font-poppins font-bold text-lg leading-tight">
                ¿Para quién es el regalo?
              </h3>
              <p className="text-ld-fg-soft text-sm leading-snug">
                Elige una opción y te llevamos por el camino más rápido para tener su regalo listo a tiempo.
              </p>

              {/* Opción persona */}
              <button
                onClick={() => elegirSegmento('persona')}
                className="w-full text-left p-4 rounded-2xl border-2 border-ld-border bg-ld-bg-soft hover:border-sky-400 hover:bg-ld-bg-elevated transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-ld-fg font-bold text-[15px] flex items-center gap-1.5">
                      Para mi papá / una persona
                      <ArrowRight className="w-4 h-4 text-sky-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </p>
                    <p className="text-ld-fg-muted text-xs mt-1 leading-snug">
                      Compra rápida. Elige el regalo, agrégalo al carrito y listo.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Chip icon={Gift}>Grabado gratis</Chip>
                      <Chip icon={Truck}>Despacho a todo Chile</Chip>
                    </div>
                  </div>
                </div>
              </button>

              {/* Opción empresa */}
              <button
                onClick={() => elegirSegmento('empresa')}
                className="w-full text-left p-4 rounded-2xl border-2 border-ld-border bg-ld-bg-soft hover:border-sky-400 hover:bg-ld-bg-elevated transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-ld-fg font-bold text-[15px] flex items-center gap-1.5">
                      Para mi empresa / equipo
                      <ArrowRight className="w-4 h-4 text-sky-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </p>
                    <p className="text-ld-fg-muted text-xs mt-1 leading-snug">
                      Cotización corporativa con logo, precios por volumen y propuesta al instante.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Chip icon={Award}>Logo láser empresa</Chip>
                      <Chip icon={Sparkles}>Propuesta en 1 min</Chip>
                    </div>
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-ld-fg-muted justify-center pt-1">
                <Clock className="w-3 h-3" />
                <span>Pedidos hasta el 10 de junio para entrega pre-Día del Padre</span>
              </div>
            </div>
          )}

          {/* ─── PASO 1 · PERSONA — selección express ─── */}
          {step === 1 && segmento === 'persona' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
              <h3 className="text-ld-fg font-poppins font-bold text-lg leading-tight">Elige su regalo 🎁</h3>
              <p className="text-ld-fg-soft text-sm leading-snug">Productos favoritos para papá. Toca para agregar y ajusta la cantidad.</p>

              {loadingProds ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-2xl bg-ld-bg-soft border border-ld-border aspect-[4/5] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {productos.map(p => {
                    const qty = seleccion[p.id] || 0;
                    const active = qty > 0;
                    return (
                      <div
                        key={p.id}
                        className={`rounded-2xl overflow-hidden border-2 transition-all ${active ? 'border-sky-400 bg-sky-500/10' : 'border-ld-border bg-ld-bg-soft'}`}
                      >
                        <button onClick={() => toggleProd(p)} className="block w-full relative">
                          <div className="aspect-square bg-ld-bg-soft overflow-hidden">
                            <img src={getProductImage(p)} alt={p.nombre} loading="lazy" className="w-full h-full object-cover" />
                          </div>
                          {active && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center shadow">
                              <CheckCircle className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                        <div className="p-2">
                          <p className="text-ld-fg text-[11px] font-semibold leading-tight line-clamp-2 min-h-[28px]">{p.nombre}</p>
                          <p className="text-sky-500 text-xs font-bold mt-0.5">{clp(p.precio_b2c)}</p>
                          {active && (
                            <div className="flex items-center justify-between mt-1.5 bg-ld-glass-soft border border-ld-border rounded-lg p-0.5">
                              <button onClick={() => setQtyProd(p, -1)} className="w-6 h-6 rounded-md bg-ld-glass hover:bg-ld-bg-elevated flex items-center justify-center text-ld-fg"><Minus className="w-3 h-3" /></button>
                              <span className="text-ld-fg text-xs font-bold tabular-nums">{qty}</span>
                              <button onClick={() => setQtyProd(p, 1)} className="w-6 h-6 rounded-md bg-ld-glass hover:bg-ld-bg-elevated flex items-center justify-center text-ld-fg"><Plus className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── PASO 1 · EMPRESA — mini-form ─── */}
          {step === 1 && segmento === 'empresa' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
              <h3 className="text-ld-fg font-poppins font-bold text-lg leading-tight">Cotización corporativa</h3>
              <p className="text-ld-fg-soft text-sm leading-snug">Déjanos tus datos y armamos tu propuesta con logo y precios por volumen al instante.</p>

              <div className="space-y-2.5">
                <Field label="Tu nombre" value={form.contact_name} onChange={v => setForm({ ...form, contact_name: v })} placeholder="Nombre completo" />
                <Field label="Empresa" value={form.company_name} onChange={v => setForm({ ...form, company_name: v })} placeholder="Nombre de la empresa" />
                <Field label="Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="correo@empresa.cl" />
                <div>
                  <label className="text-[10px] font-bold text-ld-fg-muted uppercase tracking-wider mb-1.5 block">¿Cuántos papás en tu equipo?</label>
                  <div className="flex items-center gap-2">
                    {[10, 20, 50, 100].map(n => (
                      <button
                        key={n}
                        onClick={() => setForm({ ...form, qty: n })}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${form.qty === n ? 'border-sky-400 bg-sky-500/15 text-ld-fg' : 'border-ld-border bg-ld-bg-soft text-ld-fg-muted hover:bg-ld-bg-elevated'}`}
                      >
                        {n}+
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-ld-bg-soft border border-ld-border rounded-2xl p-3 space-y-1.5 mt-1">
                {[
                  { icon: Award, t: 'Grabado láser con el logo de tu empresa' },
                  { icon: Sparkles, t: 'Mockup IA + propuesta PDF en menos de 1 minuto' },
                  { icon: Truck, t: 'Despacho coordinado por oficina o domicilio' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-ld-fg-soft text-xs">
                    <b.icon className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                    <span>{b.t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer / CTA */}
        {step === 1 && (
          <div className="relative flex items-center gap-2 px-5 py-4 border-t border-ld-border flex-shrink-0 bg-ld-bg-soft" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
            <button
              onClick={() => { setStep(0); setSegmento(null); }}
              className="w-11 h-12 rounded-xl bg-ld-glass-soft border border-ld-border hover:bg-ld-glass flex items-center justify-center text-ld-fg transition flex-shrink-0"
              aria-label="Atrás"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {segmento === 'persona' ? (
              <button
                onClick={irAlCarritoPersona}
                disabled={itemsPersona === 0}
                className="flex-1 h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:grayscale shadow-lg"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #2563EB)` }}
              >
                <ShoppingCart className="w-4 h-4" />
                {itemsPersona > 0 ? `Agregar ${itemsPersona} y ver carrito · ${clp(totalPersona)}` : 'Elige al menos un regalo'}
              </button>
            ) : (
              <button
                onClick={irAB2B}
                disabled={!empresaValida}
                className="flex-1 h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:grayscale shadow-lg"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #2563EB)` }}
              >
                <Sparkles className="w-4 h-4" />
                Armar mi propuesta
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ld-fg-soft bg-ld-glass-soft border border-ld-border rounded-full px-2 py-0.5">
      <Icon className="w-2.5 h-2.5" />
      {children}
    </span>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-ld-fg-muted uppercase tracking-wider mb-1.5 block">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl bg-ld-bg-soft border-ld-border text-ld-fg placeholder:text-ld-fg-subtle focus-visible:border-sky-400"
      />
    </div>
  );
}