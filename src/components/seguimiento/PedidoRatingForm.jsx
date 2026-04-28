import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Star, Send, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * Form de calificación post-entrega.
 * Recolecta: rating producto, rating servicio, rating envío, NPS, comentario.
 *
 * Props:
 *   pedido: PedidoWeb
 *   onSubmitted(resena): callback al guardar
 */
const StarRow = ({ label, value, onChange, sublabel }) => (
  <div>
    <div className="flex items-baseline justify-between mb-1.5">
      <label className="text-sm font-semibold text-gray-900">{label}</label>
      {sublabel && <span className="text-xs text-gray-400">{sublabel}</span>}
    </div>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="p-1 transition-transform hover:scale-110"
          aria-label={`${s} estrella${s > 1 ? 's' : ''}`}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              s <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  </div>
);

export default function PedidoRatingForm({ pedido, onSubmitted }) {
  const [ratingProducto, setRatingProducto] = useState(0);
  const [ratingServicio, setRatingServicio] = useState(0);
  const [ratingEnvio, setRatingEnvio] = useState(0);
  const [nps, setNps] = useState(null);
  const [comentario, setComentario] = useState('');
  const [publicar, setPublicar] = useState(true);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (ratingProducto === 0 || ratingServicio === 0) {
      setError('Por favor califica al menos el producto y el servicio.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resena = await base44.entities.ResenaPedido.create({
        pedido_id: pedido.id,
        numero_pedido: pedido.numero_pedido,
        cliente_email: pedido.cliente_email,
        cliente_nombre: pedido.cliente_nombre,
        rating_producto: ratingProducto,
        rating_servicio: ratingServicio,
        rating_envio: ratingEnvio || ratingServicio,
        nps: nps !== null ? nps : undefined,
        comentario: comentario.trim() || undefined,
        recomendaria: nps !== null ? nps >= 7 : undefined,
        publicar_review: publicar,
      });

      // Guardar calificación en el pedido para análisis rápido
      try {
        const promedio = Math.round((ratingProducto + ratingServicio + (ratingEnvio || ratingServicio)) / 3);
        await base44.entities.PedidoWeb.update(pedido.id, { calificacion_cliente: promedio });
      } catch {}

      setEnviado(true);
      onSubmitted?.(resena);
    } catch (e) {
      setError(e.message || 'No pudimos guardar tu reseña. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-poppins font-bold text-xl text-emerald-900">¡Gracias por tu reseña!</h3>
        <p className="text-sm text-emerald-700 mt-2">Tu opinión nos ayuda a mejorar y a otros clientes a decidirse.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          <h3 className="font-poppins font-bold text-lg text-gray-900">Califica tu experiencia</h3>
        </div>
        <p className="text-xs text-gray-500">Tu opinión es anónima públicamente, solo nos ayuda a mejorar.</p>
      </div>

      <StarRow
        label="Calidad del producto"
        sublabel="¿Cumplió tus expectativas?"
        value={ratingProducto}
        onChange={setRatingProducto}
      />

      <StarRow
        label="Atención y servicio"
        sublabel="Comunicación, resolución de dudas"
        value={ratingServicio}
        onChange={setRatingServicio}
      />

      <StarRow
        label="Envío y empaque"
        sublabel="Tiempos, estado del paquete"
        value={ratingEnvio}
        onChange={setRatingEnvio}
      />

      {/* NPS */}
      <div>
        <label className="text-sm font-semibold text-gray-900 block mb-2">
          ¿Recomendarías PEYU a un amigo?
        </label>
        <div className="grid grid-cols-11 gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNps(n)}
              className={`h-9 rounded-lg text-xs font-bold transition-all ${
                nps === n
                  ? n >= 9 ? 'bg-emerald-500 text-white scale-110' :
                    n >= 7 ? 'bg-yellow-500 text-white scale-110' :
                    'bg-red-500 text-white scale-110'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
          <span>Nunca</span>
          <span>Sin duda</span>
        </div>
      </div>

      {/* Comentario */}
      <div>
        <label className="text-sm font-semibold text-gray-900 block mb-1.5">
          Comentario <span className="text-xs text-gray-400 font-normal">(opcional)</span>
        </label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value.slice(0, 500))}
          placeholder="Cuéntanos qué te gustó o qué podemos mejorar..."
          rows={4}
          className="w-full text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 focus:ring-0 p-3 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{comentario.length}/500</p>
      </div>

      <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={publicar}
          onChange={(e) => setPublicar(e.target.checked)}
          className="mt-0.5 rounded border-gray-300"
        />
        <span>Permite que mostremos esta reseña en la ficha del producto (sin tu email).</span>
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
          {error}
        </div>
      )}

      <Button
        onClick={submit}
        disabled={loading}
        className="w-full h-12 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4" /> Enviar reseña</>}
      </Button>
    </div>
  );
}