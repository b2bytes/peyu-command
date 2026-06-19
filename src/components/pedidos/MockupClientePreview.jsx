import { Sparkles, ImageIcon, ExternalLink, Download } from 'lucide-react';
import CartItemThumbV2 from '@/components/shopv2/CartItemThumbV2';

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

  // Extrae el ARTE ORIGINAL para producción desde las capas de grabado (la URL
  // EXACTA que subió el cliente o el diseño PEYU elegido). NUNCA el mockup
  // compuesto: producción siempre graba la imagen original sin recortar.
  const getArteOriginal = (logoTop, capas) => {
    if (Array.isArray(capas)) {
      const conUrl = capas.find((c) => (c.tipo === 'archivo' || c.tipo === 'peyu') && c.url);
      if (conUrl?.url) return conUrl.url;
    }
    return logoTop || '';
  };

  // Recolectar todas las imágenes del cliente (mockup + logo) de líneas y top-level.
  const items = Array.isArray(pedido.items_detalle) ? pedido.items_detalle : [];
  const piezas = [];
  items.forEach((it) => {
    const tieneCapas = Array.isArray(it.capas_grabado) && it.capas_grabado.length > 0;
    if (it.mockup_url || it.logo_url || tieneCapas) {
      piezas.push({
        nombre: it.nombre || 'Producto',
        mockup: it.mockup_url || '',
        logo: it.logo_url || '',
        // Arte ORIGINAL para grabar (imagen sin recortar que subió el cliente).
        arteOriginal: getArteOriginal(it.logo_url, it.capas_grabado),
        texto: it.personalizacion || '',
        posicion: it.posicion_grabado || '',
        // Reconstrucción del diseño v2 (foto base + capas) — igual que el carrito.
        imagenBase: it.imagen_base || '',
        capas: tieneCapas ? it.capas_grabado : [],
      });
    }
  });
  // Top-level como respaldo si NINGUNA pieza tiene arte visible (mockup/logo/capas).
  // Cubre tanto pedidos simples (sin items_detalle) como pedidos cuyos items no
  // traen el arte por línea pero sí en los campos rápidos del pedido.
  const algunaConArte = piezas.some((p) => p.mockup || p.logo || p.imagenBase || (p.capas && p.capas.length));
  if (!algunaConArte && (pedido.mockup_url || pedido.logo_url)) {
    piezas.push({
      nombre: pedido.sku || pedido.descripcion_items || 'Pedido',
      mockup: pedido.mockup_url || '',
      logo: pedido.logo_url || '',
      arteOriginal: pedido.logo_url || '',
      texto: pedido.texto_personalizacion || '',
      posicion: '',
      imagenBase: '',
      capas: [],
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
            {/* Diseño v2 reconstruido (foto base + capas) — prioridad: muestra el
                grabado EXACTO que eligió el cliente. Usa imagenBase y, si no
                existe, el mockup como base para no perder nunca el grabado. */}
            {p.capas.length > 0 && (p.imagenBase || p.mockup) ? (
              <div className="relative">
                <CartItemThumbV2
                  imagen={p.imagenBase || p.mockup}
                  fallback={p.mockup || p.imagenBase}
                  capas={p.capas}
                  alt={`Arte de ${p.nombre}`}
                />
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/55 text-white z-10">
                  ✨ Tu diseño
                </span>
              </div>
            ) : (p.mockup || p.logo || p.imagenBase) ? (
              <div className="relative bg-gray-50 min-h-[120px] flex items-center justify-center">
                <img
                  src={p.mockup || p.imagenBase || p.logo}
                  alt={`Arte de ${p.nombre}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-56 object-contain"
                  loading="lazy"
                  onError={(e) => {
                    // Si falla por CDN/referrer, reintenta con cache-buster una vez.
                    if (!e.currentTarget.dataset.retried) {
                      e.currentTarget.dataset.retried = '1';
                      const base = p.mockup || p.imagenBase || p.logo;
                      e.currentTarget.src = base + (base.includes('?') ? '&' : '?') + 'r=1';
                    }
                  }}
                />
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/55 text-white">
                  {p.mockup ? '✨ Mockup' : p.imagenBase ? '✨ Tu diseño' : '🖼️ Logo'}
                </span>
              </div>
            ) : null}
            {/* ARTE ORIGINAL PARA PRODUCCIÓN — la imagen EXACTA que subió el
                cliente (o el diseño PEYU), completa y sin recortar. Es lo que
                producción debe grabar, NUNCA el mockup compuesto. */}
            {!isPublic && p.arteOriginal && (
              <div className="border-t border-purple-200 bg-emerald-50/70 p-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-[11px] font-bold text-emerald-800">Imagen original para grabar</span>
                </div>
                <div className="rounded-lg overflow-hidden border border-emerald-200 bg-white flex items-center justify-center min-h-[120px]">
                  <img
                    src={p.arteOriginal}
                    alt={`Arte original de ${p.nombre}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-72 object-contain"
                    loading="lazy"
                  />
                </div>
                <a href={p.arteOriginal} target="_blank" rel="noreferrer" download
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg py-2 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Descargar original para producción
                </a>
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
                    <ExternalLink className="w-3 h-3" /> Ver mockup (referencial)
                  </a>
                )}
                {p.logo && p.logo !== p.arteOriginal && (
                  <a href={p.logo} target="_blank" rel="noreferrer" download
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline">
                    <Download className="w-3 h-3" /> Logo original
                  </a>
                )}
                {!p.mockup && !p.logo && !p.arteOriginal && (
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