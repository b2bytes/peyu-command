import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, MessageSquareQuote, Loader2 } from 'lucide-react';

// Valoraciones que este cliente dejó en sus pedidos: promedio, NPS y comentarios.
export default function ClienteResenas({ email }) {
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) { setLoading(false); return; }
    base44.entities.ResenaPedido.filter({ cliente_email: email }, '-created_date', 20)
      .then((r) => setResenas(r || []))
      .catch(() => setResenas([]))
      .finally(() => setLoading(false));
  }, [email]);

  if (loading) {
    return <div className="bg-white border border-gray-200 rounded-xl p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
  }

  const promedio = resenas.length
    ? Math.round((resenas.reduce((s, r) => s + (r.rating_producto || 0), 0) / resenas.length) * 10) / 10
    : 0;
  const npsVals = resenas.filter((r) => typeof r.nps === 'number');
  const npsProm = npsVals.length
    ? Math.round((npsVals.reduce((s, r) => s + r.nps, 0) / npsVals.length) * 10) / 10
    : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
          <MessageSquareQuote className="w-4 h-4 text-amber-500" /> Valoraciones del cliente
        </h3>
        {resenas.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 text-amber-400" strokeWidth={1.8}
                  fill={s <= Math.round(promedio) ? 'currentColor' : 'transparent'} />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-900">{promedio}</span>
            <span className="text-xs text-gray-500">({resenas.length})</span>
            {npsProm !== null && <span className="text-xs text-gray-500">· NPS {npsProm}</span>}
          </div>
        )}
      </div>

      {resenas.length === 0 ? (
        <p className="text-sm text-gray-500">Este cliente aún no ha dejado valoraciones.</p>
      ) : (
        <div className="space-y-2.5">
          {resenas.map((r) => (
            <div key={r.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-700">
                  {r.numero_pedido ? `Pedido ${r.numero_pedido}` : 'Pedido'}
                </span>
                <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600">
                  <Star className="w-3 h-3" fill="currentColor" strokeWidth={0} /> {r.rating_producto}
                </span>
              </div>
              {r.comentario && <p className="text-xs text-gray-600 italic">"{r.comentario}"</p>}
              <p className="text-[11px] text-gray-400 mt-1">
                Servicio {r.rating_servicio || '—'} · Envío {r.rating_envio || '—'}
                {typeof r.nps === 'number' ? ` · NPS ${r.nps}` : ''}
                {Array.isArray(r.skus) && r.skus.length ? ` · ${r.skus.join(', ')}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}