import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Truck, Loader2, ExternalLink, FileText, Printer } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Botón "Generar etiqueta BlueExpress" para el drawer de pedido.
 * Llama a bluexCreateShipment, crea la entidad Envio y enlaza al
 * Centro Logístico para el seguimiento detallado.
 */
export default function BluexShipmentButton({ pedido, onShipmentCreated }) {
  const [loading, setLoading] = useState(false);
  const [labelData, setLabelData] = useState(null);

  const handleGenerar = async () => {
    if (!pedido?.id) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('bluexCreateShipment', {
        pedido_id: pedido.id,
      });
      const d = res.data || {};
      if (d.ok && d.tracking) {
        toast.success(`Etiqueta generada · Tracking ${d.tracking}`);
        setLabelData(d);
        onShipmentCreated?.(d);
      } else {
        toast.error(d.error || 'No se pudo generar la etiqueta');
      }
    } catch (e) {
      toast.error('Error: ' + e.message);
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

  // Si ya tiene tracking de Bluex
  if (pedido.courier === 'BlueExpress' && pedido.tracking) {
    return (
      <div className="space-y-2">
        <Link
          to="/admin/bluex"
          className="flex items-center justify-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-semibold py-2 bg-blue-50 border border-blue-200 rounded-lg w-full"
        >
          <Truck className="w-4 h-4" /> Ver en Centro Logístico · {pedido.tracking}
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

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleGenerar}
        disabled={loading}
        variant="outline"
        className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 gap-2"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
        ) : (
          <><Truck className="w-4 h-4" /> Generar etiqueta BlueExpress</>
        )}
      </Button>
      {labelData?.label_url && (
        <div className="grid grid-cols-2 gap-2">
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