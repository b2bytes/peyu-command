// ============================================================================
// vendedorBuscarProductos — Herramienta de búsqueda RÁPIDA del vendedor IA.
// 1) Búsqueda semántica en Pinecone (índice peyu-brain, namespace products).
// 2) Fallback por keywords + sinónimos chilenos si Pinecone no responde.
// Devuelve productos REALES compactos con precio B2C, tramos B2B, stock,
// colores e imagen — todo en UNA llamada para que el agente cotice sin
// múltiples lecturas de entidad.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const INDEX_NAME = 'peyu-brain';
let cachedHost = null;

async function getIndexHost(apiKey) {
  if (cachedHost) return cachedHost;
  const r = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2025-01' },
  });
  if (!r.ok) throw new Error('Índice Pinecone no encontrado');
  const d = await r.json();
  cachedHost = d.host;
  return cachedHost;
}

const norm = (s) => (s || '').toString().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Sinónimos chilenos → términos del catálogo (fallback keyword).
const SINONIMOS = {
  cacho: 'cacho', cachos: 'cacho', dados: 'cacho', dudo: 'cacho',
  carcasa: 'carcasa', funda: 'carcasa', case: 'carcasa', celular: 'carcasa', iphone: 'carcasa',
  paleta: 'paleta', paletas: 'paleta', playa: 'paleta',
  escritorio: 'escritorio', oficina: 'escritorio', lapices: 'escritorio', portalapices: 'escritorio',
  hogar: 'hogar', casa: 'hogar', cocina: 'hogar', macetero: 'macetero', maceta: 'macetero',
  posavaso: 'posavaso', posavasos: 'posavaso', llavero: 'llavero',
  regalo: '', regalos: '', empresa: '', corporativo: '',
};

function project(p) {
  return {
    sku: p.sku,
    nombre: p.nombre,
    categoria: p.categoria_v2 || p.categoria,
    precio_b2c_con_iva: p.precio_b2c || null,
    precio_b2b_tramos_neto: p.precio_b2b_tramos || null,
    stock: p.stock_actual ?? null,
    colores: p.colores?.length ? p.colores : (p.colores_v2 || []),
    incluye: p.incluye_v2 || p.incluye || '',
    dimensiones: p.dim_detalle_v2 || p.dimensiones || null,
    personalizacion_gratis_desde: p.personalizacion_gratis_desde || 10,
    imagen_url: p.imagen_url || null,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const { busqueda = '' } = await req.json().catch(() => ({}));

    // Catálogo activo (fuente de verdad de precios/stock; Pinecone solo rankea).
    const productos = await sr.entities.Producto.filter({ activo: true }, '-updated_date', 300);
    const bySku = {};
    const byId = {};
    for (const p of productos) {
      if (p.sku) bySku[p.sku] = p;
      byId[p.id] = p;
    }

    let resultados = [];

    // 1) Pinecone semántico (best-effort, nunca bloquea la respuesta).
    if (busqueda.trim()) {
      try {
        const apiKey = Deno.env.get('PINECONE_API_KEY');
        if (apiKey) {
          const host = await getIndexHost(apiKey);
          const res = await fetch(`https://${host}/records/namespaces/products/search`, {
            method: 'POST',
            headers: {
              'Api-Key': apiKey,
              'Content-Type': 'application/json',
              'X-Pinecone-API-Version': '2025-01',
            },
            body: JSON.stringify({ query: { inputs: { text: busqueda }, top_k: 8 } }),
          });
          if (res.ok) {
            const data = await res.json();
            const hits = data?.result?.hits || [];
            for (const h of hits) {
              const f = h.fields || {};
              const p = (f.sku && bySku[f.sku])
                || byId[String(h._id).replace(/^producto[_-]/, '')]
                || null;
              if (p && !resultados.includes(p)) resultados.push(p);
            }
          }
        }
      } catch { /* fallback keyword */ }
    }

    // 2) Fallback por keywords + sinónimos.
    if (resultados.length === 0) {
      const q = norm(busqueda);
      const terminos = q.split(/\s+/).filter(Boolean)
        .map((t) => (SINONIMOS[t] !== undefined ? SINONIMOS[t] : t)).filter(Boolean);
      resultados = terminos.length === 0 ? [...productos] : productos.filter((p) => {
        const hay = norm(`${p.nombre} ${p.categoria} ${p.categoria_v2 || ''} ${p.descripcion || ''} ${p.sku}`);
        return terminos.some((t) => hay.includes(t));
      });
      resultados.sort((a, b) => {
        const score = (p) => (p.imagen_url ? 2 : 0) + ((p.stock_actual || 0) > 0 ? 1 : 0);
        return score(b) - score(a);
      });
    }

    const items = resultados.slice(0, 8).map(project);
    return Response.json({
      total_encontrados: resultados.length,
      productos: items,
      nota: items.length === 0
        ? 'Sin resultados. Reintenta con otra palabra o busqueda vacía para ver todo.'
        : 'Precios B2B en precio_b2b_tramos_neto son NETOS sin IVA. Usa el sku EXACTO en los tags.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});