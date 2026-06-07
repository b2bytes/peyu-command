import { Truck, AlertTriangle, Clock, MapPin, FileText, Eye } from 'lucide-react';

const ESTADO_STYLES = {
  'Pendiente Emisión': 'bg-slate-100 text-slate-600 border-slate-300',
  'Etiqueta Generada': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'En Bodega':         'bg-blue-100 text-blue-800 border-blue-300',
  'Retirado por Courier': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'En Tránsito':       'bg-sky-100 text-sky-800 border-sky-300',
  'En Reparto':        'bg-violet-100 text-violet-800 border-violet-300',
  'Entregado':         'bg-emerald-100 text-emerald-800 border-emerald-300',
  'No Entregado':      'bg-amber-100 text-amber-800 border-amber-300',
  'Devuelto':          'bg-red-100 text-red-800 border-red-300',
  'Anulado':           'bg-slate-200 text-slate-500 border-slate-300',
  'Excepción':         'bg-red-100 text-red-800 border-red-300',
};

const ESTADO_ICON = {
  'Pendiente Emisión':    '⏳',
  'Etiqueta Generada':    '🏷️',
  'En Bodega':            '📦',
  'Retirado por Courier': '🚚',
  'En Tránsito':          '🛣️',
  'En Reparto':           '🏃',
  'Entregado':            '✅',
  'No Entregado':         '⚠️',
  'Devuelto':             '↩️',
  'Anulado':              '❌',
  'Excepción':            '🚨',
};

const TIPO_ICONS = {
  Urbano: '🏙️', Extendido: '🛣️', Extremo: '🏔️', Rural: '🌾',
};

import { memo } from 'react';

const BluexShipmentRow = memo(function BluexShipmentRow({ envio, onClick }) {
  const ago = envio.ultimo_evento_at
    ? Math.floor((Date.now() - new Date(envio.ultimo_evento_at).getTime()) / 3600000)
    : null;

  return (
    <tr onClick={onClick} className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors group">
      <td className="px-2 sm:px-4 py-2 sm:py-3">
        <p className="font-poppins font-bold text-foreground text-xs sm:text-sm truncate">{envio.numero_pedido || '—'}</p>
        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono truncate">{envio.tracking_number}</p>
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-3">
        <p className="font-medium text-foreground text-xs sm:text-sm line-clamp-1">{envio.cliente_nombre}</p>
        <p className="text-[8px] sm:text-[10px] text-muted-foreground line-clamp-1">{envio.cliente_email}</p>
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <span className="text-sm sm:text-base flex-shrink-0">{TIPO_ICONS[envio.tipo_destino] || '📍'}</span>
          <div className="min-w-0">
            <p className="font-medium text-foreground line-clamp-1 text-xs sm:text-sm">{envio.comuna_destino}</p>
            <p className="text-[7px] sm:text-[10px] text-muted-foreground">{envio.tipo_destino}</p>
          </div>
        </div>
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <span className={`inline-flex items-center gap-0.5 sm:gap-1 text-[7px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border whitespace-nowrap ${ESTADO_STYLES[envio.estado] || ESTADO_STYLES['Pendiente Emisión']}`}>
            <span>{ESTADO_ICON[envio.estado] || '📍'}</span>
            <span className="hidden sm:inline">{envio.estado}</span>
          </span>
          {envio.tiene_excepcion && <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500 flex-shrink-0" />}
          {envio.atrasado && envio.estado !== 'Entregado' && <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 flex-shrink-0" />}
        </div>
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[9px] sm:text-[11px]">
        {envio.ultimo_evento_descripcion ? (
          <>
            <p className="text-foreground line-clamp-1">{envio.ultimo_evento_descripcion}</p>
            {ago !== null && (
              <p className="text-muted-foreground text-[7px] sm:text-[9px]">{ago < 1 ? 'hace minutos' : ago < 24 ? `hace ${ago}h` : `hace ${Math.floor(ago / 24)}d`}</p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground/60 italic">Pendiente retiro</p>
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-right text-[8px] sm:text-xs tabular-nums">
        <p className="font-semibold">{envio.servicio}</p>
        <p className="text-[7px] sm:text-[10px] text-muted-foreground">{envio.peso_kg}kg</p>
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-right">
        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:underline text-[9px] sm:text-[11px] font-semibold inline-flex items-center gap-0.5">
          <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> <span className="hidden sm:inline">Ver</span>
        </button>
      </td>
    </tr>
  );
    });

    export default BluexShipmentRow;