// Búsqueda inteligente de productos para el agente WhatsApp (whatsapp_peyu).
// Recibe {busqueda: "cachos"} y devuelve productos activos con nombre, sku,
// precio real, stock, colores y foto_url — listo para enviar al cliente.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const norm = (s) => (s || '').toString().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Sinónimos comunes que usan los clientes → términos del catálogo.
const SINONIMOS = {
  cacho: 'cacho', cachos: 'cacho', dados: 'cacho', dudo: 'cacho',
  carcasa: 'carcasa', funda: 'carcasa', case: 'carcasa', celular: 'carcasa', iphone: 'carcasa',
  paleta: 'paleta', paletas: 'paleta', playa: 'paleta',
  escritorio: 'escritorio', oficina: 'escritorio', lapices: 'escritorio', portalapices: 'escritorio',
  hogar: 'hogar', casa: 'hogar', cocina: 'hogar',
  regalo: '', regalos: '', empresa: '', corporativo: '',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { busqueda = '' } = await req.json().catch(() => ({}));

    const productos = await base44.asServiceRole.entities.Producto.filter({ activo: true }, '-updated_date', 300);

    const q = norm(busqueda);
    const terminos = q.split(/\s+/).filter(Boolean).map((t) => SINONIMOS[t] !== undefined ? SINONIMOS[t] : t).filter(Boolean);

    let resultados = productos;
    if (terminos.length > 0) {
      resultados = productos.filter((p) => {
        const haystack = norm(`${p.nombre} ${p.categoria} ${p.categoria_v2 || ''} ${p.descripcion || ''} ${p.sku}`);
        return terminos.some((t) => haystack.includes(t));
      });
    }

    // Prioriza productos con foto y stock.
    resultados.sort((a, b) => {
      const score = (p) => (p.imagen_url ? 2 : 0) + ((p.stock_actual || 0) > 0 ? 1 : 0);
      return score(b) - score(a);
    });

    const items = resultados.slice(0, 8).map((p) => ({
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoria_v2 || p.categoria,
      precio_b2c_clp: p.precio_b2c || null,
      precio_unitario_b2b_sin_iva: p.precio_unitario_oficial_clp || null,
      stock: p.stock_actual ?? null,
      colores: p.colores?.length ? p.colores : (p.colores_v2 || []),
      incluye: p.incluye_v2 || p.incluye || '',
      foto_url: p.imagen_url || null,
      personalizacion_gratis_desde: p.personalizacion_gratis_desde || 10,
    }));

    return Response.json({
      total_encontrados: resultados.length,
      productos: items,
      nota: items.length === 0
        ? 'Sin resultados. Reintenta con otra palabra o con busqueda vacía para ver todo el catálogo.'
        : 'Usa el sku EXACTO para generar links de pago. Envía la foto_url en línea aparte.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});