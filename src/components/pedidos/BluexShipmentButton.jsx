import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Truck, Loader2, ExternalLink, FileText, Printer,
  Sparkles, ClipboardPaste, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * BluexShipmentButton — UI dual para emitir envío:
 *
 *   1) Modo automático: intenta llamar a la API Bluex.
 *      Si la API responde → genera OT, etiqueta y todo el flujo.
 *      Si la API no está disponible (DNS, 503) → cae a modo manual.
 *
 *   2) Modo manual: el operador genera la OT en https://b2b.bluex.cl
 *      (portal Bluex), copia el tracking y lo pega aquí. Igual creamos
 *      la entidad Envio y disparamos secuencias IA, emails y tracking.
 *
 * Esto refleja la realidad de cómo se integra Bluex en e-commerce CL:
 * la API B2B es restringida a clientes con onboarding partner.
 */
export default function BluexShipmentButton({ pedido, onShipmentCreated }) {
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualTracking, setManualTracking] = useState('');
  const [manualLabelUrl, setManualLabelUrl] = useState('');
  const [labelData, setLabelData] = useState(null);

  const handleGenerar = async ({ manual = false } = {}) => {
    if (!pedido?.id) return;
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
        toast.success(
          d.modo === 'manual'
            ? `Envío registrado · Tracking ${d.tracking}`
            : `Etiqueta generada · Tracking ${d.tracking}`
        );
        setLabelData(d);
        setShowManual(false);
        setManualTracking('');
        setManualLabelUrl('');
        onShipmentCreated?.(d);
      } else if (d.fallback_mode === 'manual' || d.modo === 'manual_required') {
        // API rechazó → invitar al operador a modo manual
        toast.info('La API Bluex no responde. Genera la OT en el portal.');
        setShowManual(true);
      } else {
        toast.error(d.error || 'No se pudo generar la etiqueta');
      }
    } catch (e) {
      // Network error: probablemente la API Bluex está caída → habilitar modo manual
      const detail = e?.response?.data;
      if (detail?.fallback_mode === 'manual' || detail?.modo === 'manual_required') {
        toast.info('Genera la OT manualmente en el portal Bluex');
        setShowManual(true);
      } else {
        toast.error('Error: ' + (detail?.error || e.message));
        setShowManual(true);
      }
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

  // ── Pedido ya tiene envío Bluex → mostrar estado ──
  if (pedido.courier === 'BlueExpress' && pedido.tracking) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-sm font-semibold py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
          <CheckCircle2 className="w-4 h-4" /> Envío registrado
        </div>
        <Link
          to="/admin/bluex"
          className="flex items-center justify-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-semibold py-2 bg-blue-50 border border-blue-200 rounded-lg w-full"
        >
          <Truck className="w-4 h-4" /> Centro Logístico · {pedido.tracking}
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <a
          href={`https://www.bluex.cl/seguimiento?n=${pedido.tracking}`}
          target="_blank" rel="noreferrer"
          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
        >
          Tracking público Bluex <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  // ── Modo manual abierto: input para pegar el tracking ──
  if (showManual) {
    return (
      <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-900">Modo manual</p>
            <p className="text-[11px] text-amber-800 leading-snug">
              1. Abre el <a href="https://b2b.bluex.cl" target="_blank" rel="noreferrer" className="underline font-semibold">portal Bluex</a>{' '}
              2. Genera la OT con peso {pedido.peso_kg || 1}kg{' '}
              3. Copia el tracking y pégalo aquí
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-amber-900 uppercase">Tracking number (OT)</label>
          <Input
            value={manualTracking}
            onChange={e => setManualTracking(e.target.value)}
            placeholder="Ej: 8501234567"
            className="text-sm h-9 bg-white border-amber-300 focus-visible:ring-amber-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-amber-900 uppercase">URL etiqueta PDF (opcional)</label>
          <Input
            value={manualLabelUrl}
            onChange={e => setManualLabelUrl(e.target.value)}
            placeholder="https://b2b.bluex.cl/..."
            className="text-sm h-9 bg-white border-amber-300 focus-visible:ring-amber-500"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            onClick={() => handleGenerar({ manual: true })}
            disabled={loading || !manualTracking.trim()}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2"
            size="sm"
          >
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Registrando...</>
              : <><ClipboardPaste className="w-3.5 h-3.5" /> Registrar envío</>}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowManual(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
        <p className="text-[10px] text-amber-700 leading-tight pt-1">
          Al registrar se crea la entidad Envio, se activa el tracking interno y las secuencias IA de notificación al cliente.
        </p>
      </div>
    );
  }

  // ── Estado inicial: 2 opciones ──
  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={() => handleGenerar({ manual: false })}
        disabled={loading}
        variant="outline"
        className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 gap-2"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Intentar API Bluex</>
        )}
      </Button>

      <button
        type="button"
        onClick={() => setShowManual(true)}
        disabled={loading}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg transition disabled:opacity-50"
      >
        <ClipboardPaste className="w-3.5 h-3.5" />
        Registrar OT manual (desde portal Bluex)
      </button>

      <a
        href="https://b2b.bluex.cl"
        target="_blank" rel="noreferrer"
        className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
      >
        <Truck className="w-3 h-3" /> Abrir portal Bluex <ExternalLink className="w-2.5 h-2.5" />
      </a>

      {labelData?.label_url && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={labelData.label_base64 ? `data:application/pdf;base64,${labelData.label_base64}` : labelData.label_url}
            target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-lg hover:bg-cyan-100"
          >
            <FileText className="w-3.5 h-3.5" /> Ver etiqueta
          </a>
          <button
            onClick={imprimir}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </button>
        </div>
      )}
    </div>
  );
}