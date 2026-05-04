import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  X, Truck, RefreshCw, Printer, Ban, ExternalLink, Mail, MessageCircle,
  MapPin, User, Phone, Package, Loader2, FileText, AlertTriangle, Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import BluexTimeline from './BluexTimeline';

/**
 * Drawer de detalle de un envío Bluex.
 * Centraliza acciones: refrescar tracking, ver/imprimir etiqueta, anular,
 * contactar cliente (email/WhatsApp), ver historial de notificaciones.
 */
export default function BluexShipmentDrawer({ envio: envioInicial, onClose, onUpdate }) {
  const [envio, setEnvio] = useState(envioInicial);
  const [refreshing, setRefreshing] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [labelData, setLabelData] = useState({ base64: envio.label_base64, url: envio.label_url });
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { setEnvio(envioInicial); }, [envioInicial]);

  const refreshTracking = async () => {
    setRefreshing(true);
    try {
      const res = await base44.functions.invoke('bluexTrackShipment', { envio_id: envio.id });
      if (res.data?.error) throw new Error(res.data.error);
      const updated = await base44.entities.Envio.get(envio.id);
      setEnvio(updated);
      onUpdate?.();
      toast.success('Tracking actualizado');
    } catch (e) {
      toast.error(e.message || 'Error refrescando');
    } finally {
      setRefreshing(false);
    }
  };

  const verEtiqueta = async () => {
    if (labelData.base64 || labelData.url) {
      setShowLabel(true);
      return;
    }
    setLabelLoading(true);
    try {
      const res = await base44.functions.invoke('bluexGetLabel', { envio_id: envio.id });
      if (res.data?.error) throw new Error(res.data.error);
      setLabelData({ base64: res.data.label_base64, url: res.data.label_url });
      setShowLabel(true);
    } catch (e) {
      toast.error(e.message || 'No se pudo obtener etiqueta');
    } finally {
      setLabelLoading(false);
    }
  };

  const imprimir = () => {
    const url = labelData.base64
      ? `data:application/pdf;base64,${labelData.base64}`
      : labelData.url;
    if (!url) return;
    const w = window.open(url, '_blank');
    setTimeout(() => w?.print?.(), 1000);
  };

  const anular = async () => {
    const motivo = prompt('Motivo de anulación:');
    if (!motivo) return;
    setCancelling(true);
    try {
      const res = await base44.functions.invoke('bluexCancelShipment', { envio_id: envio.id, motivo });
      if (res.data?.error) throw new Error(res.data.error);
      toast.success('Envío anulado');
      onUpdate?.();
      onClose();
    } catch (e) {
      toast.error(e.message || 'Error');
    } finally {
      setCancelling(false);
    }
  };

  const contactarWhatsApp = () => {
    if (!envio.cliente_telefono) return;
    const tel = envio.cliente_telefono.replace(/\D/g, '');
    const msg = `Hola ${envio.cliente_nombre?.split(' ')[0]}, te escribo desde PEYU sobre tu pedido ${envio.numero_pedido}. Tracking: ${envio.tracking_number}. ¿Cómo te puedo ayudar?`;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const puedeAnular = ['Pendiente Emisión', 'Etiqueta Generada', 'En Bodega'].includes(envio.estado);
  const labelSrc = labelData.base64 ? `data:application/pdf;base64,${labelData.base64}` : labelData.url;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <aside
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-background h-full overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-4 flex items-start justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">BlueExpress</span>
            </div>
            <h2 className="font-poppins font-extrabold text-xl truncate">{envio.numero_pedido}</h2>
            <p className="text-xs opacity-90 font-mono mt-0.5">{envio.tracking_number}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Alertas */}
          {envio.tiene_excepcion && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-900">
                <p className="font-bold">Excepción detectada</p>
                <p>{envio.ultimo_evento_descripcion}</p>
              </div>
            </div>
          )}
          {envio.atrasado && envio.estado !== 'Entregado' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-bold">Atrasado vs promesa</p>
                <p>Llevamos {envio.dias_en_transito} días en tránsito · Promesa: {envio.fecha_promesa}</p>
              </div>
            </div>
          )}

          {/* Estado actual */}
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider font-bold text-cyan-700">Estado actual</p>
              <span className="text-[10px] text-cyan-600">{envio.tipo_destino} · {envio.servicio}</span>
            </div>
            <p className="font-poppins font-extrabold text-foreground text-xl">{envio.estado}</p>
            {envio.ultimo_evento_descripcion && (
              <p className="text-xs text-muted-foreground mt-1">{envio.ultimo_evento_descripcion}</p>
            )}
          </div>

          {/* Acciones */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={refreshTracking} disabled={refreshing} variant="outline" className="gap-2 h-11">
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refrescar
            </Button>
            <Button onClick={verEtiqueta} disabled={labelLoading} variant="outline" className="gap-2 h-11">
              {labelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Ver etiqueta
            </Button>
            <Button onClick={contactarWhatsApp} variant="outline" className="gap-2 h-11">
              <MessageCircle className="w-4 h-4" /> WhatsApp cliente
            </Button>
            <a
              href={envio.tracking_url || `https://www.bluex.cl/seguimiento?n=${envio.tracking_number}`}
              target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 h-11 rounded-md border border-input text-sm font-medium hover:bg-accent"
            >
              <ExternalLink className="w-4 h-4" /> Tracking público
            </a>
          </div>

          {/* Datos destino */}
          <div className="bg-white border border-border rounded-xl p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Destinatario</p>
            <Row icon={User} val={envio.cliente_nombre} />
            <Row icon={Phone} val={envio.cliente_telefono} />
            <Row icon={Mail} val={envio.cliente_email} />
            <Row icon={MapPin} val={envio.direccion_destino} />
            <Row icon={Package} val={`${envio.peso_kg}kg · $${(envio.valor_declarado_clp || 0).toLocaleString('es-CL')} declarado`} />
          </div>

          {/* Timeline */}
          <div className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-poppins font-bold text-sm text-foreground">Eventos del envío</h3>
              <span className="text-[10px] text-muted-foreground">{envio.eventos?.length || 0} eventos</span>
            </div>
            <BluexTimeline eventos={envio.eventos || []} />
          </div>

          {/* Notificaciones enviadas */}
          {envio.notificaciones_enviadas?.length > 0 && (
            <div className="bg-white border border-border rounded-xl p-4">
              <h3 className="font-poppins font-bold text-sm text-foreground flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-cyan-600" />
                Notificaciones enviadas al cliente ({envio.notificaciones_enviadas.length})
              </h3>
              <ul className="space-y-1.5 text-xs">
                {envio.notificaciones_enviadas.slice().reverse().map((n, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 pb-1.5 border-b border-border/50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{n.subject}</p>
                      <p className="text-[10px] text-muted-foreground">{n.canal} · {n.tipo}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                      {new Date(n.at).toLocaleDateString('es-CL')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Anular (solo si aún se puede) */}
          {puedeAnular && (
            <Button
              onClick={anular}
              disabled={cancelling}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 gap-2 h-11"
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Anular envío
            </Button>
          )}
        </div>

        {/* Modal etiqueta */}
        {showLabel && labelSrc && (
          <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setShowLabel(false)}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl max-w-3xl w-full h-[85vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="font-bold text-foreground">Etiqueta · {envio.tracking_number}</h3>
                <div className="flex gap-2">
                  <Button onClick={imprimir} size="sm" className="gap-1.5">
                    <Printer className="w-3.5 h-3.5" /> Imprimir
                  </Button>
                  <Button onClick={() => setShowLabel(false)} size="sm" variant="ghost">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <iframe src={labelSrc} className="flex-1 w-full" title="Etiqueta Bluex" />
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function Row({ icon: Icon, val }) {
  if (!val) return null;
  return (
    <div className="flex items-start gap-2 text-sm text-foreground">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
      <span className="break-words">{val}</span>
    </div>
  );
}