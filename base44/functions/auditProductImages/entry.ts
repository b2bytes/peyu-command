// ============================================================================
// auditProductImages — Identifica productos con problemas de imagen.
// Devuelve listado liviano (solo metadata) clasificado por severidad:
//   - sin_principal: imagen_url vacía
//   - sin_galeria: galeria_urls vacía
//   - imagen_dudosa: solo tiene imagen wayback/woo (no -drv- ni manual reciente)
//   - solo_promo: solo tiene imagen promocional generada por IA
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

function classifyImageSource(url) {
  if (!url) return 'none';
  const lower = url.toLowerCase();
  if (lower.includes('-drv-')) return 'drive';
  if (lower.includes('-wb-') || lower.includes('wayback')) return 'wayback';
  if (lower.includes('generated_image') || lower.includes('-ai-') || lower.includes('media.base44.com/images')) return 'ai_promo';
  if (lower.includes('peyuchile.cl') || lower.includes('woocommerce')) return 'woo';
  return 'manual';
}

function isPlaceholderUrl(url) {
  if (!url) return true;
  const lower = url.toLowerCase();
  return lower.includes('placeholder') ||
         lower.includes('no-image') ||
         lower.includes('default') ||
         lower.endsWith('.svg');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productos = await base44.asServiceRole.entities.Producto.filter({ activo: true }, '-updated_date', 500);

    const problemas = {
      sin_principal: [],
      sin_galeria: [],
      solo_promo_ai: [],
      placeholder: [],
      ok: 0,
    };

    const por_categoria = {};

    for (const p of productos) {
      const cat = p.categoria || 'Sin categoría';
      if (!por_categoria[cat]) por_categoria[cat] = { total: 0, problemas: 0 };
      por_categoria[cat].total++;

      const img = p.imagen_url || '';
      const galeria = Array.isArray(p.galeria_urls) ? p.galeria_urls : [];
      const principalSource = classifyImageSource(img);
      const hasPlaceholder = isPlaceholderUrl(img);

      const lite = {
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        categoria: cat,
        imagen_url: img,
        galeria_count: galeria.length,
        principal_source: principalSource,
      };

      let isProblem = false;

      if (!img || hasPlaceholder) {
        problemas.sin_principal.push(lite);
        isProblem = true;
      } else if (principalSource === 'ai_promo' && galeria.length === 0) {
        problemas.solo_promo_ai.push(lite);
        isProblem = true;
      }

      if (galeria.length === 0) {
        problemas.sin_galeria.push(lite);
        isProblem = true;
      }

      if (isProblem) por_categoria[cat].problemas++;
      else problemas.ok++;
    }

    return Response.json({
      ok: true,
      total: productos.length,
      ok_count: problemas.ok,
      sin_principal: problemas.sin_principal,
      sin_galeria: problemas.sin_galeria,
      solo_promo_ai: problemas.solo_promo_ai,
      por_categoria,
      summary: {
        sin_principal: problemas.sin_principal.length,
        sin_galeria: problemas.sin_galeria.length,
        solo_promo_ai: problemas.solo_promo_ai.length,
      },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});