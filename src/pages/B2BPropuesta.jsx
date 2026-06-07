// ════════════════════════════════════════════════════════════════════════
// /b2b/propuesta?id= — Propuesta técnica y económica B2B pública.
// El cliente recibe el link por email, puede aceptar, ajustar o descargar.
// Diseño extraordinario, mobile-first, estilo PEYU Warm Clay.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  CheckCircle2, Clock, FileText, Recycle, ShieldCheck, Truck,
  Loader2, Star, Package, ArrowRight, MessageCircle, Download,
  Leaf, Building2, Zap, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';

const IVA = 0.19;

function StatusBadge({ status }) {
  const cfg = {
    Borrador:   { bg: '#F2ECE2', color: '#A08070', dot: '#C4B09A' },
    Enviada:    { bg: '#EFF9F5', color: '#0F8B6C', dot: '#0F8B6C' },
    Aceptada:   { bg: '#E8F5E9', color: '#2E7D32', dot: '#4CAF50' },
    Rechazada:  { bg: '#FBE9E7', color: '#C62828', dot: '#EF5350' },
    Vencida:    { bg: '#FFF3E0', color: '#E65100', dot: '#FF9800' },
  }[status] || { bg: '#F2ECE2', color: '#A08070', dot: '#C4B09A' };

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {status}
    </span>
  );
}

