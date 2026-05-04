import { Truck, AlertTriangle, Clock, MapPin, FileText, Eye } from 'lucide-react';

const ESTADO_STYLES = {
  'Pendiente Emisión': 'bg-slate-100 text-slate-700 border-slate-200',
  'Etiqueta Generada': 'bg-blue-100 text-blue-800 border-blue-200',
  'En Bodega': 'bg-blue-100 text-blue-800 border-blue-200',
  'Retirado por Courier': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'En Tránsito': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'En Reparto': 'bg-violet-100 text-violet-800 border-violet-200',
  'Entregado': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'No Entregado': 'bg-amber-100 text-amber-800 border-amber-200',
  'Devuelto': 'bg-red-100 text-red-800 border-red-200',
  'Anulado': 'bg-slate-200 text-slate-600 border-slate-300',
  'Excepción': 'bg-red-100 text-red-800 border-red-200',
};

const TIPO_ICONS = {
  Urbano: '🏙️', Extendido: '🛣️', Extremo: '🏔️', Rural: '🌾',
};

export default function BluexShipmentRow({ envio, onClick }) {
  const ago = envio.ultimo_evento_at
    ? Math.floor((Date.now() - new Date(envio.ultimo_evento_at).getTime()) / 3600000)
    : null;

  return (
    <tr onClick={onClick} className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors group">
      <td className="px-4 py-3">
        <p className="font-poppins font-bold text-foreground text-sm">{envio.numero_pedido || '—'}</p>
        <p className="text-[10px] text-muted-foreground font-mono">{envio.tracking_number}</p>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-foreground text-sm line-clamp-1">{envio.cliente_nombre}</p>
        <p className="text-[10px] text-muted-foreground line-clamp-1">{envio.cliente_email}</p>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-base">{TIPO_ICONS[envio.tipo_destino] || '📍'}</span>
          <div className="min-w-0">
            <p className="font-medium text-foreground line-clamp-1">{envio.comuna_destino}</p>
            <p className="text-[10px] text-muted-foreground">{envio.tipo_destino}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${ESTADO_STYLES[envio.estado] || ESTADO_STYLES['Pendiente Emisión']}`}>
          {envio.estado}
        </span>
        {envio.tiene_excepcion && (
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 inline ml-1.5" />
        )}
        {envio.atrasado && envio.estado !== 'Entregado' && (
          <Clock className="w-3.5 h-3.5 text-orange-500 inline ml-1" />
        )}
      </td>
      <td className="px-3 py-3 text-[11px]">
        <p className="text-foreground line-clamp-1">{envio.ultimo_evento_descripcion || '—'}</p>
        {ago !== null && (
          <p className="text-muted-foreground">{ago < 1 ? 'hace minutos' : ago < 24 ? `hace ${ago}h` : `hace ${Math.floor(ago / 24)}d`}</p>
        )}
      </td>
      <td className="px-3 py-3 text-right text-xs tabular-nums">
        <p className="font-semibold">{envio.servicio}</p>
        <p className="text-[10px] text-muted-foreground">{envio.peso_kg}kg</p>
      </td>
      <td className="px-3 py-3 text-right">
        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:underline text-[11px] font-semibold inline-flex items-center gap-1">
          <Eye className="w-3 h-3" /> Ver
        </button>
      </td>
    </tr>
  );
}