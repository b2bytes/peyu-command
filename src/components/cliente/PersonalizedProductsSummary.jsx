import { Sparkles, FileImage, Image as ImageIcon, Type, Palette, Upload, Download } from 'lucide-react';
import CartItemThumbV2 from '@/components/shopv2/CartItemThumbV2';

// ════════════════════════════════════════════════════════════════════════
// Resumen de productos personalizados del cliente. Extrae de los pedidos las
// líneas que tienen grabado (logo/mockup/frase) y las muestra ordenadas con
// sus archivos (logo subido + mockup generado) listos para abrir/descargar.
// ════════════════════════════════════════════════════════════════════════

const TIPO_ICON = { frase: Type, peyu: Palette, archivo: Upload };
const TIPO_LABEL = { frase: 'Frase', peyu: 'Diseño PEYU', archivo: 'Logo propio', mixto: 'Combinado' };

// Aplana los pedidos a líneas personalizadas (usa items_detalle si existe, o
// cae a los campos rápidos del pedido para pedidos antiguos).
function extraerLineasPersonalizadas(pedidos) {
  const out = [];
  (pedidos || []).forEach((p) => {
    const items = Array.isArray(p.items_detalle) && p.items_detalle.length ? p.items_detalle : null;
    if (items) {
      items.forEach((it, idx) => {
        const tieneGrabado = it.personalizacion || it.logo_url || it.mockup_url;
        if (!tieneGrabado) return;
        out.push({
          key: `${p.id}-${idx}`,
          pedido: p.numero_pedido || p.id.slice(-6),
          fecha: p.fecha,
          nombre: it.nombre || p.sku || 'Producto',
          color: it.color,
          personalizacion: it.personalizacion,
          tipo: it.tipo_personalizacion,
          logo_url: it.logo_url,
          mockup_url: it.mockup_url,
          imagen_base: it.imagen_base || '',
          capas: Array.isArray(it.capas_grabado) ? it.capas_grabado : [],
        });
      });
    } else if (p.requiere_personalizacion || p.logo_url || p.mockup_url) {
      out.push({
        key: p.id,
        pedido: p.numero_pedido || p.id.slice(-6),
        fecha: p.fecha,
        nombre: p.sku || 'Producto',
        color: p.color,
        personalizacion: p.texto_personalizacion,
        tipo: p.tipo_personalizacion,
        logo_url: p.logo_url,
        mockup_url: p.mockup_url,
        imagen_base: '',
        capas: [],
      });
    }
  });
  return out;
}

function ArchivoChip({ url, label, Icon }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg transition-colors"
    >
      <Icon className="w-3 h-3" /> {label} <Download className="w-3 h-3 opacity-60" />
    </a>
  );
}

export default function PersonalizedProductsSummary({ pedidos }) {
  const lineas = extraerLineasPersonalizadas(pedidos);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-500" /> Productos personalizados
        {lineas.length > 0 && (
          <span className="text-[11px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{lineas.length}</span>
        )}
      </h2>

      {lineas.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Este cliente aún no tiene productos personalizados</p>
      ) : (
        <div className="space-y-3">
          {lineas.map((l) => {
            const TipoIcon = TIPO_ICON[l.tipo] || Sparkles;
            return (
              <div key={l.key} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                {/* Mockup / preview — reconstruye el diseño exacto (base + capas)
                    si está disponible; si no, muestra el mockup guardado. */}
                <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {l.capas.length > 0 && (l.imagen_base || l.mockup_url) ? (
                    <CartItemThumbV2
                      imagen={l.imagen_base || l.mockup_url}
                      fallback={l.mockup_url || l.imagen_base}
                      capas={l.capas}
                      alt="Mockup"
                    />
                  ) : l.mockup_url ? (
                    <img src={l.mockup_url} alt="Mockup" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900 truncate">{l.nombre}</p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{l.pedido}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1.5">
                    {l.fecha}{l.color ? ` · ${l.color}` : ''}
                  </p>

                  {l.personalizacion && (
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md mb-2">
                      <TipoIcon className="w-3 h-3" /> {TIPO_LABEL[l.tipo] || 'Personalizado'}: {l.personalizacion}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <ArchivoChip url={l.logo_url} label="Logo" Icon={FileImage} />
                    <ArchivoChip url={l.mockup_url} label="Mockup" Icon={ImageIcon} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}