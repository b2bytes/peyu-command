// recategorizarCatalogo
// ---------------------------------------------------------------------------
// Reasigna la categoría correcta de cada Producto activo aplicando reglas
// determinísticas sobre el nombre/SKU/descripción. Soporta dry-run (preview)
// y modo apply (escribe). Solo admin puede ejecutarlo.
//
// Categorías permitidas (enum de Producto):
//   Escritorio · Hogar · Entretenimiento · Corporativo · Carcasas B2C
//
// Reglas (orden importa — la primera que matchea gana):
//   1. Carcasas       → nombre/sku contiene "carcasa", "case", "iphone", "samsung"
//   2. Escritorio     → kit escritorio, pack escritorio, soporte celular,
//                       portalápiz, organizador escritorio, llavero soporte,
//                       mousepad, posa vasos oficina
//   3. Entretenimiento → cacho, cofre, dado, juego, posacacho
//   4. Hogar          → macetero, plato macetero, posavaso, jarrón, lámpara,
//                       contenedor cocina
//   5. Corporativo    → "corporativo" explícito en el nombre (último recurso)
//
// Cuerpo del request:
//   { dry_run: true|false }   → default true
// ---------------------------------------------------------------------------
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CATEGORIAS_VALIDAS = ['Escritorio', 'Hogar', 'Entretenimiento', 'Corporativo', 'Carcasas B2C'];

// Reglas en orden de prioridad
const REGLAS = [
  {
    categoria: 'Carcasas B2C',
    patterns: [/carcasa/i, /\bcase\b/i, /iphone/i, /samsung/i, /\bs2[0-5]\b/i, /pro\s?max/i],
  },
  {
    categoria: 'Escritorio',
    patterns: [
      /kit\s+(de\s+)?escritorio/i,
      /pack\s+(de\s+)?escritorio/i,
      /escritorio\s+(normal|pro|classic|premium)/i,
      /soporte\s+(de\s+)?celular/i,
      /llavero\s+soporte/i,
      /portal[áa]piz/i,
      /portalapices/i,
      /organizador\s+(de\s+)?escritorio/i,
      /mousepad/i,
      /posavasos?\s+oficina/i,
      /portalibros/i,
    ],
  },
  {
    categoria: 'Entretenimiento',
    patterns: [
      /\bcachos?\b/i,
      /cofre\s+(de\s+)?cachos/i,
      /\bdados?\b/i,
      /juego\s+(de\s+)?mesa/i,
      /posacachos?/i,
      /ajedrez/i,
      /domin[óo]/i,
    ],
  },
  {
    categoria: 'Hogar',
    patterns: [
      /macetero/i,
      /plato\s+(de\s+)?macetero/i,
      /posavasos?/i,           // sin "oficina" (ya cubierto en Escritorio)
      /jarr[óo]n/i,
      /l[áa]mpara/i,
      /florero/i,
      /contenedor\s+cocina/i,
      /tabla\s+(de\s+)?picar/i,
    ],
  },
];

function clasificar(producto) {
  const haystack = [
    producto.nombre || '',
    producto.sku || '',
    producto.descripcion || '',
  ].join(' ');

  for (const regla of REGLAS) {
    if (regla.patterns.some((rx) => rx.test(haystack))) {
      return regla.categoria;
    }
  }
  // Sin match → mantener categoría actual si es válida, si no → Hogar (fallback)
  if (CATEGORIAS_VALIDAS.includes(producto.categoria)) return producto.categoria;
  return 'Hogar';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false; // default true (preview)

    const productos = await base44.asServiceRole.entities.Producto.list('-created_date', 500);

    const cambios = [];
    let stats = {
      total: productos.length,
      sin_cambio: 0,
      por_categoria_destino: {},
    };

    for (const p of productos) {
      const nuevaCategoria = clasificar(p);
      if (nuevaCategoria !== p.categoria) {
        cambios.push({
          id: p.id,
          sku: p.sku,
          nombre: p.nombre,
          categoria_actual: p.categoria,
          categoria_nueva: nuevaCategoria,
        });
        stats.por_categoria_destino[nuevaCategoria] =
          (stats.por_categoria_destino[nuevaCategoria] || 0) + 1;
      } else {
        stats.sin_cambio++;
      }
    }

    // Si es dry-run, devolvemos solo el preview
    if (dryRun) {
      return Response.json({
        dry_run: true,
        stats: { ...stats, a_recategorizar: cambios.length },
        cambios, // sin cap — el catálogo es manejable
      });
    }

    // Apply: actualizar cada producto con la nueva categoría
    let aplicados = 0;
    let errores = [];
    for (const cambio of cambios) {
      try {
        await base44.asServiceRole.entities.Producto.update(cambio.id, {
          categoria: cambio.categoria_nueva,
        });
        aplicados++;
      } catch (err) {
        errores.push({ id: cambio.id, sku: cambio.sku, error: String(err?.message || err) });
      }
    }

    return Response.json({
      dry_run: false,
      stats: { ...stats, a_recategorizar: cambios.length, aplicados, errores: errores.length },
      errores: errores.slice(0, 50),
      cambios,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});