import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

// Fila de cupón del Centro de Fidelización: código, beneficio, vigencia y usos,
// con toggle de activación inmediato.
const fmt = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

export default function CuponRow({ cupon, onToggle }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const expirado = cupon.fecha_expiracion && hoy > cupon.fecha_expiracion;
  const agotado = cupon.usos_max > 0 && cupon.usos_actuales >= cupon.usos_max;
  const beneficio = cupon.tipo === 'envio_gratis' ? 'Envío gratis'
    : cupon.tipo === 'porcentaje' ? `−${cupon.valor}%` : `−${fmt(cupon.valor)}`;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border bg-white">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-sm">{cupon.codigo}</span>
          <Badge variant="secondary" className="text-[10px]">{beneficio}</Badge>
          {cupon.origen === 'ruleta' && <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">🎡 Ruleta</Badge>}
          {expirado && <Badge variant="destructive" className="text-[10px]">Expirado</Badge>}
          {agotado && !expirado && <Badge variant="destructive" className="text-[10px]">Agotado</Badge>}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {cupon.email_asignado || cupon.descripcion || 'Sin descripción'}
          {cupon.minimo_compra_clp > 0 && ` · mín ${fmt(cupon.minimo_compra_clp)}`}
          {cupon.fecha_expiracion && ` · hasta ${cupon.fecha_expiracion}`}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-bold">{cupon.usos_actuales || 0}{cupon.usos_max > 0 ? `/${cupon.usos_max}` : ''}</p>
        <p className="text-[10px] text-gray-400">usos</p>
      </div>
      <Switch checked={!!cupon.activo} onCheckedChange={() => onToggle(cupon)} />
    </div>
  );
}