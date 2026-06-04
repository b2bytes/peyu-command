import { Sparkles, ImageIcon, ExternalLink, Download } from 'lucide-react';

/**
 * Muestra el arte que el cliente subió/generó para estampar:
 *   - mockup_url: preview del grabado sobre el producto
 *   - logo_url: archivo original que subió el cliente
 * Recolecta desde items_detalle (fuente de verdad por línea) y desde los
 * campos top-level del pedido (acceso rápido). Sin duplicados.
 *
 * variant="admin" → estilo claro para la ficha interna.
 * variant="public" → estilo Liquid Dual para el seguimiento del cliente.
 */
export default function MockupClientePreview({ pedido, variant = 'admin' }) {
  if (!pedido) return null;

  // Recolectar todas las imágenes del cliente (mockup + logo) de líneas y top-level.
  const items = Array.isArray(pedido.items_detalle) ? pedido.items_detalle : [];
  const piezas = [];
  items.forEach((it) => {
    if (it.mockup_url || it.logo_url) {
      piezas.push({
        nombre: it.nombre || 'Producto',
        mockup: it.mockup_url || '',
        logo: it.logo_url || '',
        texto: it.personalizacion || '',
        posicion: it.posicion_grabado || '',
      });
    }
  });
  // Top-level como respaldo si no hubo nada en items_detalle (pedidos simples).
  if (piezas.length === 0 && (pedido.mockup_url || pedido.logo_url)) {
    piezas.push({
      nombre: pedido.sku || 'Pedido',
      mockup: pedido.mockup_url || '',
      logo: pedido.logo_url || '',
      texto: pedido.texto_personalizacion || '',
      posicion: '',
    });
  }

  if (piezas.length === 0) return null;

  const isPublic = variant === 'public';

  const wrapCls = isPublic
    ? 'ld-card p-5'
    : 'bg-purple-50/60 border border-purple-200 rounded-xl p-4';
  const titleCls = isPublic ? 'text-ld-fg' : 'text-purple-900';
  const subCls = isPublic ? 'text-ld-fg-muted' : 'text-purple-600';

  return (
    <div className={wrapCls}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4" style={{ color: isPublic ? 'var(--ld-highlight)' : '#9333ea' }} />
        <div>
          <p className={`font-semibold text-sm ${titleCls}`}>Arte del cliente para estampar</p>
          <p className={`text-[11px] ${subCls}`}>Mockup y logo que recibimos para la personalización</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {piezas.map((p, i) => (
          <div key={i} className={`rounded-xl overflow-hidden border ${isPublic ? 'border-ld-border bg-white' : 'border-purple-200 bg-white'}`}>
            {/* Imagen principal: mockup si existe, sino el logo */}
            {(p.mockup || p.logo) && (
              <div className="relative bg-gray-50">
                <img
                  src={p.mockup || p.logo}
                  alt={`Arte de ${p.nombre}`}
                  className="w-full h-auto max-h-56 object-contain"
                  loading="lazy"
                />
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/55 text-white">
                  {p.mockup ? '✨ Mockup' : '🖼️ Logo'}
                </span>
              </div>
            )}
            <div className="p-2.5 space-y-1.5">
              <p className={`text-xs font-semibold ${isPublic ? 'text-ld-fg' : 'text-gray-900'} line-clamp-1`}>{p.nombre}</p>
              {p.texto && (
                <p className={`text-[11px] ${isPublic ? 'text-ld-fg-soft' : 'text-gray-600'}`}>
                  Grabado: <span className="font-mono">"{p.texto}"</span>
                  {p.posicion && <span className="capitalize"> · {p.posicion}</span>}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-0.5">
                {p.mockup && (
                  <a href={p.mockup} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:underline">
                    <ExternalLink className="w-3 h-3" /> Ver mockup
                  </a>
                )}
                {p.logo && (
                  <a href={p.logo} target="_blank" rel="noreferrer" download
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline">
                    <Download className="w-3 h-3" /> {p.mockup ? 'Logo original' : 'Descargar logo'}
                  </a>
                )}
                {!p.mockup && !p.logo && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                    <ImageIcon className="w-3 h-3" /> Sin arte adjunto
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}