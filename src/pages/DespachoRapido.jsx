import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import EtiquetaWizardModal from '@/components/agente-os/EtiquetaWizardModal';
import { openPdfUrl } from '@/lib/pdf-open';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Truck, Loader2, Printer, FileText, CheckCircle2, Package,
  User, Phone, MapPin, Copy, Check, ExternalLink, RefreshCw,
  ClipboardPaste, AlertCircle, Sparkles, ChevronRight, Search,
  ArrowLeft, Hash, DollarSign
} from 'lucide-react';

const ESTADOS_DESPACHABLES = ['Confirmado', 'En Producción', 'Listo para Despacho'];

function fmtClp(n) {
  return n ? `$${Number(n).toLocaleString('es-CL')}` : '—';
}

function CopyField({ icon: Icon, label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 hover:bg-blue-50 transition text-left group"
    >
      <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase text-gray-400 font-bold leading-none mb-0.5">{label}</p>
        <p className="text-sm text-gray-900 font-semibold truncate">{value}</p>
      </div>
      {copied ? <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" /> : <Copy className="w-3 h-3 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />}
    </button>
  );
}

function PedidoRow({ pedido, selected, onClick }) {
  const isSelected = selected?.id === pedido.id;
  const yaDespachado = pedido.courier === 'BlueExpress' && pedido.tracking;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-colors flex items-center gap-2.5 ${
        isSelected
          ? 'bg-blue-50 border-l-[3px] border-l-blue-500 pl-2.5'
          : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
      }`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        yaDespachado ? 'bg-green-100' : 'bg-blue-100'
      }`}>
        {yaDespachado
          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          : <Package className="w-3.5 h-3.5 text-blue-600" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <p className="font-bold text-gray-900 text-xs truncate">{pedido.numero_pedido || pedido.id.slice(-6)}</p>
          <span className="text-[10px] font-semibold text-gray-400 flex-shrink-0">{fmtClp(pedido.total)}</span>
        </div>
        <p className="text-[11px] text-gray-500 truncate leading-tight">{pedido.cliente_nombre}</p>
        {yaDespachado
          ? <p className="text-[10px] font-mono text-green-600 truncate">{pedido.tracking}</p>
          : <p className="text-[10px] text-gray-400 truncate">{pedido.ciudad || '—'}</p>
        }
      </div>
      <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-blue-400' : 'text-gray-300'}`} />
    </button>
  );
}

