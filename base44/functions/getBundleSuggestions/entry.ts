// Público: devuelve bundles relevantes para mostrar en frontend.
//
// Modos:
//  - { mode: 'product', sku }     → bundles donde aparece ese SKU (anchor preferido).
//  - { mode: 'cart', skus: [] }   → bundles que coinciden con los SKUs del carrito.
//
// Devuelve además los productos completos (precio, imagen) para renderizar la card
// sin un round-trip extra desde el frontend.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { mode = 'product', sku, skus = [] } = body;

    const allBundles = await base44.asServiceRole.entities.ProductBundle.filter({ active: true });
    if (!allBundles || allBundles.length === 0) {
      return Response.json({ bundles: [] });
    }

    let matching = [];
    if (mode === 'product' && sku) {
      // Bundles donde aparece este SKU; priorizar los que lo tienen como anchor
      matching = allBundles
        .filter(b => Array.isArray(b.product_skus) && b.product_skus.includes(sku))
        .sort((a, b) => {
          const aIsAnchor = a.anchor_sku === sku ? 1 : 0;
          const bIsAnchor = b.anchor_sku === sku ? 1 : 0;
          if (aIsAnchor !== bIsAnchor) return bIsAnchor - aIsAnchor;
          return (b.confidence_score || 0) - (a.confidence_score || 0);
        });
    } else if (mode === 'cart' && skus.length > 0) {
      // Bundles cuyos SKUs estén MAYORMENTE en el carrito (al menos N-1 de N)
      matching = allBundles
        .map(b => {
          const inCart = (b.product_skus || []).filter(s => skus.includes(s)).length;
          const ratio = inCart / (b.product_skus?.length || 1);
          return { ...b, _inCart: inCart, _ratio: ratio };
        })
        .filter(b => b._ratio >= 0.5)
        .sort((a, b) => b._ratio - a._ratio || (b.confidence_score || 0) - (a.confidence_score || 0));
    }

    if (matching.length === 0) return Response.json({ bundles: [] });

    // Hidratar con productos completos
    const allProducts = await base44.asServiceRole.entities.Producto.list('-created_date', 200);
    const productMap = new Map(allProducts.map(p => [p.sku, p]));

    const enriched = matching.slice(0, 3).map(b => {
      const products = (b.product_skus || []).map(s => {
        const p = productMap.get(s);
        if (!p) return null;
        return {
          id: p.id,
          sku: p.sku,
          nombre: p.nombre,
          categoria: p.categoria,
          imagen_url: p.imagen_url,
          precio_b2c: p.precio_b2c || 0,
          precio_final: Math.floor((p.precio_b2c || 9990) * 0.85), // -15% online estándar PEYU
        };
      }).filter(Boolean);

      const subtotal = products.reduce((s, p) => s + p.precio_final, 0);
      const discountPct = b.discount_pct || 12;
      const bundlePrice = Math.floor(subtotal * (1 - discountPct / 100));
      const savings = subtotal - bundlePrice;

      return {
        id: b.id,
        name: b.name,
        tagline: b.tagline,
        ai_rationale: b.ai_rationale,
        discount_pct: discountPct,
        anchor_sku: b.anchor_sku,
        confidence_score: b.confidence_score,
        co_occurrence_count: b.co_occurrence_count,
        products,
        pricing: {
          subtotal_individual: subtotal,
          bundle_price: bundlePrice,
          savings,
          discount_pct: discountPct,
        },
      };
    }).filter(b => b.products.length >= 2);

    // Tracking: incrementar times_shown para los bundles devueltos (best-effort)
    for (const b of matching.slice(0, enriched.length)) {
      try {
        await base44.asServiceRole.entities.ProductBundle.update(b.id, {
          times_shown: (b.times_shown || 0) + 1,
        });
      } catch {}
    }

    return Response.json({ bundles: enriched });
  } catch (error) {
    console.error('getBundleSuggestions error:', error);
    return Response.json({ error: error.message, bundles: [] }, { status: 500 });
  }
});