// Admin-only: analiza el historial de PedidoWeb para detectar bundles
// "Frequently Bought Together". Combina market basket analysis (co-occurrence)
// + InvokeLLM para nombrar/justificar los bundles detectados.
//
// Estrategia:
//  1. Cargar últimos N pedidos con descripcion_items.
//  2. Parsear items por pedido (split por '|', extraer SKU/nombre).
//  3. Calcular pares y triplets co-ocurrentes (frequency >= MIN_SUPPORT).
//  4. Filtrar a top combos por confidence_score.
//  5. Para cada combo, llamar InvokeLLM para que genere {name, tagline, ai_rationale, discount_pct}.
//  6. Upsert en ProductBundle (uno por combo único de SKUs).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MIN_SUPPORT = 2; // mínimo 2 pedidos para considerar un combo
const MAX_BUNDLES = 12;

// Extrae tokens probables de SKU desde el campo descripcion_items
// Formato esperado: "Nombre x3 | Otro Nombre x1 [GRABADO]"
function extractItemsFromOrder(order, productMap) {
  const raw = order.descripcion_items || '';
  if (!raw) return [];
  const matched = new Set();
  // Match por nombre de producto (más robusto que SKU porque WooCommerce no guarda SKU en items)
  const lower = raw.toLowerCase();
  for (const [sku, prod] of productMap.entries()) {
    const name = (prod.nombre || '').toLowerCase();
    if (name && name.length >= 6 && lower.includes(name.substring(0, Math.min(20, name.length)))) {
      matched.add(sku);
    }
  }
  return Array.from(matched);
}

function combinations(arr, k) {
  const result = [];
  const recur = (start, combo) => {
    if (combo.length === k) { result.push([...combo]); return; }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      recur(i + 1, combo);
      combo.pop();
    }
  };
  recur(0, []);
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    // 1. Cargar productos activos
    const products = await base44.asServiceRole.entities.Producto.list('-created_date', 200);
    const activeProducts = products.filter(p => p.activo !== false && p.sku);
    const productMap = new Map(activeProducts.map(p => [p.sku, p]));

    // 2. Cargar últimos pedidos
    const orders = await base44.asServiceRole.entities.PedidoWeb.list('-created_date', 500);
    const validOrders = orders.filter(o => o.estado !== 'Cancelado' && o.descripcion_items);

    if (validOrders.length < 5) {
      return Response.json({
        ok: false,
        message: `Solo hay ${validOrders.length} pedidos válidos. Se necesitan al menos 5 para analizar patrones.`,
        bundles_created: 0,
      });
    }

    // 3. Por cada pedido, extraer SKUs presentes
    const orderItems = validOrders.map(o => extractItemsFromOrder(o, productMap)).filter(items => items.length >= 2);

    // 4. Contar co-ocurrencias de pares y triplets
    const coCount = new Map(); // key = sku1|sku2|... (sorted) → count
    for (const items of orderItems) {
      const sortedItems = [...items].sort();
      for (const k of [2, 3]) {
        if (sortedItems.length < k) continue;
        for (const combo of combinations(sortedItems, k)) {
          const key = combo.join('|');
          coCount.set(key, (coCount.get(key) || 0) + 1);
        }
      }
    }

    // 5. Filtrar combos con soporte suficiente
    const candidates = [];
    for (const [key, count] of coCount.entries()) {
      if (count < MIN_SUPPORT) continue;
      const skus = key.split('|');
      const support = count / orderItems.length;
      // Lift: P(A∩B) / (P(A) × P(B)) — pero simplificamos: usamos count directo
      const confidence = Math.min(100, Math.round(support * 100 + count * 8));
      candidates.push({ skus, count, confidence });
    }

    candidates.sort((a, b) => b.confidence - a.confidence);
    const topCombos = candidates.slice(0, MAX_BUNDLES);

    if (topCombos.length === 0) {
      return Response.json({
        ok: false,
        message: 'No se encontraron patrones de co-ocurrencia suficientes.',
        bundles_created: 0,
      });
    }

    // 6. Para cada combo, generar nombre/tagline/rationale con IA
    const bundlesData = [];
    for (const combo of topCombos) {
      const productsInfo = combo.skus.map(sku => {
        const p = productMap.get(sku);
        return p ? { sku, nombre: p.nombre, categoria: p.categoria, precio: p.precio_b2c } : null;
      }).filter(Boolean);

      if (productsInfo.length < 2) continue;

      const llmPrompt = `Eres un experto en e-commerce de regalos sostenibles para PEYU Chile.
Análisis: estos productos fueron comprados JUNTOS en ${combo.count} pedidos diferentes.

Productos del bundle:
${productsInfo.map((p, i) => `${i + 1}. ${p.nombre} (${p.categoria}) - $${p.precio?.toLocaleString('es-CL') || '?'}`).join('\n')}

Genera un nombre comercial atractivo en español, una tagline corta, un descuento sugerido razonable y el racional.

Reglas:
- "name": 3-6 palabras, llamativo, con personalidad chilena/sostenible (ej: "Pack Oficina Eco", "Combo Regalo Perfecto").
- "tagline": 5-9 palabras explicando el beneficio (ej: "Lo que tus clientes compran juntos").
- "discount_pct": entero entre 8 y 18 según fuerza del combo. Más productos = más descuento.
- "ai_rationale": 1-2 frases explicando POR QUÉ van juntos (categoría, ocasión, complemento).`;

      let llmResult;
      try {
        const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: llmPrompt,
          response_json_schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              tagline: { type: 'string' },
              discount_pct: { type: 'number' },
              ai_rationale: { type: 'string' },
            },
            required: ['name', 'tagline', 'discount_pct', 'ai_rationale'],
          },
        });
        llmResult = res;
      } catch (e) {
        console.warn('LLM failed for bundle:', combo.skus, e.message);
        llmResult = {
          name: `Pack ${productsInfo[0].categoria}`,
          tagline: 'Comprados juntos frecuentemente',
          discount_pct: 12,
          ai_rationale: `Estos ${productsInfo.length} productos fueron comprados juntos en ${combo.count} pedidos.`,
        };
      }

      const anchor = productsInfo[0].sku;
      const description = productsInfo.map(p => p.nombre).join(' + ');

      bundlesData.push({
        name: llmResult.name,
        description,
        tagline: llmResult.tagline,
        product_skus: combo.skus,
        anchor_sku: anchor,
        discount_pct: Math.max(8, Math.min(18, llmResult.discount_pct || 12)),
        co_occurrence_count: combo.count,
        confidence_score: combo.confidence,
        ai_rationale: llmResult.ai_rationale,
        source: 'ai_history_analysis',
        active: true,
        last_analyzed_at: new Date().toISOString(),
      });
    }

    // 7. Upsert: borrar bundles ai existentes y crear nuevos (estrategia simple)
    const existingAI = await base44.asServiceRole.entities.ProductBundle.filter({ source: 'ai_history_analysis' });
    for (const old of existingAI) {
      try { await base44.asServiceRole.entities.ProductBundle.delete(old.id); } catch {}
    }

    const created = await base44.asServiceRole.entities.ProductBundle.bulkCreate(bundlesData);

    return Response.json({
      ok: true,
      orders_analyzed: orderItems.length,
      candidates_found: candidates.length,
      bundles_created: created?.length || bundlesData.length,
      bundles: bundlesData.map(b => ({ name: b.name, skus: b.product_skus, count: b.co_occurrence_count })),
    });
  } catch (error) {
    console.error('analyzeBundlesFromHistory error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});