// Panel derecho unificado: estado + acciones + etiqueta todo en uno
function PanelDespacho({ selected, envio, loadingEnvio, generando, showManual, manualTracking, manualLabelUrl,
  setShowManual, setManualTracking, setManualLabelUrl, onGenerarEtiqueta, onRecargar }) {

  const yaDespachado = selected?.courier === 'BlueExpress' && selected?.tracking;
  const labelSrc = envio?.label_base64
    ? `data:application/pdf;base64,${envio.label_base64}`
    : envio?.label_url || null;

  if (!selected) return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12">
      <Truck className="w-14 h-14 mb-4 opacity-15" />
      <p className="font-semibold text-gray-500 text-center">Selecciona un pedido de la lista para gestionar el despacho</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Banda superior: info del pedido ── */}
      <div className={`flex-shrink-0 px-5 py-3 border-b flex items-center justify-between gap-3 ${
        yaDespachado ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
      }`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-gray-900 text-base">{selected.numero_pedido}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              yaDespachado ? 'bg-green-200 text-green-800' : 'bg-blue-100 text-blue-700'
            }`}>
              {yaDespachado ? '✓ Despachado' : selected.estado}
            </span>
            {selected.courier && !yaDespachado && (
              <span className="text-xs text-gray-400">{selected.courier}</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-0.5 truncate">{selected.cliente_nombre} · {selected.ciudad || selected.descripcion_items}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-gray-700">{fmtClp(selected.total)}</span>
          <button onClick={onRecargar} className="p-1.5 hover:bg-gray-200 rounded-lg transition">
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ── Zona principal: 2 filas (acciones | etiqueta) ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Fila 1: Datos copiables + acciones (altura fija, compacta) */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 space-y-3">

          {/* Datos destinatario */}
          <div className="grid grid-cols-2 gap-1.5">
            <CopyField icon={User} label="Destinatario" value={selected.cliente_nombre} />
            <CopyField icon={Phone} label="Teléfono" value={selected.cliente_telefono} />
            <CopyField icon={MapPin} label="Dirección" value={[selected.direccion_envio, selected.ciudad].filter(Boolean).join(', ')} />
            <CopyField icon={Hash} label="Referencia" value={selected.numero_pedido} />
          </div>

          {/* Acciones según estado */}
          {yaDespachado ? (
            /* Ya despachado: mostrar tracking + botón imprimir */
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-green-700 uppercase">OT Bluex</p>
                  <p className="font-mono text-sm font-bold text-green-800 truncate">{selected.tracking}</p>
                </div>
              </div>
              {labelSrc && (
                <button onClick={() => openPdfUrl(labelSrc)}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition flex-shrink-0">
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </button>
              )}
              <a href={`https://ecommerce.blue.cl/`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition flex-shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : showManual ? (
            /* Modo manual */
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-900">
                  <span className="font-bold">Modo manual: </span>
                  genera la OT en el{' '}
                  <a href="https://b2b.bluex.cl" target="_blank" rel="noreferrer" className="underline font-bold">portal Bluex</a>
                  {' '}y pega el tracking aquí.
                </p>
              </div>
              <div className="flex gap-2">
                <Input value={manualTracking} onChange={e => setManualTracking(e.target.value)}
                  placeholder="Tracking OT (ej: 8501234567)" className="h-8 text-sm flex-1 bg-white border-amber-300" />
                <Input value={manualLabelUrl} onChange={e => setManualLabelUrl(e.target.value)}
                  placeholder="URL PDF (opcional)" className="h-8 text-sm flex-1 bg-white border-amber-300" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => onGenerarEtiqueta({ manual: true })}
                  disabled={generando || !manualTracking.trim()}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-1.5 h-8" size="sm">
                  {generando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardPaste className="w-3.5 h-3.5" />}
                  Registrar OT
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={() => setShowManual(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            /* Sin despachar: CTA principal + fallback manual */
            <div className="flex gap-2">
              <Button onClick={() => onGenerarEtiqueta({ manual: false })} disabled={generando}
                className="flex-1 gap-2 font-bold h-10 text-white"
                style={{ background: 'linear-gradient(135deg,#0066CC,#0080FF)' }}>
                {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generando ? 'Generando...' : 'Generar etiqueta Bluex'}
              </Button>
              <button onClick={() => setShowManual(true)}
                className="flex items-center gap-1.5 px-3 h-10 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold transition flex-shrink-0">
                <ClipboardPaste className="w-3.5 h-3.5" /> Manual
              </button>
              <a href="https://b2b.bluex.cl" target="_blank" rel="noreferrer"
                className="flex items-center gap-1 px-3 h-10 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold transition flex-shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Fila 2: Etiqueta PDF embebida — ocupa todo el espacio restante */}
        <div className="flex-1 overflow-hidden relative bg-gray-100">
          {loadingEnvio ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando etiqueta...
            </div>
          ) : !envio ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 p-8">
              <FileText className="w-10 h-10 opacity-25" />
              <div className="text-center">
                <p className="font-semibold text-gray-500 text-sm">Etiqueta aparecerá aquí</p>
                <p className="text-xs mt-1">Genera la OT para ver el PDF directamente en esta pantalla</p>
              </div>
            </div>
          ) : labelSrc ? (
            <>
              {/* Barra superior de la etiqueta */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-blue-600/95 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-xs text-white font-mono font-bold">{envio.tracking_number}</span>
                  <span className="text-[10px] text-white/60">· {envio.servicio || 'EXPRESS'}</span>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openPdfUrl(labelSrc)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold text-white transition">
                    <Printer className="w-3 h-3" /> Imprimir
                  </button>
                  <a href={`https://www.bluex.cl/seguimiento?n=${envio.tracking_number}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold text-white transition">
                    <ExternalLink className="w-3 h-3" /> Tracking
                  </a>
                </div>
              </div>
              <iframe src={labelSrc} className="w-full h-full border-0 pt-8" title="Etiqueta BlueExpress" />
            </>
          ) : (
            /* Sin PDF local → botones directos al portal */
            <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-1">
                <FileText className="w-7 h-7 text-blue-600" />
              </div>
              <div className="text-center mb-2">
                <p className="font-bold text-gray-700">OT registrada · PDF externo</p>
                <p className="font-mono text-blue-700 font-bold text-lg">{envio.tracking_number}</p>
              </div>
              <a href={`https://ecommerce.blue.cl/etiquetas/${envio.tracking_number}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition shadow-md w-full max-w-xs justify-center">
                <Printer className="w-4 h-4" /> Imprimir desde portal Bluex
              </a>
              <a href={`https://www.bluex.cl/seguimiento?n=${envio.tracking_number}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                <ExternalLink className="w-3 h-3" /> Ver tracking público del cliente
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function DespachoRapido() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [envio, setEnvio] = useState(null);
  const [loadingEnvio, setLoadingEnvio] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showWizard, setShowWizard] = useState(false); // asistente guiado con burbujas
  const [manualTracking, setManualTracking] = useState('');
  const [manualLabelUrl, setManualLabelUrl] = useState('');

  const loadPedidos = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.PedidoWeb.filter({ payment_status: 'paid' }, '-created_date', 80);
    const relevantes = (data || []).filter(p =>
      ESTADOS_DESPACHABLES.includes(p.estado) || (p.courier === 'BlueExpress' && p.tracking)
    );
    setPedidos(relevantes);
    setLoading(false);
  }, []);

  // Suscripción en tiempo real: cuando la automation genera el tracking automáticamente,
  // el panel se actualiza al instante sin recargar.
  useEffect(() => {
    loadPedidos();
    const unsubscribe = base44.entities.PedidoWeb.subscribe((event) => {
      if (event.type === 'update' && event.data?.payment_status === 'paid') {
        // Refrescar lista
        loadPedidos();
        // Si el pedido seleccionado fue actualizado, sincronizar estado local
        setSelected(prev => {
          if (prev && prev.id === event.id) {
            const updated = { ...prev, ...event.data };
            // Si se asignó tracking nuevo, cargar envío automáticamente
            if (event.data.tracking && !prev.tracking) {
              setTimeout(async () => {
                const envios = await base44.entities.Envio.filter({ pedido_id: event.id }, '-created_date', 1);
                if (envios?.length > 0) setEnvio(envios[0]);
              }, 800);
            }
            return updated;
          }
          return prev;
        });
      }
    });
    return () => unsubscribe();
  }, [loadPedidos]);

  const cargarEnvio = useCallback(async (pedido) => {
    if (!pedido?.tracking) return;
    setLoadingEnvio(true);
    try {
      const envios = await base44.entities.Envio.filter({ pedido_id: pedido.id }, '-created_date', 1);
      if (envios?.length > 0) setEnvio(envios[0]);
    } catch (_) {}
    setLoadingEnvio(false);
  }, []);

  const selectPedido = useCallback(async (pedido) => {
    setSelected(pedido);
    setEnvio(null);
    setShowManual(false);
    setManualTracking('');
    setManualLabelUrl('');
    await cargarEnvio(pedido);
  }, [cargarEnvio]);

  const generarEtiqueta = async ({ manual = false } = {}) => {
    if (!selected?.id) return;
    if (manual && !manualTracking.trim()) { toast.error('Ingresa el tracking del portal Bluex'); return; }
    setGenerando(true);
    try {
      const payload = { pedido_id: selected.id };
      if (manual) {
        payload.manual_tracking_number = manualTracking.trim();
        if (manualLabelUrl.trim()) payload.manual_label_url = manualLabelUrl.trim();
      }
      const res = await base44.functions.invoke('bluexCreateShipment', payload);
      const d = res.data || {};

      if (d.ok && d.tracking) {
        toast.success(`✓ Envío registrado · ${d.tracking}`);
        setShowManual(false);
        setManualTracking('');
        await loadPedidos();
        const updatedPedido = { ...selected, courier: 'BlueExpress', tracking: d.tracking };
        setSelected(updatedPedido);
        setTimeout(async () => {
          const envios = await base44.entities.Envio.filter({ pedido_id: selected.id }, '-created_date', 1);
          if (envios?.length > 0) setEnvio(envios[0]);
        }, 1500);
      } else if (d.fallback_mode === 'manual' || d.modo === 'manual_required') {
        toast.info('API Bluex no disponible → modo manual');
        setShowManual(true);
      } else {
        toast.error(d.error || 'Error generando etiqueta');
        setShowManual(true);
      }
    } catch (_) {
      toast.info('Cambiando a modo manual...');
      setShowManual(true);
    } finally {
      setGenerando(false);
    }
  };

  const filtered = pedidos.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.cliente_nombre?.toLowerCase().includes(q) ||
      p.numero_pedido?.toLowerCase().includes(q) ||
      p.tracking?.toLowerCase().includes(q) ||
      p.ciudad?.toLowerCase().includes(q)
    );
  });

  const pendientes = pedidos.filter(p => !(p.courier === 'BlueExpress' && p.tracking)).length;
  const despachados = pedidos.length - pendientes;

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
        <a href="/admin/bluex" className="p-1.5 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </a>
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <Truck className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-sm leading-none">Despacho Rápido</h1>
          <p className="text-[11px] text-gray-400">Selecciona un pedido · genera etiqueta · imprime — sin cambiar de pantalla</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{pendientes} pendientes</span>
          <span className="text-[11px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">{despachados} despachados</span>
          <Button onClick={loadPedidos} variant="outline" size="sm" className="gap-1.5 text-xs h-7">
            <RefreshCw className="w-3 h-3" /> Actualizar
          </Button>
        </div>
      </div>

      {/* Cuerpo: 2 columnas */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Col 1: Lista pedidos ── */}
        <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-2.5 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..." className="pl-7 h-7 text-xs bg-gray-50" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-gray-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Cargando...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400 px-4">
                <Package className="w-7 h-7 mx-auto mb-1.5 opacity-25" />
                <p className="text-xs font-medium">Sin pedidos</p>
              </div>
            ) : (
              filtered.map(p => (
                <PedidoRow key={p.id} pedido={p} selected={selected} onClick={() => selectPedido(p)} />
              ))
            )}
          </div>
        </div>

        {/* ── Col 2: Panel unificado (estado + acciones + etiqueta) ── */}
        <div className="flex-1 overflow-hidden bg-white">
          <PanelDespacho
            selected={selected}
            envio={envio}
            loadingEnvio={loadingEnvio}
            generando={generando}
            showManual={showManual}
            manualTracking={manualTracking}
            manualLabelUrl={manualLabelUrl}
            setShowManual={setShowManual}
            setManualTracking={setManualTracking}
            setManualLabelUrl={setManualLabelUrl}
            onGenerarEtiqueta={({ manual = false } = {}) => (manual ? generarEtiqueta({ manual: true }) : setShowWizard(true))}
            onRecargar={() => selected && selectPedido(selected)}
          />
        </div>

      </div>

      {/* Asistente guiado con burbujas: revisa pago, dirección, cobertura y
          duplicados — si falta algo se corrige AHÍ MISMO hasta emitir la OT. */}
      {showWizard && selected && (
        <EtiquetaWizardModal
          pedido={selected}
          onClose={() => setShowWizard(false)}
          onDone={async () => {
            await loadPedidos();
            const [fresco] = await base44.entities.PedidoWeb.filter({ id: selected.id });
            if (fresco) { setSelected(fresco); cargarEnvio(fresco); }
          }}
          openLabelUrl={openPdfUrl}
        />
      )}
    </div>
  );
}