import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  X, Mail, Phone, MapPin, Package, CreditCard, Sparkles, Loader2,
  ExternalLink, CheckCircle2, Clock, Trash2, Truck, ChevronDown, ChevronUp,
  FileText, Printer, ClipboardPaste, AlertCircle, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import MockupClientePreview from './MockupClientePreview';
import { getPagoStatus } from '@/lib/pago-status';
// getPagoStatus también se usa dentro de BluexPanel vía props

const ESTADOS = ['Nuevo', 'Confirmado', 'En Producción', 'Listo para Despacho', 'Despachado', 'Entregado', 'Cancelado'];
const COURIERS = ['BlueExpress', 'Starken', 'Chilexpress', 'Correos Chile', 'Retiro en Tienda'];

// ── Sub-componente BlueExpress integrado ──────────────────────────────────
function BluexPanel({ pedido, onDone }) {
  // eslint-disable-next-line no-unused-vars
  // Reutilizamos getPagoStatus para que transferencias confirmadas pasen el check
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualTracking, setManualTracking] = useState('');
  const [manualLabelUrl, setManualLabelUrl] = useState('');
  const [labelData, setLabelData] = useState(null);

  // Usar getPagoStatus en vez de comparar payment_status directo —
  // así transferencias confirmadas (estado=Confirmado/post) también pasan.
  const { pagado: isPaid } = getPagoStatus(pedido);
  const esRetiro = pedido.courier === 'Retiro en Tienda' || (pedido.notas || '').includes('Retiro en tienda');
  const hasAddress = esRetiro || !!(pedido.direccion_envio && pedido.ciudad);
  const canGenerate = isPaid && hasAddress;

  const handleGenerar = async ({ manual = false } = {}) => {
    if (manual && !manualTracking.trim()) {
      toast.error('Pega el número de tracking del portal Bluex');
      return;
    }
    setLoading(true);
    try {
      const payload = { pedido_id: pedido.id };
      if (manual) {
        payload.manual_tracking_number = manualTracking.trim();
        if (manualLabelUrl.trim()) payload.manual_label_url = manualLabelUrl.trim();
      }
      const res = await base44.functions.invoke('bluexCreateShipment', payload);
      const d = res.data || {};

      if (d.ok && d.tracking) {
        toast.success(manual ? `Envío registrado · ${d.tracking}` : `✅ Etiqueta generada · ${d.tracking}`);
        setLabelData(d);
        setShowManual(false);
        onDone?.(d);
      } else if (d.fallback_mode === 'manual' || d.modo === 'manual_required') {
        toast.info('API Bluex no disponible. Genera la OT en el portal.');
        setShowManual(true);
      } else {
        toast.error(d.error || 'No se pudo generar la etiqueta');
        setShowManual(true);
      }
    } catch (e) {
      const detail = e?.response?.data;
      toast.info('Usando modo manual. Genera la OT en el portal Bluex.');
      setShowManual(true);
    } finally {
      setLoading(false);
    }
  };

  const imprimir = () => {
    const url = labelData?.label_base64
      ? `data:application/pdf;base64,${labelData.label_base64}`
      : labelData?.label_url;
    if (!url) return;
    const w = window.open(url, '_blank');
    setTimeout(() => w?.print?.(), 1000);
  };

  // Ya tiene envío creado
  if (pedido.courier === 'BlueExpress' && pedido.tracking) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold py-2.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Envío activo · <span className="font-mono">{pedido.tracking}</span></span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`https://www.bluex.cl/seguimiento?n=${pedido.tracking}`}
            target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-100 transition"
          >
            <Truck className="w-3.5 h-3.5" /> Tracking público
          </a>
          <a
            href="/admin/bluex"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Centro logístico
          </a>
        </div>
      </div>
    );
  }

  // Etiqueta recién generada
  if (labelData?.tracking) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 py-2.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" /> OT generada · <span className="font-mono">{labelData.tracking}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {labelData.label_url && (
            <a
              href={labelData.label_base64 ? `data:application/pdf;base64,${labelData.label_base64}` : labelData.label_url}
              target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-xl hover:bg-cyan-100 transition"
            >
              <FileText className="w-3.5 h-3.5" /> Ver etiqueta
            </a>
          )}
          <button
            onClick={imprimir}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-100 transition"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </button>
        </div>
      </div>
    );
  }

  // Modo manual activo
  if (showManual) {
    return (
      <div className="space-y-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-900">Modo manual · Portal Bluex</p>
            <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
              1. Abre el <a href="https://b2b.bluex.cl" target="_blank" rel="noreferrer" className="underline font-semibold">portal b2b.bluex.cl</a>{' '}
              2. Genera la OT con los datos del pedido{' '}
              3. Copia el tracking y pégalo aquí
            </p>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-amber-900 uppercase block mb-1">Tracking / OT *</label>
          <Input
            value={manualTracking}
            onChange={e => setManualTracking(e.target.value)}
            placeholder="Ej: 8501234567"
            className="text-sm h-9 bg-white border-amber-300"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-amber-900 uppercase block mb-1">URL etiqueta PDF (opcional)</label>
          <Input
            value={manualLabelUrl}
            onChange={e => setManualLabelUrl(e.target.value)}
            placeholder="https://b2b.bluex.cl/..."
            className="text-sm h-9 bg-white border-amber-300"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleGenerar({ manual: true })}
            disabled={loading || !manualTracking.trim()}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2 h-9"
            size="sm"
          >
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Registrando...</> : <><ClipboardPaste className="w-3.5 h-3.5" /> Registrar envío</>}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowManual(false)} disabled={loading} className="h-9">
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // Estado inicial: botón principal
  return (
    <div className="space-y-2">
      {!canGenerate && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {!isPaid ? 'El pedido aún no está pagado' : 'Falta dirección o ciudad de envío'}
        </div>
      )}
      <button
        onClick={() => handleGenerar({ manual: false })}
        disabled={loading || !canGenerate}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
        style={{ background: canGenerate ? 'linear-gradient(135deg,#0066CC,#0080FF)' : '#E5E7EB', color: canGenerate ? 'white' : '#9CA3AF', boxShadow: canGenerate ? '0 4px 16px rgba(0,102,204,.25)' : 'none' }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        {loading ? 'Generando etiqueta...' : 'Generar etiqueta BlueExpress'}
      </button>
      <button
        onClick={() => setShowManual(true)}
        disabled={loading}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition"
      >
        <ClipboardPaste className="w-3.5 h-3.5" /> Registrar OT manualmente
      </button>
    </div>
  );
}

