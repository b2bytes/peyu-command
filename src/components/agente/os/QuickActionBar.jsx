// ============================================================================
// PEYU OS · Barra de acciones rápidas (sobre el chat)
// Dos atajos de 1 clic: generar cotización y crear orden de producción.
// Cada uno abre un mini-modal con los campos mínimos. Estética papel cálida,
// verde solo en acentos, sin pestañas.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, Factory, X, Loader2, Zap, Package, Truck, CreditCard, RefreshCw } from 'lucide-react';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-[#6f7d77] uppercase tracking-wide">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  'w-full h-10 rounded-xl bg-[#f6f1ea] border border-[#e7d8c6] px-3 text-sm text-[#22302c] placeholder:text-[#9aa6a0] focus:outline-none focus:border-[#0F8B6C]/50 transition';

function Modal({ title, icon: Icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#22302c]/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-[#ece7df] shadow-2xl p-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#0F8B6C]/10 flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-[#0F8B6C]" />
            </div>
            <h3 className="font-poppins font-bold text-[#22302c]">{title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-[#f6f1ea] flex items-center justify-center text-[#6f7d77]" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function QuickActionBar({ productos = [], pedidos = [], onCreateQuote, onCreateOP, onPedidosRefresh }) {
  const [open, setOpen] = useState(null); // 'quote' | 'op' | 'etiqueta' | 'pagar' | 'sync'
  const [busy, setBusy] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

  // ── Cotización ──
  const [q, setQ] = useState({ empresa: '', contacto: '', email: '', sku: '', cantidad: 50 });
  // ── Orden de producción ──
  const [op, setOp] = useState({ empresa: '', sku: '', cantidad: 100, prioridad: 'Normal' });
  // ── Bluexpress ──
  const [bx, setBx] = useState({ pedidoId: '', accion: '' });

  const submitQuote = async () => {
    if (!q.empresa.trim() || !q.sku) return;
    setBusy(true);
    await onCreateQuote(q);
    setBusy(false);
    setOpen(null);
    setQ({ empresa: '', contacto: '', email: '', sku: '', cantidad: 50 });
  };

  const submitOP = async () => {
    if (!op.empresa.trim() || !op.sku) return;
    setBusy(true);
    await onCreateOP(op);
    setBusy(false);
    setOpen(null);
    setOp({ empresa: '', sku: '', cantidad: 100, prioridad: 'Normal' });
  };

  const pedidosPendientes = (pedidos || []).filter(p => !['Entregado', 'Cancelado'].includes(p.estado));
  const pedidosSinTracking = pedidosPendientes.filter(p => !p.tracking);

  const submitBluexWith = async (accion) => {
    setBusy(true);
    setResultMsg('');
    try {
      const res = await base44.functions.invoke('agentOSAction', {
        action: accion === 'pagar' ? 'marcarPedidoPagado'
               : accion === 'etiqueta' ? 'generarEtiqueta'
               : accion === 'cancelar' ? 'cancelarPedido'
               : 'sincronizarTracking',
        payload: accion === 'sync' ? {} : { id: bx.pedidoId },
      });
      setResultMsg(res?.data?.message || 'Acción completada ✓');
      if (onPedidosRefresh) onPedidosRefresh();
    } catch (e) {
      setResultMsg(`Error: ${e?.response?.data?.error || e?.message || 'falló'}`);
    }
    setBusy(false);
  };

  return (
    <>
      {/* Barra de acciones rápidas */}
      <div className="flex-shrink-0 border-b border-[#1f3a31] bg-[#0a1813]">
        <div className="max-w-[880px] mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#7fa295] uppercase tracking-wide flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-[#3dd9b0]" /> Acciones
          </span>
          <button
            onClick={() => setOpen('quote')}
            className="flex items-center gap-1.5 text-sm font-medium text-[#dcefe7] bg-[#10231d] border border-[#2a4a40] hover:border-[#0F8B6C]/60 hover:bg-[#14291f] px-3.5 py-1.5 rounded-full transition flex-shrink-0"
          >
            <FileText className="w-4 h-4 text-[#3dd9b0]" />
            Generar cotización
          </button>
          <button
            onClick={() => setOpen('op')}
            className="flex items-center gap-1.5 text-sm font-medium text-[#dcefe7] bg-[#10231d] border border-[#2a4a40] hover:border-[#0F8B6C]/60 hover:bg-[#14291f] px-3.5 py-1.5 rounded-full transition flex-shrink-0"
          >
            <Factory className="w-4 h-4 text-[#f0a085]" />
            Crear orden de producción
          </button>

          <div className="w-px h-5 bg-[#2a4a40] mx-1 flex-shrink-0" />

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#7fa295] uppercase tracking-wide flex-shrink-0">
            <Truck className="w-3.5 h-3.5 text-[#3dd9b0]" /> Bluex
          </span>
          <button
            onClick={() => setOpen('pagar')}
            className="flex items-center gap-1.5 text-xs font-medium text-[#dcefe7] bg-[#10231d] border border-[#2a4a40] hover:border-[#0F8B6C]/60 hover:bg-[#14291f] px-2.5 py-1.5 rounded-full transition flex-shrink-0"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#3dd9b0]" />
            Marcar pagado
          </button>
          <button
            onClick={() => setOpen('etiqueta')}
            className="flex items-center gap-1.5 text-xs font-medium text-[#dcefe7] bg-[#10231d] border border-[#2a4a40] hover:border-[#0F8B6C]/60 hover:bg-[#14291f] px-2.5 py-1.5 rounded-full transition flex-shrink-0"
          >
            <Package className="w-3.5 h-3.5 text-[#3dd9b0]" />
            Generar etiqueta
          </button>
          <button
            onClick={() => { setBx({ pedidoId: '', accion: 'sync' }); submitBluexWith('sync'); }}
            className="flex items-center gap-1.5 text-xs font-medium text-[#dcefe7] bg-[#10231d] border border-[#2a4a40] hover:border-[#0F8B6C]/60 hover:bg-[#14291f] px-2.5 py-1.5 rounded-full transition flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#7fa295]" />
            Sincronizar tracking
          </button>
        </div>
      </div>

      {/* Modal cotización */}
      {open === 'quote' && (
        <Modal title="Generar cotización" icon={FileText} onClose={() => setOpen(null)}>
          <div className="space-y-3">
            <Field label="Empresa">
              <input className={inputCls} value={q.empresa} onChange={(e) => setQ({ ...q, empresa: e.target.value })} placeholder="Nombre de la empresa" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contacto">
                <input className={inputCls} value={q.contacto} onChange={(e) => setQ({ ...q, contacto: e.target.value })} placeholder="Nombre" />
              </Field>
              <Field label="Email">
                <input type="email" className={inputCls} value={q.email} onChange={(e) => setQ({ ...q, email: e.target.value })} placeholder="correo@empresa.cl" />
              </Field>
            </div>
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <Field label="Producto">
                <select className={inputCls} value={q.sku} onChange={(e) => setQ({ ...q, sku: e.target.value })}>
                  <option value="">Elige un producto…</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.sku}>{p.nombre} ({p.sku})</option>
                  ))}
                </select>
              </Field>
              <Field label="Cantidad">
                <input type="number" min="1" className={inputCls} value={q.cantidad} onChange={(e) => setQ({ ...q, cantidad: parseInt(e.target.value) || 1 })} />
              </Field>
            </div>
            <button
              onClick={submitQuote}
              disabled={busy || !q.empresa.trim() || !q.sku}
              className="w-full h-11 rounded-xl bg-[#0F8B6C] hover:bg-[#0b6e55] text-white font-semibold flex items-center justify-center gap-2 transition disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Generar cotización
            </button>
          </div>
        </Modal>
      )}

      {/* Modal orden de producción */}
      {open === 'op' && (
        <Modal title="Crear orden de producción" icon={Factory} onClose={() => setOpen(null)}>
          <div className="space-y-3">
            <Field label="Empresa / Cliente">
              <input className={inputCls} value={op.empresa} onChange={(e) => setOp({ ...op, empresa: e.target.value })} placeholder="Nombre del cliente" />
            </Field>
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <Field label="Producto">
                <select className={inputCls} value={op.sku} onChange={(e) => setOp({ ...op, sku: e.target.value })}>
                  <option value="">Elige un producto…</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.sku}>{p.nombre} ({p.sku})</option>
                  ))}
                </select>
              </Field>
              <Field label="Cantidad">
                <input type="number" min="1" className={inputCls} value={op.cantidad} onChange={(e) => setOp({ ...op, cantidad: parseInt(e.target.value) || 1 })} />
              </Field>
            </div>
            <Field label="Prioridad">
              <select className={inputCls} value={op.prioridad} onChange={(e) => setOp({ ...op, prioridad: e.target.value })}>
                <option value="Alta (urgente)">Alta (urgente)</option>
                <option value="Normal">Normal</option>
                <option value="Baja">Baja</option>
              </select>
            </Field>
            <button
              onClick={submitOP}
              disabled={busy || !op.empresa.trim() || !op.sku}
              className="w-full h-11 rounded-xl bg-[#D96B4D] hover:bg-[#c25a3e] text-white font-semibold flex items-center justify-center gap-2 transition disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Factory className="w-4 h-4" />}
              Crear orden
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Bluexpress: Marcar pagado / Generar etiqueta */}
      {(open === 'pagar' || open === 'etiqueta' || open === 'cancelar') && (
        <Modal title={open === 'pagar' ? 'Marcar pedido como pagado' : open === 'etiqueta' ? 'Generar etiqueta BlueExpress' : 'Cancelar pedido'} icon={open === 'pagar' ? CreditCard : open === 'etiqueta' ? Package : X} onClose={() => { setOpen(null); setResultMsg(''); }}>
          <div className="space-y-3">
            <Field label="Pedido">
              <select className={inputCls} value={bx.pedidoId} onChange={(e) => setBx({ ...bx, pedidoId: e.target.value })}>
                <option value="">Elige un pedido…</option>
                {pedidosPendientes.slice(0, 30).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.numero_pedido || p.id.slice(-6)} · {p.cliente_nombre} · {p.estado}
                    {p.tracking ? ` · ${p.tracking}` : ''}
                  </option>
                ))}
              </select>
            </Field>
            {open === 'pagar' && (
              <p className="text-[11px] text-[#6f7d77] leading-relaxed">
                El pedido pasará a estado <strong>Confirmado</strong> y <strong>payment_status: paid</strong>.
                Luego podrás generar su etiqueta BlueExpress.
              </p>
            )}
            {open === 'etiqueta' && (
              <p className="text-[11px] text-[#6f7d77] leading-relaxed">
                Genera la etiqueta de envío BlueExpress. Requiere que el pedido esté pagado.
                Se crea la OT y se obtiene el tracking number.
              </p>
            )}
            {resultMsg && (
              <div className={`text-xs font-semibold p-2.5 rounded-xl ${resultMsg.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                {resultMsg}
              </div>
            )}
            <button
              onClick={() => submitBluexWith(open)}
              disabled={busy || !bx.pedidoId}
              className="w-full h-11 rounded-xl bg-[#0F8B6C] hover:bg-[#0b6e55] text-white font-semibold flex items-center justify-center gap-2 transition disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : open === 'pagar' ? <CreditCard className="w-4 h-4" /> : <Package className="w-4 h-4" />}
              {open === 'pagar' ? 'Marcar como pagado' : open === 'etiqueta' ? 'Generar etiqueta' : 'Cancelar pedido'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}