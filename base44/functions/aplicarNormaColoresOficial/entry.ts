import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// aplicarNormaColoresOficial
// ----------------------------------------------------------------------------
// Aplica la NORMA OFICIAL del catálogo B2B PDF de PEYU (jun 2026):
//  1. DEDUPE CatalogoB2BOficial: el catálogo se cargó 2 veces → conserva el
//     registro más nuevo por slug y borra los duplicados.
//  2. ENRIQUECE CatalogoB2BOficial con tapitas_aprox del PDF.
//  3. NORMA DE COLORES en Producto (catálogo vivo, B2C y B2B): todos los
//     productos de Plástico 100% Reciclado llevan los colores oficiales
//     Azul, Negro, Rojo, Verde (+ Mixto en Pack 4 cachos). No toca carcasas
//     (sistema propio de 5 colores), fibra de trigo ni gift cards.
//     imagenes_por_color (fotos por color) se conserva intacto.
// ============================================================================

const COLORES_OFICIALES = ['Azul', 'Negro', 'Rojo', 'Verde'];

// tapitas_aprox por producto oficial (del PDF), matching por nombre.
const TAPITAS = [
  { re: /llavero/i, tapitas: 12 },
  { re: /soporte de celular/i, tapitas: 40 },
  { re: /notebook cl/i, tapitas: 90 },
  { re: /notebook pro/i, tapitas: 100 },
  { re: /escritorio cl/i, tapitas: 155 },
  { re: /escritorio pro/i, tapitas: 170 },
  { re: /posavasos hexagonal/i, tapitas: 90 },
  { re: /macetero peque/i, tapitas: 30 },
  { re: /macetero con plat/i, tapitas: 82 },
  { re: /l[áa]mpara/i, tapitas: 150 },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = !!body.dryRun;

    // ── 1. Dedupe CatalogoB2BOficial por slug (conserva el más nuevo) ──────
    const oficiales = await base44.asServiceRole.entities.CatalogoB2BOficial.list('-created_date', 200);
    const vistos = new Set();
    const aBorrar = [];
    for (const r of oficiales) {
      if (vistos.has(r.slug)) aBorrar.push(r);
      else vistos.add(r.slug);
    }
    if (!dryRun) {
      for (const r of aBorrar) {
        await base44.asServiceRole.entities.CatalogoB2BOficial.delete(r.id);
      }
    }

    // ── 2. Enriquecer tapitas_aprox del PDF ────────────────────────────────
    const conservados = oficiales.filter((r) => !aBorrar.includes(r));
    let tapitasActualizadas = 0;
    for (const r of conservados) {
      if (r.tapitas_aprox) continue;
      const match = TAPITAS.find((t) => t.re.test(r.nombre || ''));
      if (match) {
        if (!dryRun) {
          await base44.asServiceRole.entities.CatalogoB2BOficial.update(r.id, { tapitas_aprox: match.tapitas });
        }
        tapitasActualizadas++;
      }
    }

    // ── 3. Norma de colores oficiales en Producto (catálogo vivo) ──────────
    let productos = [];
    let skip = 0;
    while (true) {
      const page = await base44.asServiceRole.entities.Producto.list('-updated_date', 100, skip);
      if (!page || page.length === 0) break;
      productos.push(...page);
      if (page.length < 100) break;
      skip += 100;
    }

    const report = [];
    let coloresActualizados = 0;
    for (const p of productos) {
      if (p.activo === false) continue;
      if (p.categoria === 'Carcasas B2C') continue; // sistema propio 5 colores
      if (p.material !== 'Plástico 100% Reciclado') continue; // fibra = natural
      if (/gift\s*card/i.test(p.categoria || '') || /gift\s*card/i.test(p.nombre || '')) continue;

      // Pack 4 cachos: el PDF incluye además la opción Mixto.
      const esMixto = /pack\s*(de\s*)?4.*cachos/i.test(p.nombre || '');
      const oficiales4 = esMixto ? [...COLORES_OFICIALES, 'Mixto'] : COLORES_OFICIALES;

      const actuales = JSON.stringify(p.colores || []);
      if (actuales === JSON.stringify(oficiales4)) continue;

      if (!dryRun) {
        await base44.asServiceRole.entities.Producto.update(p.id, { colores: oficiales4 });
      }
      coloresActualizados++;
      report.push({ sku: p.sku, nombre: p.nombre, antes: p.colores || [], ahora: oficiales4 });
    }

    return Response.json({
      success: true,
      dry_run: dryRun,
      oficial_duplicados_borrados: aBorrar.length,
      oficial_conservados: conservados.length,
      oficial_tapitas_actualizadas: tapitasActualizadas,
      productos_colores_actualizados: coloresActualizados,
      detalle: report,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});