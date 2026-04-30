import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Mail, Phone, MapPin, Package, CreditCard, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import BluexShipmentButton from './BluexShipmentButton';

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
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-5 flex items-center justify-between z-10">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Pedido</p>
            <h2 className="text-xl font-bold">{pedido.numero_pedido || pedido.id.slice(-8)}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
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
            {pedido.ciudad && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> {pedido.ciudad}{pedido.direccion_envio && ` — ${pedido.direccion_envio}`}
              </p>
            )}
          </section>

          {/* Productos */}
          <section className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Productos</h3>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Package className="w-4 h-4" /> {pedido.cantidad || 1}u · SKU {pedido.sku || '—'}
            </div>
            {pedido.descripcion_items && (
              <p className="text-xs text-gray-600 whitespace-pre-line">{pedido.descripcion_items}</p>
            )}
            {pedido.requiere_personalizacion && (
              <div className="mt-2 bg-purple-50 border border-purple-200 rounded-lg p-2 text-xs">
                <p className="flex items-center gap-1.5 font-semibold text-purple-800">
                  <Sparkles className="w-3.5 h-3.5" /> Personalización láser UV
                </p>
                {pedido.texto_personalizacion && <p className="text-purple-700 mt-1">{pedido.texto_personalizacion}</p>}
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