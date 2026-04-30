import { useState } from 'react';
import { Copy, Check, ExternalLink, Truck, Package, MapPin, User, Phone, AlertTriangle } from 'lucide-react';

/**
 * Tarjeta de despacho manual para BlueExpress.
 *
 * Mientras la API oficial de BlueExpress no esté activa (esperando PDF), esta
 * tarjeta concentra TODA la información que el equipo necesita para crear la
 * orden de transporte (OT) en el portal de Bluex en menos de 30 segundos:
 *  • Datos del destinatario con copy-button
 *  • Peso facturable + servicio elegido por el cliente (EXPRESS/PRIORITY)
 *  • Costo cobrado (referencial — para conciliar contra factura Bluex)
 *  • Link directo al portal de Bluex
 *
 * Cuando la API esté lista, esta tarjeta seguirá siendo útil como fallback.
 */
export default function BluexManualDispatchCard({ pedido }) {
  // Parseamos info de envío Bluex desde las notas del pedido.
  // Formato actual generado en pages/Carrito: "Bluex EXPRESS (1.5kg) → $4.990"
  const bluexMatch = (pedido.notas || '').match(/Bluex\s+(EXPRESS|PRIORITY)\s*\((\d+\.?\d*)kg\)\s*→\s*\$([\d.,]+)/i);
  const servicio = bluexMatch?.[1] || null;
  const pesoKg = bluexMatch?.[2] || null;
  const costoReal = bluexMatch?.[3] || null;

  const direccionCompleta = [pedido.direccion_envio, pedido.ciudad].filter(Boolean).join(', ');

  return (
    <section className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5" /> Despacho BlueExpress
        </h3>
        <a
          href="https://www.blue.cl/"
          target="_blank"
          rel="noreferrer"
          className="text-[10px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
        >
          Portal Bluex <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Servicio + peso + costo */}
      {servicio ? (
        <div className="bg-white border border-blue-200 rounded-lg p-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[9px] uppercase text-gray-500 font-bold">Servicio</p>
            <p className="text-sm font-bold text-blue-700 mt-0.5">{servicio}</p>
          </div>
          <div className="border-x border-gray-200">
            <p className="text-[9px] uppercase text-gray-500 font-bold">Peso</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{pesoKg} kg</p>
          </div>
          <div>
            <p className="text-[9px] uppercase text-gray-500 font-bold">Cobrado</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">${costoReal}</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>Este pedido no tiene cotización Bluex registrada. Cotiza manualmente en el portal Bluex.</span>
        </div>
      )}

      {/* Datos para copiar al portal Bluex */}
      <div className="space-y-1.5">
        <CopyRow icon={User} label="Destinatario" value={pedido.cliente_nombre} />
        <CopyRow icon={Phone} label="Teléfono" value={pedido.cliente_telefono} />
        <CopyRow icon={MapPin} label="Dirección" value={direccionCompleta || 'Sin dirección'} />
        {pedido.numero_pedido && (
          <CopyRow icon={Package} label="Referencia" value={pedido.numero_pedido} />
        )}
      </div>

      <p className="text-[10px] text-gray-500 leading-relaxed pt-1 border-t border-blue-200">
        💡 Crea la OT en el portal Bluex con estos datos, copia el N° tracking que te entrega y pégalo abajo.
        El cliente recibirá email automático con el seguimiento.
      </p>
    </section>
  );
}

function CopyRow({ icon: Icon, label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-left group"
    >
      <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[9px] uppercase text-gray-400 font-semibold leading-tight">{label}</p>
        <p className="text-xs text-gray-900 font-medium truncate">{value}</p>
      </div>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
      ) : (
        <Copy className="w-3 h-3 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
      )}
    </button>
  );
}