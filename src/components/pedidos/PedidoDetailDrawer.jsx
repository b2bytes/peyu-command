import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Mail, Phone, MapPin, Package, CreditCard, Sparkles, Loader2, ExternalLink, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import BluexShipmentButton from './BluexShipmentButton';
import BluexManualDispatchCard from './BluexManualDispatchCard';
import { getPagoStatus } from '@/lib/pago-status';

const ESTADOS = ['Nuevo', 'Confirmado', 'En Producción', 'Listo para Despacho', 'Despachado', 'Entregado', 'Cancelado'];
const COURIERS = ['Starken', 'Chilexpress', 'BlueExpress', 'Correos Chile', 'Retiro en Tienda'];

export default function PedidoDetailDrawer({ pedido, onClose, onUpdate }) {
  const [estado, setEstado] = useState(pedido.estado);
  const [tracking, setTracking] = useState(pedido.tracking || '');
  const [courier, setCourier] = useState(pedido.courier || '');
  const [saving, setSaving] = useState(false);

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
        toast.success(`Pedido actualizado a "${estado}"${res.data.email_enviado ? ' · email enviado' : ''}`);
        onUpdate?.();
        onClose();
      } else {
        toast.error(res.data?.error || 'Error al actualizar');
      }
    } catch (e) {
      toast.error('Error al actualizar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-5 z-10">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider opacity-80">Pedido</p>
              <h2 className="text-xl font-bold truncate">{pedido.numero_pedido || pedido.id.slice(-8)}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Estado de pago — visible y claro */}
          {(() => {
            const ps = getPagoStatus(pedido);
            return (
              <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm ${
                ps.tone === 'green' ? 'bg-emerald-50 text-emerald-800'
                : ps.tone === 'amber' ? 'bg-amber-50 text-amber-900'
                : ps.tone === 'red' ? 'bg-red-50 text-red-800'
                : 'bg-gray-100 text-gray-700'
              }`}>
                {ps.pagado ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                {ps.label}
              </div>
            );
          })()}
        </div>

        <div className="p-5 space-y-5">
          {/* Cliente */}
          <section className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</h3>
            <p className="font-semibold text-gray-900">{pedido.cliente_nombre}</p>
            {pedido.cliente_email && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <a href={`mailto:${pedido.cliente_email}`} className="text-teal-700 hover:underline">
                  {pedido.cliente_email}
                </a>
              </p>
            )}
            {pedido.cliente_telefono && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                <a href={`https://wa.me/${pedido.cliente_telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">
                  {pedido.cliente_telefono}
                </a>
              </p>
            )}
            {(pedido.direccion_envio || pedido.ciudad) && (() => {
              // Extraemos el depto/referencia para mostrarlo destacado.
              // El carrito guarda "Depto/Ref: XYZ" dentro de direccion_envio.
              const dir = pedido.direccion_envio || '';
              const deptoMatch = dir.match(/Depto\/Ref:\s*([^·|]+)/i);
              const depto = deptoMatch ? deptoMatch[1].trim() : null;
              // Para Google Maps: usamos dirección completa + ciudad + "Chile"
              const mapsQuery = encodeURIComponent(
                `${dir || pedido.ciudad}${pedido.ciudad && !dir.includes(pedido.ciudad) ? ', ' + pedido.ciudad : ''}, Chile`
              );
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
              return (
                <div className="mt-1 space-y-1.5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Dirección de despacho
                  </p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir en Google Maps"
                    className="block text-sm text-teal-700 hover:text-teal-900 hover:underline leading-relaxed font-medium group"
                  >
                    {dir || pedido.ciudad}
                    <span className="inline-flex items-center gap-0.5 ml-1.5 text-[11px] text-teal-600 opacity-70 group-hover:opacity-100">
                      <ExternalLink className="w-3 h-3" /> Maps
                    </span>
                  </a>
                  {depto && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 flex items-start gap-2">
                      <span className="text-base leading-none mt-0.5">🏢</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider leading-none">Depto / Oficina / Referencia</p>
                        <p className="text-sm font-bold text-amber-900 mt-0.5 leading-tight">{depto}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </section>

          {/* Productos */}
          <section className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Productos del pedido</h3>
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <Package className="w-4 h-4 text-teal-600" /> {pedido.cantidad || 1} unidad{(pedido.cantidad || 1) > 1 ? 'es' : ''} {pedido.sku && `· SKU ${pedido.sku}`}
            </div>

            {/* Detalle línea por línea, parseando color, pack y grabado */}
            {pedido.descripcion_items && (
              <div className="space-y-2">
                {pedido.descripcion_items.split(/\n|\s\|\s/).filter(Boolean).map((linea, i) => {
                  const partes = linea.split(' · ').map(p => p.trim());
                  const titulo = partes[0];
                  const detalles = partes.slice(1);
                  return (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-gray-900">{titulo}</p>
                      {detalles.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {detalles.map((d, j) => {
                            const lower = d.toLowerCase();
                            const isColor = lower.startsWith('color');
                            const isPack = lower.startsWith('pack');
                            const isGrabado = lower.startsWith('grabado');
                            const isSku = lower.startsWith('sku');
                            const cls = isColor ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : isPack ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : isGrabado ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : isSku ? 'bg-gray-100 text-gray-600 border-gray-200 font-mono'
                              : 'bg-gray-50 text-gray-700 border-gray-200';
                            const icon = isColor ? '🎨' : isPack ? '📦' : isGrabado ? '✨' : '';
                            return (
                              <span key={j} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${cls}`}>
                                {icon} {d}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {pedido.requiere_personalizacion && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-xs">
                <p className="flex items-center gap-1.5 font-semibold text-purple-800">
                  <Sparkles className="w-3.5 h-3.5" /> Personalización láser UV (a producir)
                </p>
                {pedido.texto_personalizacion && <p className="text-purple-700 mt-1 font-mono bg-white/60 px-2 py-1 rounded">"{pedido.texto_personalizacion}"</p>}
              </div>
            )}
          </section>

          {/* Pago */}
          <section className="bg-gray-50 rounded-xl p-4 space-y-1">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pago</h3>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span>${(pedido.subtotal || 0).toLocaleString('es-CL')}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Envío</span><span>${(pedido.costo_envio || 0).toLocaleString('es-CL')}</span></div>
            {pedido.descuento > 0 && <div className="flex justify-between text-sm text-green-700"><span>Descuento</span><span>-${pedido.descuento.toLocaleString('es-CL')}</span></div>}
            <div className="flex justify-between font-bold border-t pt-1.5 mt-1.5"><span>Total</span><span>${(pedido.total || 0).toLocaleString('es-CL')}</span></div>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-2"><CreditCard className="w-3.5 h-3.5" /> {pedido.medio_pago || 'WebPay'}</p>
          </section>

          {/* Despacho Bluex (info para portal manual + futura API) */}
          <BluexManualDispatchCard pedido={pedido} />

          {/* Acciones */}
          <section className="border border-teal-200 bg-teal-50/30 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">Procesar pedido</h3>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Nuevo estado</label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {(estado === 'Despachado' || estado === 'Listo para Despacho') && (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Courier</label>
                  <Select value={courier} onValueChange={setCourier}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {COURIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">N° Tracking</label>
                  <Input
                    value={tracking}
                    onChange={e => setTracking(e.target.value)}
                    placeholder="Ej: 1234567890"
                    className="bg-white"
                  />
                </div>
              </>
            )}

            <div className="text-xs text-gray-600 bg-white rounded-lg p-2 border border-gray-200">
              ✉️ Al guardar se enviará email automático al cliente notificando el cambio.
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || estado === pedido.estado}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
            >
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : 'Actualizar y notificar'}
            </Button>

            {/* BlueExpress: generar etiqueta / ver tracking */}
            {(courier === 'BlueExpress' || pedido.courier === 'BlueExpress' || estado === 'Listo para Despacho' || estado === 'Despachado') && (
              <div className="pt-2 border-t border-teal-200">
                <BluexShipmentButton
                  pedido={pedido}
                  onShipmentCreated={(d) => {
                    if (d.tracking) setTracking(d.tracking);
                    setCourier('BlueExpress');
                    onUpdate?.();
                  }}
                />
              </div>
            )}
          </section>

          {pedido.cliente_email && (
            <a
              href={`/admin/cliente-360?email=${encodeURIComponent(pedido.cliente_email)}`}
              className="flex items-center justify-center gap-1.5 text-sm text-teal-700 hover:text-teal-900 font-semibold py-2"
            >
              Ver perfil 360° del cliente <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}