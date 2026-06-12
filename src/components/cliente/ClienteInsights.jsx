import { useMemo } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Lightbulb, Heart } from 'lucide-react';

// Panel de inteligencia del cliente: insights calculados en vivo a partir del
// historial real (sin llamadas externas). Salud, frecuencia, tendencia y
// próxima acción sugerida — base para la futura integración con el Agente.
export default function ClienteInsights({ cliente, pedidos = [], cotizaciones = [] }) {
  const insights = useMemo(() => {
    const pagados = pedidos.filter(p => !['Cancelado', 'Reembolsado'].includes(p.estado));
    const fechas = pagados.map(p => new Date(p.fecha).getTime()).filter(t => !isNaN(t)).sort((a, b) => a - b);
    const ahora = Date.now();
    const dia = 86400000;

    // Frecuencia promedio entre compras
    let frecuencia = null;
    if (fechas.length >= 2) {
      const gaps = fechas.slice(1).map((t, i) => (t - fechas[i]) / dia);
      frecuencia = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
    }

    const diasDesdeUltima = fechas.length ? Math.floor((ahora - fechas[fechas.length - 1]) / dia) : null;

    // Tendencia: gasto últimos 90d vs 90d anteriores
    const gasto = (desde, hasta) => pagados
      .filter(p => { const t = new Date(p.fecha).getTime(); return t >= desde && t < hasta; })
      .reduce((s, p) => s + (p.total || 0), 0);
    const ult90 = gasto(ahora - 90 * dia, ahora);
    const prev90 = gasto(ahora - 180 * dia, ahora - 90 * dia);
    const tendencia = prev90 === 0 ? (ult90 > 0 ? 'subiendo' : 'plana') : ult90 > prev90 * 1.1 ? 'subiendo' : ult90 < prev90 * 0.9 ? 'bajando' : 'plana';

    // Salud del cliente (0-100)
    let salud = 50;
    if (diasDesdeUltima !== null) {
      const limite = frecuencia ? frecuencia * 1.5 : 90;
      salud = diasDesdeUltima <= limite ? 85 : diasDesdeUltima <= limite * 2 ? 55 : 25;
    }
    if (tendencia === 'subiendo') salud = Math.min(100, salud + 10);
    if (tendencia === 'bajando') salud = Math.max(0, salud - 10);
    if (cliente.estado === 'VIP') salud = Math.min(100, salud + 5);

    // Producto favorito real (por repetición en pedidos)
    const conteo = {};
    pagados.forEach(p => { if (p.sku) conteo[p.sku] = (conteo[p.sku] || 0) + 1; });
    const skuTop = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] || cliente.sku_favorito || null;

    // Cotizaciones abiertas
    const cotisAbiertas = cotizaciones.filter(c => ['Enviada', 'Borrador'].includes(c.estado)).length;

    // Próxima acción sugerida
    let accion;
    if (cotisAbiertas > 0) accion = `Tiene ${cotisAbiertas} cotización(es) sin cerrar — hacer seguimiento esta semana.`;
    else if (diasDesdeUltima === null) accion = 'Sin compras aún — enviar catálogo B2B y agendar primer contacto.';
    else if (frecuencia && diasDesdeUltima > frecuencia * 1.5) accion = `Compraba cada ~${frecuencia} días y lleva ${diasDesdeUltima} sin pedir — enviar oferta de reactivación${skuTop ? ` con ${skuTop}` : ''}.`;
    else if (tendencia === 'subiendo') accion = 'Gasto en alza — buen momento para proponer upgrade o pack corporativo.';
    else if (cliente.estado === 'VIP') accion = 'Cliente VIP al día — mantener relación con un gesto (descuento o muestra nueva).';
    else accion = 'Cliente al día — próximo recontacto según su ciclo natural de compra.';

    return { frecuencia, diasDesdeUltima, tendencia, salud, skuTop, cotisAbiertas, accion };
  }, [cliente, pedidos, cotizaciones]);

  const TrendIcon = insights.tendencia === 'subiendo' ? TrendingUp : insights.tendencia === 'bajando' ? TrendingDown : Minus;
  const trendColor = insights.tendencia === 'subiendo' ? 'text-emerald-600' : insights.tendencia === 'bajando' ? 'text-red-500' : 'text-gray-400';
  const saludColor = insights.salud >= 70 ? 'bg-emerald-500' : insights.salud >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Brain className="w-4 h-4 text-teal-600" /> Inteligencia del cliente
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Salud */}
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-1 flex items-center gap-1"><Heart className="w-3 h-3" /> Salud</p>
          <p className="text-lg font-bold text-gray-900">{insights.salud}<span className="text-xs text-gray-400">/100</span></p>
          <div className="h-1.5 rounded-full bg-gray-200 mt-1.5">
            <div className={`h-full rounded-full ${saludColor}`} style={{ width: `${insights.salud}%` }} />
          </div>
        </div>
        {/* Tendencia */}
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-1">Tendencia 90d</p>
          <p className={`text-lg font-bold capitalize flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" /> {insights.tendencia}
          </p>
        </div>
        {/* Frecuencia */}
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-1">Frecuencia</p>
          <p className="text-lg font-bold text-gray-900">{insights.frecuencia ? `~${insights.frecuencia}d` : '—'}</p>
          <p className="text-[10px] text-gray-400">entre compras</p>
        </div>
        {/* Favorito */}
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-1">Producto top</p>
          <p className="text-sm font-bold text-gray-900 truncate" title={insights.skuTop || ''}>{insights.skuTop || '—'}</p>
        </div>
      </div>

      {/* Próxima acción sugerida */}
      <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${
        insights.salud < 40 ? 'bg-red-50 border-red-200' : insights.cotisAbiertas > 0 ? 'bg-amber-50 border-amber-200' : 'bg-teal-50 border-teal-200'
      }`}>
        {insights.salud < 40
          ? <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          : insights.cotisAbiertas > 0
            ? <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            : <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />}
        <div>
          <p className="text-[10px] uppercase tracking-wide font-bold text-gray-500">Próxima acción sugerida</p>
          <p className="text-sm text-gray-800 font-medium mt-0.5">{insights.accion}</p>
        </div>
      </div>
    </div>
  );
}