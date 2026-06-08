import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Package, Download, Truck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BluexShipmentPanel({ proposalId, proposal, onShipmentCreated }) {
  const [loading, setLoading] = useState(false);
  const [shipment, setShipment] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState('');

  // Buscar shipment existente para esta propuesta
  useEffect(() => {
    if (!proposalId) return;
    const loadShipment = async () => {
      try {
        const envios = await base44.entities.Envio.filter({ pedido_id: proposalId }, '-created_date', 1);
        if (envios?.length > 0) {
          setShipment(envios[0]);
        }
      } catch (e) {
        console.warn('No shipment found:', e?.message);
      }
    };
    loadShipment();
  }, [proposalId]);

  const createShipment = async () => {
    if (!proposal) {
      setError('Propuesta no encontrada');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('bluexCreateShipment', {
        proposal_id: proposalId,
        cliente_nombre: proposal.contacto,
        cliente_email: proposal.email,
        cliente_telefono: proposal.numero || '',
        direccion_destino: proposal.direccion_entrega,
        comuna_destino: proposal.comuna_entrega,
        peso_kg: 0.5, // Default para propuestas
        valor_declarado: proposal.total || 0,
      });

      if (res.data?.ok) {
        setShipment(res.data.envio);
        onShipmentCreated?.(res.data.envio);
      } else {
        setError(res.data?.error || 'Error al crear envío');
      }
    } catch (e) {
      setError(e.message || 'Error en la creación del envío');
    } finally {
      setLoading(false);
    }
  };

  const getLabel = async () => {
    if (!shipment?.tracking_number) {
      setError('No hay número de tracking');
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('bluexGetLabel', {
        tracking_number: shipment.tracking_number,
      });
      if (res.data?.label_url) {
        window.open(res.data.label_url, '_blank');
      } else {
        setError('No se pudo obtener la etiqueta');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const trackShipment = async () => {
    if (!shipment?.tracking_number) {
      setError('No hay número de tracking');
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('bluexTrackShipment', {
        tracking_number: shipment.tracking_number,
      });
      if (res.data?.estado) {
        setTracking(res.data);
      } else {
        setError('No se pudo obtener tracking');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#EBE3D6] rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Package className="w-5 h-5 text-[#0F8B6C]" />
        <h3 className="font-bold text-[#2A2420]">BlueExpress Shipping</h3>
      </div>

      {error && (
        <div className="text-xs text-[#D96B4D] bg-[#D96B4D]/10 border border-[#D96B4D]/30 rounded-lg p-2">
          {error}
        </div>
      )}

      {!shipment ? (
        <button
          onClick={createShipment}
          disabled={loading}
          className="w-full h-10 rounded-lg bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</>
          ) : (
            <><Truck className="w-4 h-4" /> Crear envío BlueExpress</>
          )}
        </button>
      ) : (
        <div className="space-y-2.5">
          <div className="bg-[#FAF7F2] border border-[#EBE3D6] rounded-lg p-3">
            <p className="text-[11px] text-[#A78B6F] font-bold mb-1">Tracking</p>
            <p className="text-sm font-bold text-[#2A2420] font-mono">{shipment.tracking_number}</p>
            <p className="text-[10px] text-[#A78B6F] mt-1">
              Estado: <span className="font-bold text-[#0F8B6C]">{shipment.estado}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={getLabel}
              disabled={loading}
              className="flex-1 h-9 rounded-lg bg-[#0F8B6C]/10 hover:bg-[#0F8B6C]/20 text-[#0F8B6C] font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Etiqueta
            </button>

            <button
              onClick={trackShipment}
              disabled={loading}
              className="flex-1 h-9 rounded-lg bg-[#0F8B6C]/10 hover:bg-[#0F8B6C]/20 text-[#0F8B6C] font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Truck className="w-3.5 h-3.5" />
              )}
              Tracking
            </button>
          </div>

          {tracking && (
            <div className="bg-[#0F8B6C]/5 border border-[#0F8B6C]/20 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0F8B6C]" />
                <p className="text-xs font-bold text-[#0F8B6C]">{tracking.estado}</p>
              </div>
              {tracking.ultimo_evento_descripcion && (
                <p className="text-[10px] text-[#4B4F54]">{tracking.ultimo_evento_descripcion}</p>
              )}
              {tracking.ultimo_evento_at && (
                <p className="text-[9px] text-[#A78B6F]">
                  {new Date(tracking.ultimo_evento_at).toLocaleString('es-CL')}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}