// eslint-disable-next-line -- Icon is used dynamically via map
function ImpactBar({ qtyTotal }) {
  const kg = Math.round(qtyTotal * 0.05 * 10) / 10;
  const litros = Math.round(qtyTotal * 12.5);
  const tapitas = Math.round(qtyTotal * 8);
  return (
    <div className="rounded-3xl p-6 text-white"
      style={{ background: 'linear-gradient(135deg,#0F8B6C 0%,#0B6E55 100%)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Leaf className="w-5 h-5 text-white/70" />
        <p className="font-bold text-sm tracking-wide uppercase text-white/90">Impacto de tu pedido</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { v: `~${kg}kg`, l: 'plástico rescatado' },
          { v: `${litros.toLocaleString('es-CL')}L`, l: 'agua ahorrada' },
          { v: `~${tapitas.toLocaleString('es-CL')}`, l: 'tapitas transformadas' },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <p className="font-fraunces text-2xl font-bold text-white leading-none mb-1">{s.v}</p>
            <p className="text-[10px] text-white/70 leading-snug">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineaProducto({ linea, idx }) {
  const [open, setOpen] = useState(false);
  const descPct = linea.descuento_pct || linea.ahorro_pct || 0;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE3D6', background: idx % 2 === 0 ? 'white' : '#FAF7F2' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#0F8B6C15' }}>
            <Package className="w-4 h-4" style={{ color: '#0F8B6C' }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: '#2C1810' }}>
              {linea.cantidad || linea.qty}× {linea.nombre || linea.name}
            </p>
            <p className="text-[11px]" style={{ color: '#A08070' }}>
              {fmtCLP(linea.precio_unitario)}/u · {linea.tier || linea.tramo}
              {descPct > 0 && <span className="ml-1.5 text-[#D96B4D]">−{descPct}%</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="font-bold" style={{ color: '#2C1810' }}>
            {fmtCLP(linea.line_total || linea.subtotal)}
          </span>
          {open ? <ChevronUp className="w-4 h-4" style={{ color: '#A08070' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#A08070' }} />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0">
          <div className="h-px mb-3" style={{ background: '#EDE3D6' }} />
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {[
              { l: 'Cantidad', v: `${linea.cantidad || linea.qty} unidades` },
              { l: 'Precio unitario (neto)', v: fmtCLP(linea.precio_unitario) },
              { l: 'Tramo aplicado', v: linea.tier || linea.tramo || '—' },
              { l: 'Subtotal neto', v: fmtCLP(linea.line_total || linea.subtotal) },
              { l: 'Logo láser', v: (linea.cantidad || linea.qty) >= 10 ? '✓ Gratis' : 'Aplica cargo' },
            ].map(({ l, v }) => (
              <div key={l} className="rounded-xl p-2.5" style={{ background: '#F8F3ED' }}>
                <p style={{ color: '#A08070' }}>{l}</p>
                <p className="font-bold mt-0.5" style={{ color: '#2C1810' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AcceptForm({ proposalId, empresa, onDone }) {
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const accept = async () => {
    if (!nombre.trim()) return;
    setLoading(true);
    try {
      await base44.functions.invoke('onProposalAccepted', { proposalId, nombre, cargo });
      setDone(true);
      if (onDone) onDone();
    } catch { /* best-effort */ } finally { setLoading(false); }
  };

  if (done) return (
    <div className="rounded-3xl p-6 text-center" style={{ background: '#EFF9F5', border: '1.5px solid #C8E6DA' }}>
      <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: '#0F8B6C' }} />
      <h3 className="font-fraunces text-xl font-bold mb-1" style={{ color: '#2C1810' }}>¡Propuesta aceptada!</h3>
      <p className="text-sm" style={{ color: '#4B4F54' }}>Nuestro equipo te contactará en las próximas horas para coordinar el anticipo e iniciar producción.</p>
    </div>
  );

  return (
    <div className="rounded-3xl overflow-hidden" style={{ border: '1.5px solid #D4C4B0' }}>
      <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }}>
        <h3 className="font-bold text-white text-base">Aceptar esta propuesta</h3>
        <p className="text-xs text-white/80 mt-0.5">Completa los datos para confirmar y entramos a producción.</p>
      </div>
      <div className="p-5 space-y-3" style={{ background: 'white' }}>
        <div>
          <label className="text-xs font-bold block mb-1.5" style={{ color: '#7A6050' }}>Nombre de quien acepta *</label>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Tu nombre completo"
            className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2"
            style={{ border: '1.5px solid #D4C4B0', color: '#2C1810', background: '#FAF7F2' }}
          />
        </div>
        <div>
          <label className="text-xs font-bold block mb-1.5" style={{ color: '#7A6050' }}>Cargo (opcional)</label>
          <input
            value={cargo}
            onChange={e => setCargo(e.target.value)}
            placeholder="Ej: Jefe de Marketing"
            className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2"
            style={{ border: '1.5px solid #D4C4B0', color: '#2C1810', background: '#FAF7F2' }}
          />
        </div>
        <button
          onClick={accept}
          disabled={loading || !nombre.trim()}
          className="w-full h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', boxShadow: '0 6px 20px rgba(15,139,108,.28)' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Aceptar propuesta y confirmar pedido
        </button>
        <p className="text-[10px] text-center" style={{ color: '#A08070' }}>
          Al aceptar nos comprometemos a coordinar contigo el 50% de anticipo para iniciar producción.
        </p>
      </div>
    </div>
  );
}

export default function B2BPropuesta() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const proposalId = params.get('id');
  const action = params.get('action'); // 'accept' | 'adjust'

  const [prop, setProp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [showAccept, setShowAccept] = useState(action === 'accept');

  useEffect(() => {
    if (!proposalId) { setLoading(false); setError('Sin ID de propuesta.'); return; }
    base44.entities.CorporateProposal.filter({ id: proposalId })
      .then(rows => {
        if (!rows || !rows[0]) { setError('Propuesta no encontrada.'); return; }
        setProp(rows[0]);
        if (rows[0].status === 'Aceptada') setAccepted(true);
      })
      .catch(() => setError('No se pudo cargar la propuesta.'))
      .finally(() => setLoading(false));
  }, [proposalId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F3ED' }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0F8B6C' }} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#F8F3ED' }}>
      <AlertCircle className="w-10 h-10 mb-3" style={{ color: '#D96B4D' }} />
      <p className="font-bold text-center" style={{ color: '#2C1810' }}>{error}</p>
    </div>
  );

  const items = (() => { try { return prop.items_json ? JSON.parse(prop.items_json) : []; } catch { return []; } })();
  const subtotal = prop.subtotal || 0;
  const feePersonalizacion = prop.fee_personalizacion || 0;
  const neto = subtotal + feePersonalizacion;
  const iva = Math.round(neto * IVA);
  const total = prop.total || (neto + iva);
  const qtyTotal = items.reduce((a, l) => a + (l.cantidad || l.qty || 0), 0);
  const hasPersonalizacion = items.some(l => l.personalizacion || l.tipo_personalizacion);
  const vencimiento = prop.fecha_vencimiento
    ? new Date(prop.fecha_vencimiento).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const whatsappMsg = encodeURIComponent(`Hola PEYU, soy de ${prop.empresa}. Quiero avanzar con la propuesta ${prop.numero || ''}.`);

  return (
    <div className="min-h-screen font-inter pb-28 sm:pb-12" style={{ background: '#F8F3ED', color: '#2C1810' }}>

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#0F172A 0%,#0A4A3D 60%,#0F8B6C 100%)' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-12">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <img
              src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
              alt="PEYU"
              className="h-7 w-auto brightness-0 invert object-contain"
            />
            <span className="text-white/60 text-xs font-bold tracking-widest uppercase">· Corporate</span>
          </div>

          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(167,217,201,0.9)' }}>
                Propuesta técnica y económica
              </p>
              <h1 className="font-fraunces text-3xl sm:text-4xl text-white leading-tight mb-2">
                {prop.empresa}
              </h1>
              <p className="text-sm text-white/70">Para: {prop.contacto}</p>
            </div>
            <StatusBadge status={accepted ? 'Aceptada' : prop.status} />
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: FileText, label: 'N° propuesta', val: prop.numero || `—` },
              { icon: Clock, label: 'Lead time', val: `${prop.lead_time_dias || 7} días háb.` },
              { icon: Star, label: 'Validez', val: vencimiento || `${prop.validity_days || 15} días` },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="rounded-2xl px-3 py-3 text-center"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: 'rgba(167,217,201,0.7)' }} />
                <p className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
                <p className="text-xs font-bold text-white leading-tight">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CUERPO ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-2 space-y-4 pt-6">

        {/* Total destacado */}
        <div className="rounded-3xl p-6" style={{ background: 'white', border: '1.5px solid #D4C4B0', boxShadow: '0 8px 32px rgba(44,24,16,.08)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#A08070' }}>Inversión total</p>
          <p className="font-fraunces text-5xl font-bold leading-none mb-1" style={{ color: '#0F8B6C' }}>{fmtCLP(total)}</p>
          <p className="text-xs" style={{ color: '#A08070' }}>CLP · IVA incluido · {qtyTotal.toLocaleString('es-CL')} unidades</p>

          <div className="h-px my-4" style={{ background: '#EDE3D6' }} />

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span style={{ color: '#7A6050' }}>Subtotal neto</span>
              <span className="font-semibold" style={{ color: '#2C1810' }}>{fmtCLP(subtotal)}</span>
            </div>
            {feePersonalizacion > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: '#7A6050' }}>Fee personalización láser</span>
                <span className="font-semibold" style={{ color: '#2C1810' }}>{fmtCLP(feePersonalizacion)}</span>
              </div>
            )}
            {hasPersonalizacion && feePersonalizacion === 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: '#0F8B6C' }}>✓ Logo láser</span>
                <span className="font-bold" style={{ color: '#0F8B6C' }}>GRATIS</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span style={{ color: '#7A6050' }}>IVA (19%)</span>
              <span style={{ color: '#A08070' }}>{fmtCLP(iva)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t" style={{ borderColor: '#EDE3D6', color: '#0F8B6C' }}>
              <span>Total con IVA</span>
              <span>{fmtCLP(total)}</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl flex items-center gap-2.5 text-xs" style={{ background: '#FBE9E1', color: '#D96B4D' }}>
            <Zap className="w-3.5 h-3.5 flex-shrink-0" />
            <span>50% anticipo al confirmar · 50% contra despacho. Factura disponible.</span>
          </div>
        </div>

        {/* Detalle de productos */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 px-1" style={{ color: '#A08070' }}>Detalle del pedido</p>
          <div className="space-y-2">
            {items.map((linea, i) => (
              <LineaProducto key={i} linea={linea} idx={i} />
            ))}
          </div>
        </div>

        {/* Mockups */}
        {Array.isArray(prop.mockup_urls) && prop.mockup_urls.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 px-1" style={{ color: '#A08070' }}>Mockups con tu logo</p>
            <div className="grid grid-cols-2 gap-2.5">
              {prop.mockup_urls.map((url, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden" style={{ border: '1.5px solid #D4C4B0' }}>
                  <img src={url} alt={`Mockup ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impacto ambiental */}
        {qtyTotal > 0 && <ImpactBar qtyTotal={qtyTotal} />}

        {/* Trust badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { IconComp: Recycle, t: '100% Reciclado', s: 'Plástico post-consumo' },
            { IconComp: ShieldCheck, t: '10 años garantía', s: 'Sin preguntas' },
            { IconComp: Zap, t: 'Láser UV gratis', s: 'Desde 10 unidades' },
            { IconComp: Truck, t: 'Despacho Chile', s: 'Vía BlueExpress' },
          ].map(({ IconComp: Icon, t, s }) => (
            <div key={t} className="rounded-2xl p-3 text-center" style={{ background: 'white', border: '1.5px solid #EDE3D6' }}>
              <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: '#0F8B6C' }} />
              <p className="text-[10px] font-bold leading-tight" style={{ color: '#2C1810' }}>{t}</p>
              <p className="text-[9px] mt-0.5" style={{ color: '#A08070' }}>{s}</p>
            </div>
          ))}
        </div>

        {/* Términos */}
        {prop.terms && (
          <div className="rounded-2xl p-4" style={{ background: 'white', border: '1.5px solid #EDE3D6' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#A08070' }}>Condiciones comerciales</p>
            <p className="text-xs leading-relaxed" style={{ color: '#4B4F54' }}>{prop.terms}</p>
          </div>
        )}

        {/* Notas producción */}
        {prop.production_notes && (
          <div className="rounded-2xl p-4" style={{ background: '#FBF7EF', border: '1.5px solid #EDE3D6' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#A08070' }}>Notas de producción</p>
            <p className="text-xs leading-relaxed" style={{ color: '#4B4F54' }}>{prop.production_notes}</p>
          </div>
        )}

        {/* Aceptar propuesta */}
        {!accepted && prop.status !== 'Vencida' && prop.status !== 'Rechazada' && (
          <div>
            {showAccept ? (
              <AcceptForm
                proposalId={proposalId}
                empresa={prop.empresa}
                onDone={() => { setAccepted(true); setShowAccept(false); }}
              />
            ) : (
              <button
                onClick={() => setShowAccept(true)}
                className="w-full h-14 rounded-3xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', boxShadow: '0 8px 28px rgba(15,139,108,.3)' }}
              >
                <CheckCircle2 className="w-5 h-5" /> Aceptar propuesta <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {accepted && (
          <div className="rounded-3xl p-6 text-center" style={{ background: '#EFF9F5', border: '2px solid #0F8B6C' }}>
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2" style={{ color: '#0F8B6C' }} />
            <h3 className="font-fraunces text-xl font-bold mb-1" style={{ color: '#2C1810' }}>¡Propuesta aceptada!</h3>
            <p className="text-sm" style={{ color: '#4B4F54' }}>El equipo PEYU te contactará en las próximas horas para coordinar el inicio de producción.</p>
          </div>
        )}

        {/* CTA WhatsApp + ajustar */}
        {!accepted && (
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`https://wa.me/56935040242?text=${whatsappMsg}`}
              target="_blank" rel="noopener noreferrer"
              className="h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: '#25D366' }}
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a
              href={`mailto:ventas@peyuchile.cl?subject=Ajuste propuesta ${prop.numero || ''}&body=Hola PEYU, quisiera ajustar la propuesta ${prop.numero || ''} de ${prop.empresa}.`}
              className="h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810' }}
            >
              Ajustar propuesta
            </a>
          </div>
        )}

        {/* Firma */}
        <div className="text-center py-4">
          <p className="text-xs" style={{ color: '#A08070' }}>
            PEYU Chile SpA · ventas@peyuchile.cl · +56 9 3504 0242
          </p>
          <p className="text-[10px] mt-1" style={{ color: '#C4B09A' }}>
            Válida hasta: {vencimiento || `${prop.validity_days || 15} días desde la emisión`}
          </p>
        </div>

      </div>

      {/* ── BARRA MOBILE ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-safe px-4 py-3"
        style={{ background: 'rgba(248,243,237,.97)', borderTop: '1.5px solid #D4C4B0', backdropFilter: 'blur(20px)' }}>
        <div className="flex gap-2.5 max-w-lg mx-auto">
          <a
            href={`https://wa.me/56935040242?text=${whatsappMsg}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 h-12 px-4 rounded-2xl text-white font-bold text-sm flex items-center gap-1.5"
            style={{ background: '#25D366' }}
          >
            <MessageCircle className="w-4 h-4" />
          </a>
          {!accepted && prop.status !== 'Vencida' ? (
            <button
              onClick={() => setShowAccept(true)}
              className="flex-1 h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }}
            >
              <CheckCircle2 className="w-4 h-4" /> Aceptar propuesta
            </button>
          ) : (
            <div className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
              style={{ background: accepted ? '#EFF9F5' : '#F2ECE2', color: accepted ? '#0F8B6C' : '#A08070' }}>
              <CheckCircle2 className="w-4 h-4" />
              {accepted ? 'Propuesta aceptada' : prop.status}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}