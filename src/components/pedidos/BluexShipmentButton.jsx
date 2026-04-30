import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Truck, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Botón "Generar etiqueta BlueExpress" para el drawer de pedido.
 * Mientras no tengamos los endpoints oficiales, la backend function devuelve
 * status="pendiente_docs" y mostramos un aviso amigable.
 */
export default function BluexShipmentButton({ pedido, onShipmentCreated }) {
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);

  const handleGenerar = async () => {
    if (!pedido?.id) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('bluexCreateShipment', {
        pedido_id: pedido.id,
      });
      const d = res.data || {};
      if (d.status === 'pendiente_docs') {
        setPending(true);
        toast.info('Integración lista, falta documentación oficial de Bluex.');
      } else if (d.ok && d.tracking) {
        toast.success(`Etiqueta generada · Tracking ${d.tracking}`);
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

  // Si ya tiene tracking de Bluex, mostramos solo el link
  if (pedido.courier === 'BlueExpress' && pedido.tracking) {
    return (
      <a
        href={`https://www.bluex.cl/seguimiento?ot=${pedido.tracking}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-semibold py-2 bg-blue-50 border border-blue-200 rounded-lg w-full"
      >
        <Truck className="w-4 h-4" /> Tracking BlueExpress: {pedido.tracking}
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
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
      {pending && (
        <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-800 flex gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            Credenciales Bluex configuradas ✓. Pendiente recibir el PDF de endpoints
            de Bluex (escribir a <strong>soporteintegraciones@blue.cl</strong> con
            ClientAccount <strong>77069974-2-8</strong>).
          </span>
        </div>
      )}
    </div>
  );
}