// ── Drawer principal ──────────────────────────────────────────────────────
export default function PedidoDetailDrawer({ pedido, onClose, onUpdate }) {
  const [estado, setEstado] = useState(pedido.estado);
  const [tracking, setTracking] = useState(pedido.tracking || '');
  const [courier, setCourier] = useState(pedido.courier || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const ps = getPagoStatus(pedido);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke('updateShippingStatus', {
        pedido_id: pedido.id,
        nuevo_estado: estado,
        tracking: tracking || undefined,
        courier: courier || undefined,
      });
      if (res.data?.ok) {
        const d = res.data;
        if (d.bluex?.tracking) {
          toast.success(`🚚 Etiqueta BlueExpress generada · ${d.bluex.tracking}`);
          if (d.bluex.tracking) setTracking(d.bluex.tracking);
          setCourier('BlueExpress');
        } else {
          toast.success(`Estado → "${estado}"${d.email_enviado ? ' · email enviado ✉️' : ''}`);
        }
        onUpdate?.();
        onClose();
      } else if (res.data?.blocked) {
        // Guard de pago: el backend bloqueó el avance por falta de pago confirmado.
        toast.error(`⛔ ${res.data.error}`, { duration: 6000 });
      } else {
        toast.error(res.data?.error || 'Error al actualizar');
      }
    } catch (e) {
      const detail = e?.response?.data;
      if (detail?.blocked) {
        toast.error(`⛔ ${detail.error}`, { duration: 6000 });
      } else {
        toast.error('Error: ' + e.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.entities.PedidoWeb.delete(pedido.id);
      toast.success('Pedido eliminado');
      onUpdate?.();
      onClose();
    } catch (e) {
      toast.error('Error al eliminar: ' + e.message);
      setDeleting(false);
    }
  };

  const showCourierFields = estado === 'Despachado' || estado === 'Listo para Despacho';
  const estadoChanged = estado !== pedido.estado;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pedido</p>
              <h2 className="text-xl font-black text-gray-900 truncate">{pedido.numero_pedido || pedido.id.slice(-8)}</h2>
              <p className="text-sm font-semibold text-gray-600 truncate">{pedido.cliente_nombre}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Badge pago */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                ps.tone === 'green' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : ps.tone === 'amber' ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {ps.pagado ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {ps.label}
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-4">

          {/* ── BlueExpress — PRIMERO Y PROMINENTE ── */}
          <section className="rounded-2xl overflow-hidden border-2 border-blue-200" style={{ background: 'linear-gradient(135deg,#EFF6FF,#F0F9FF)' }}>
            <div className="px-4 py-3 flex items-center gap-2 border-b border-blue-100">
              <Truck className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-black text-blue-900">BlueExpress</span>
              <span className="ml-auto text-[10px] font-bold text-blue-500 uppercase tracking-wider">Despacho</span>
            </div>
            <div className="p-4">
              <BluexPanel
                pedido={{ ...pedido, tracking, courier }}
                onDone={(d) => {
                  if (d.tracking) setTracking(d.tracking);
                  setCourier('BlueExpress');
                  setEstado('Listo para Despacho');
                  onUpdate?.();
                }}
              />
            </div>
          </section>

          {/* ── Cambiar estado ── */}
          <section className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-700">Estado del pedido</span>
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                background: pedido.estado === 'Entregado' ? '#DCFCE7' : pedido.estado === 'Nuevo' ? '#FEF9C3' : '#DBEAFE',
                color: pedido.estado === 'Entregado' ? '#166534' : pedido.estado === 'Nuevo' ? '#854D0E' : '#1E40AF',
              }}>
                {pedido.estado}
              </span>
            </div>
            <div className="p-4 space-y-3">
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="bg-white font-semibold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>

              {showCourierFields && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Courier</label>
                    <Select value={courier} onValueChange={setCourier}>
                      <SelectTrigger className="bg-white h-9 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {COURIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">N° Tracking</label>
                    <Input
                      value={tracking}
                      onChange={e => setTracking(e.target.value)}
                      placeholder="1234567890"
                      className="bg-white h-9 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Aviso proactivo: pedido MP sin pago confirmado + intento de avanzar */}
              {(() => {
                const ESTADOS_BLOQUEADOS = ['Confirmado', 'En Producción', 'Listo para Despacho', 'Despachado', 'Entregado'];
                const esMP = (pedido.medio_pago || '').trim() === 'MercadoPago';
                const sinPago = pedido.payment_status !== 'paid';
                const intentaAvanzar = ESTADOS_BLOQUEADOS.includes(estado) && estado !== pedido.estado;
                if (esMP && sinPago && intentaAvanzar) {
                  return (
                    <div className="flex items-start gap-2 text-[11px] text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-1">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-600" />
                      <span>No se puede avanzar: el pago de MercadoPago no fue confirmado. El cliente debe completar el pago primero.</span>
                    </div>
                  );
                }
                return null;
              })()}

              <Button
                onClick={handleSave}
                disabled={saving || !estadoChanged}
                className="w-full h-10 font-bold gap-2"
                style={{ background: estadoChanged ? 'linear-gradient(135deg,#0F8B6C,#0B6E55)' : undefined }}
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {estado === 'Listo para Despacho' ? 'Generando etiqueta Bluex...' : 'Guardando...'}</>
                  : estado === 'Listo para Despacho'
                    ? '🚚 Confirmar + Generar etiqueta BlueExpress'
                    : '✉️ Actualizar y notificar cliente'
                }
              </Button>

              {estadoChanged && (
                <p className="text-[11px] text-gray-500 text-center">
                  {estado === 'Listo para Despacho'
                    ? '⚡ Se generará la etiqueta BlueExpress automáticamente'
                    : 'Se enviará email automático al cliente'}
                </p>
              )}
            </div>
          </section>

          {/* ── Cliente ── */}
          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</span>
            </div>
            <div className="p-4 space-y-2">
              <p className="font-bold text-gray-900">{pedido.cliente_nombre}</p>
              {pedido.cliente_email && (
                <a href={`mailto:${pedido.cliente_email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Mail className="w-3.5 h-3.5" /> {pedido.cliente_email}
                </a>
              )}
              {pedido.cliente_telefono && (
                <a href={`https://wa.me/${pedido.cliente_telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-green-700 hover:underline">
                  <Phone className="w-3.5 h-3.5" /> {pedido.cliente_telefono}
                </a>
              )}
              {(pedido.direccion_envio || pedido.ciudad) && (() => {
                const dir = pedido.direccion_envio || '';
                const mapsQuery = encodeURIComponent(`${dir || pedido.ciudad}, ${pedido.ciudad || ''}, Chile`);
                return (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-start gap-2 text-sm text-gray-600 hover:text-blue-600 transition"
                  >
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{dir || pedido.ciudad}{pedido.ciudad && dir && !dir.includes(pedido.ciudad) ? `, ${pedido.ciudad}` : ''}</span>
                    <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-50" />
                  </a>
                );
              })()}
            </div>
          </section>

          {/* ── Productos ── */}
          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Productos</span>
            </div>
            <div className="p-4 space-y-2">
              {Array.isArray(pedido.items_detalle) && pedido.items_detalle.length > 0 ? (
                pedido.items_detalle.map((it, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-sm font-bold text-gray-900">{it.nombre || 'Producto'} × {it.cantidad || 1}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(it.color || it.pack_resumen) && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">🎨 {it.color || it.pack_resumen}</span>
                      )}
                      {it.personalizacion && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">✨ "{it.personalizacion}"</span>
                      )}
                      {it.sku && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200">SKU {it.sku}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">{pedido.descripcion_items || `${pedido.cantidad || 1} u · ${pedido.sku || 'sin SKU'}`}</p>
              )}
              {pedido.requiere_personalizacion && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 flex items-start gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-purple-800 font-semibold">Personalización láser UV{pedido.texto_personalizacion ? `: "${pedido.texto_personalizacion}"` : ''}</span>
                </div>
              )}
            </div>
          </section>

          {/* ── Mockup ── */}
          <MockupClientePreview pedido={pedido} variant="admin" />

          {/* ── Pago ── */}
          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pago</span>
            </div>
            <div className="p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${(pedido.subtotal || 0).toLocaleString('es-CL')}</span></div>
              <div className="flex justify-between text-gray-600"><span>Envío</span><span>${(pedido.costo_envio || 0).toLocaleString('es-CL')}</span></div>
              {pedido.descuento > 0 && <div className="flex justify-between text-green-700"><span>Descuento</span><span>-${pedido.descuento.toLocaleString('es-CL')}</span></div>}
              <div className="flex justify-between font-black border-t border-gray-100 pt-1.5 text-gray-900"><span>Total</span><span>${(pedido.total || 0).toLocaleString('es-CL')}</span></div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1"><CreditCard className="w-3.5 h-3.5" /> {pedido.medio_pago || 'WebPay'}</p>
            </div>
          </section>

          {/* ── Links ── */}
          {pedido.cliente_email && (
            <a
              href={`/admin/cliente-360?email=${encodeURIComponent(pedido.cliente_email)}`}
              className="flex items-center justify-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-semibold py-2"
            >
              Ver perfil 360° del cliente <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* ── Eliminar ── */}
          <div className="pt-2 border-t border-gray-100">
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-semibold py-2 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar pedido
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                <p className="text-sm font-bold text-red-800 text-center">¿Confirmar eliminación?</p>
                <p className="text-xs text-red-600 text-center">Esta acción no se puede deshacer</p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white h-9 text-sm"
                  >
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sí, eliminar'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowDelete(false)} className="flex-1 h-9">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}