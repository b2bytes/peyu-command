import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Truck, Loader2, Printer, FileText, CheckCircle2, Package,
  User, Phone, MapPin, Copy, Check, ExternalLink, RefreshCw,
  ClipboardPaste, AlertCircle, Sparkles, ChevronRight, Search,
  ArrowLeft
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// DESPACHO RÁPIDO — Todo el flujo de despacho en una sola pantalla
// Panel izquierdo: lista pedidos listos para despachar
// Panel derecho: ficha completa + etiqueta + acciones inline
// ─────────────────────────────────────────────────────────

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
        <p className="text-[10px] uppercase text-gray-400 font-bold">{label}</p>
        <p className="text-sm text-gray-900 font-semibold truncate">{value}</p>
      </div>
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3 h-3 text-gray-300 group-hover:text-blue-500" />}
    </button>
  );
}

function PedidoRow({ pedido, selected, onClick }) {
  const isSelected = selected?.id === pedido.id;
  const yaDespachado = pedido.courier === 'BlueExpress' && pedido.tracking;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border-b border-gray-100 transition-colors flex items-start gap-3 ${
        isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50'
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
        yaDespachado ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
      }`}>
        {yaDespachado ? <CheckCircle2 className="w-4 h-4" /> : <Package className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="font-bold text-gray-900 text-sm truncate">{pedido.numero_pedido || pedido.id.slice(-6)}</p>
          <span className="text-xs font-bold text-gray-500 flex-shrink-0">{fmtClp(pedido.total)}</span>
        </div>
        <p className="text-xs text-gray-600 truncate">{pedido.cliente_nombre}</p>
        <p className="text-[11px] text-gray-400 truncate">{pedido.ciudad || pedido.direccion_envio}</p>
        {yaDespachado && (
          <p className="text-[10px] font-mono text-green-600 truncate mt-0.5">{pedido.tracking}</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
    </button>
  );
}

function EtiquetaPanel({ envio }) {
  const labelSrc = envio?.label_base64
    ? `data:application/pdf;base64,${envio.label_base64}`
    : envio?.label_url || null;

  if (!envio) return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
      <FileText className="w-12 h-12 mb-3 opacity-30" />
      <p className="font-semibold text-gray-500">Sin etiqueta generada</p>
      <p className="text-sm mt-1 text-center">Genera la OT con el botón de arriba para ver la etiqueta aquí</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Info OT */}
      <div className="p-3 bg-blue-600 text-white flex items-center justify-between">
        <div>
          <p className="text-xs opacity-75">Tracking OT</p>
          <p className="font-mono font-bold">{envio.tracking_number}</p>
        </div>
        <div className="flex gap-2">
          {labelSrc && (
            <a
              href={labelSrc}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </a>
          )}
          <a
            href={`https://ecommerce.blue.cl/`}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Portal
          </a>
        </div>
      </div>

      {/* Etiqueta embebida */}
      <div className="flex-1 bg-gray-100 relative">
        {labelSrc ? (
          <iframe
            src={labelSrc}
            className="w-full h-full border-0"
            title="Etiqueta BlueExpress"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
            <FileText className="w-10 h-10 text-gray-300" />
            <p className="text-sm text-gray-500 text-center font-medium">PDF no disponible localmente</p>
            <a
              href={`https://ecommerce.blue.cl/etiquetas/${envio.tracking_number}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition"
            >
              <ExternalLink className="w-4 h-4" /> Descargar desde portal Bluex
            </a>
            <a
              href={`https://www.bluex.cl/seguimiento?n=${envio.tracking_number}`}
              target="_blank" rel="noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Ver tracking público
            </a>
          </div>
        )}
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
  const [manualTracking, setManualTracking] = useState('');
  const [manualLabelUrl, setManualLabelUrl] = useState('');

  const loadPedidos = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.PedidoWeb.filter(
      { payment_status: 'paid' },
      '-created_date', 80
    );
    // Mostrar los que están en estados despachables O ya despachados con Bluex
    const relevantes = (data || []).filter(p =>
      ESTADOS_DESPACHABLES.includes(p.estado) || (p.courier === 'BlueExpress' && p.tracking)
    );
    setPedidos(relevantes);
    setLoading(false);
  }, []);

  useEffect(() => { loadPedidos(); }, [loadPedidos]);

  const selectPedido = useCallback(async (pedido) => {
    setSelected(pedido);
    setEnvio(null);
    setShowManual(false);
    setManualTracking('');
    setManualLabelUrl('');

    if (pedido.tracking) {
      setLoadingEnvio(true);
      try {
        const envios = await base44.entities.Envio.filter({ pedido_id: pedido.id }, '-created_date', 1);
        if (envios?.length > 0) setEnvio(envios[0]);
      } catch (e) { /* sin envío registrado aún */ }
      setLoadingEnvio(false);
    }
  }, []);

  const generarEtiqueta = async ({ manual = false } = {}) => {
    if (!selected?.id) return;
    if (manual && !manualTracking.trim()) {
      toast.error('Ingresa el tracking del portal Bluex');
      return;
    }
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
        toast.success(`✓ Envío registrado · Tracking ${d.tracking}`);
        setShowManual(false);
        setManualTracking('');
        // Recargar envío generado
        await loadPedidos();
        const updatedPedido = { ...selected, courier: 'BlueExpress', tracking: d.tracking };
        setSelected(updatedPedido);
        // Buscar el envío creado
        setTimeout(async () => {
          const envios = await base44.entities.Envio.filter({ pedido_id: selected.id }, '-created_date', 1);
          if (envios?.length > 0) setEnvio(envios[0]);
        }, 1500);
      } else if (d.fallback_mode === 'manual' || d.modo === 'manual_required') {
        toast.info('API Bluex no disponible → usa modo manual');
        setShowManual(true);
      } else {
        toast.error(d.error || 'Error generando etiqueta');
        setShowManual(true);
      }
    } catch (e) {
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

  const yaDespachado = selected?.courier === 'BlueExpress' && selected?.tracking;

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <a href="/admin/bluex" className="p-1.5 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </a>
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 leading-none">Despacho Rápido</h1>
          <p className="text-xs text-gray-400 mt-0.5">Todo el flujo de envío en una sola pantalla</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full">
            {pedidos.filter(p => !(p.courier === 'BlueExpress' && p.tracking)).length} pendientes
          </span>
          <Button onClick={loadPedidos} variant="outline" size="sm" className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </Button>
        </div>
      </div>

      {/* Cuerpo: 3 columnas */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Columna 1: Lista pedidos ── */}
        <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar pedido..."
                className="pl-8 h-8 text-sm bg-gray-50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400 px-4">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Sin pedidos pendientes</p>
              </div>
            ) : (
              filtered.map(p => (
                <PedidoRow key={p.id} pedido={p} selected={selected} onClick={() => selectPedido(p)} />
              ))
            )}
          </div>
        </div>

        {/* ── Columna 2: Ficha del pedido + acciones ── */}
        <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <Truck className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-semibold text-gray-500 text-center">Selecciona un pedido para gestionar el despacho</p>
            </div>
          ) : (
            <>
              {/* Cabecera pedido */}
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-gray-900">{selected.numero_pedido}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    yaDespachado ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {yaDespachado ? 'Despachado' : selected.estado}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{selected.cliente_nombre}</p>
                <p className="text-xs text-gray-400">{selected.descripcion_items}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Datos destinatario con copy */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Datos para portal Bluex</p>
                  <CopyField icon={User} label="Destinatario" value={selected.cliente_nombre} />
                  <CopyField icon={Phone} label="Teléfono" value={selected.cliente_telefono} />
                  <CopyField icon={MapPin} label="Dirección" value={[selected.direccion_envio, selected.ciudad].filter(Boolean).join(', ')} />
                  <CopyField icon={Package} label="Referencia" value={selected.numero_pedido} />
                </div>

                {/* Info paquete */}
                {selected.notas?.includes('Bluex') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-blue-500 uppercase mb-1.5">Cotización Bluex</p>
                    <p className="text-xs text-blue-800 font-medium">{selected.notas?.match(/Bluex[^\n]*/)?.[0]}</p>
                  </div>
                )}

                {/* Tracking ya generado */}
                {yaDespachado ? (
                  <div className="space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-green-800">Envío registrado</p>
                        <p className="font-mono text-sm font-bold text-green-700">{selected.tracking}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => selectPedido(selected)}
                      disabled={loadingEnvio}
                      variant="outline"
                      className="w-full gap-2 text-sm"
                    >
                      {loadingEnvio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                      Ver etiqueta →
                    </Button>
                  </div>
                ) : showManual ? (
                  /* Modo manual */
                  <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-900">Modo manual</p>
                        <p className="text-[11px] text-amber-800">
                          1. Genera la OT en el{' '}
                          <a href="https://b2b.bluex.cl" target="_blank" rel="noreferrer" className="underline font-bold">portal Bluex</a>
                          {' '}2. Pega el tracking abajo
                        </p>
                      </div>
                    </div>
                    <Input
                      value={manualTracking}
                      onChange={e => setManualTracking(e.target.value)}
                      placeholder="Tracking OT (ej: 8501234567)"
                      className="h-9 text-sm bg-white border-amber-300"
                    />
                    <Input
                      value={manualLabelUrl}
                      onChange={e => setManualLabelUrl(e.target.value)}
                      placeholder="URL etiqueta PDF (opcional)"
                      className="h-9 text-sm bg-white border-amber-300"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => generarEtiqueta({ manual: true })}
                        disabled={generando || !manualTracking.trim()}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2"
                        size="sm"
                      >
                        {generando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardPaste className="w-3.5 h-3.5" />}
                        Registrar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowManual(false)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  /* Botones de acción */
                  <div className="space-y-2">
                    <Button
                      onClick={() => generarEtiqueta({ manual: false })}
                      disabled={generando}
                      className="w-full gap-2 font-bold h-11 text-white"
                      style={{ background: 'linear-gradient(135deg,#0066CC,#0080FF)' }}
                    >
                      {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {generando ? 'Generando etiqueta...' : 'Generar etiqueta Bluex'}
                    </Button>
                    <button
                      onClick={() => setShowManual(true)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl transition"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" /> Ingresar OT manual (portal Bluex)
                    </button>
                    <a
                      href="https://b2b.bluex.cl"
                      target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition"
                    >
                      <ExternalLink className="w-3 h-3" /> Abrir portal Bluex
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Columna 3: Etiqueta PDF ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
          {loadingEnvio ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando etiqueta...
            </div>
          ) : (
            <EtiquetaPanel envio={envio} />
          )}
        </div>
      </div>
    </div>
  );
}