// Vectoriza TODO el conocimiento base de PEYU en Pinecone:
// - productos (51 SKUs)
// - políticas/FAQ (envíos, cambios, garantía, personalización)
// - brand voice (tono de marca)
// - sostenibilidad (claims ESG reales)
//
// Es idempotente: puede ejecutarse tantas veces como se quiera
// (Pinecone sobrescribe por _id).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INDEX_NAME = 'peyu-brain';

async function getIndexHost(apiKey) {
  const descRes = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2025-01' }
  });
  if (!descRes.ok) throw new Error('Índice no encontrado. Ejecuta pineconeInit primero.');
  const desc = await descRes.json();
  if (!desc?.status?.ready) throw new Error('Índice no está ready aún. Espera ~1 minuto.');
  return desc.host;
}

async function upsertBatch(host, apiKey, namespace, records) {
  const chunks = [];
  for (let i = 0; i < records.length; i += 96) chunks.push(records.slice(i, i + 96));
  let total = 0;
  for (const batch of chunks) {
    const res = await fetch(`https://${host}/records/namespaces/${namespace}/upsert`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/x-ndjson',
        'X-Pinecone-API-Version': '2025-01',
      },
      body: batch.map(r => JSON.stringify(r)).join('\n'),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Upsert ${namespace} failed: ${err}`);
    }
    total += batch.length;
  }
  return total;
}

// ═══════════ Conocimiento estático ═══════════

const FAQ_POLICIES = [
  { _id: 'faq-envios', chunk_text: 'PEYU envía a todo Chile con Starken, Chilexpress y BlueExpress. Tiempo de entrega: 3 a 7 días hábiles. Envío gratis sobre $40.000. Retiro gratuito en tiendas físicas de Providencia (F. Bilbao 3775) y Macul (P. de Valdivia 6603).', tipo: 'politica', tema: 'envios' },
  { _id: 'faq-cambios', chunk_text: 'Política de cambios y devoluciones PEYU: 10 días hábiles desde la recepción del producto. El producto debe estar sin uso, con empaque original. Productos personalizados con láser no admiten cambio salvo defecto de fabricación. Cambio por talla/color disponible según stock.', tipo: 'politica', tema: 'cambios' },
  { _id: 'faq-garantia', chunk_text: 'Garantía PEYU de 10 años contra defectos de fabricación en todos sus productos de plástico 100% reciclado. Cubre rupturas por mal proceso, deformaciones anómalas y defectos de inyección. No cubre mal uso, caídas o desgaste natural por uso intensivo.', tipo: 'politica', tema: 'garantia' },
  { _id: 'faq-personalizacion', chunk_text: 'Personalización láser UV PEYU: grabado permanente de alta precisión, disponible GRATIS desde 10 unidades (MOQ). Se graba logo, texto o diseño en áreas específicas de cada producto. Lead time con personalización: 10-14 días hábiles. Archivo recomendado: vectorial (AI, SVG, PDF) o PNG alta resolución.', tipo: 'politica', tema: 'personalizacion' },
  { _id: 'faq-lead-times', chunk_text: 'Tiempos de producción PEYU: sin personalización 5-7 días hábiles, con láser UV 10-14 días, pedidos B2B complejos (500u+ con packaging especial) 14-21 días. Pedidos express +12% sobre precio base, reducen lead time 30%.', tipo: 'politica', tema: 'lead_time' },
  { _id: 'faq-pagos', chunk_text: 'Medios de pago PEYU: WebPay (crédito y débito), transferencia bancaria, MercadoPago, tarjetas Visa/MasterCard/AMEX. Para pedidos B2B sobre $500.000 se requiere 50% de anticipo al confirmar la orden y 50% contra entrega.', tipo: 'politica', tema: 'pagos' },
  { _id: 'faq-moq-b2b', chunk_text: 'Pedidos B2B corporativos PEYU: mínimo 50 unidades para precios escalonados. Descuentos por volumen: 50-199u precio tier 1, 200-499u tier 2, 500+u tier 3 (mejor precio). Incluye gestión de proyecto dedicada y mockup gratis del producto con logo antes de producir.', tipo: 'politica', tema: 'b2b' },
  { _id: 'faq-tiendas', chunk_text: 'Tiendas físicas PEYU en Santiago: Providencia (Francisco Bilbao 3775, lunes a sábado 10-19h) y Macul (Pedro de Valdivia 6603, lunes a sábado 10-19h). Ambas con láser UV en vivo para personalización inmediata mientras esperas.', tipo: 'politica', tema: 'tiendas' },
  { _id: 'faq-contacto', chunk_text: 'Canales de contacto PEYU: WhatsApp +56 9 3376 6573 (respuesta 24/7 en horario hábil), email hola@peyuchile.com, formulario web en peyuchile.com/contacto. Atención especializada B2B vía peyuchile.com/b2b/contacto.', tipo: 'politica', tema: 'contacto' },
];

const BRAND_VOICE = [
  { _id: 'brand-mision', chunk_text: 'Misión PEYU: transformar el plástico chileno desechado en regalos corporativos con propósito. Cada producto es una prueba tangible de que la sostenibilidad no sacrifica diseño ni calidad. Regalamos futuro, no basura.', tipo: 'brand', tema: 'mision' },
  { _id: 'brand-tono', chunk_text: 'Tono de voz PEYU: cálido como un amigo chileno, profesional como un consultor experto, directo como un WhatsApp bien escrito. Nunca corporativo frío. Siempre con propósito visible pero sin sermón. Emojis con moderación (🐢 🌱 ♻️ 🎁). Nada de markdown pesado.', tipo: 'brand', tema: 'tono' },
  { _id: 'brand-valores', chunk_text: 'Valores PEYU: 1) Propósito real — cada gramo de plástico es trazable. 2) Diseño excepcional — sostenible no es feo. 3) Transparencia radical — mostramos precios, fábricas y procesos. 4) Hecho en Chile — orgullo local, cadena corta. 5) ESG genuino — B Corp en proceso, ISO reciclado real.', tipo: 'brand', tema: 'valores' },
  { _id: 'brand-dos-donts', chunk_text: 'Lo que PEYU SÍ dice: "hecho con manos chilenas", "plástico que estaba en el océano", "el regalo que cuenta una historia", "100% trazable". Lo que PEYU NUNCA dice: "producto verde" (vago), "eco-friendly" (genérico), "amigable con el planeta" (greenwashing). Siempre datos concretos: kg rescatados, litros de agua ahorrada, CO2 evitado.', tipo: 'brand', tema: 'copy' },
];

const SUSTAINABILITY = [
  { _id: 'esg-impacto', chunk_text: 'Impacto acumulado PEYU desde fundación (10+ años): más de 500.000 kg de plástico reciclado reintegrados como regalos corporativos. Equivalente a 50 millones de botellas PET rescatadas del circuito de desecho chileno.', tipo: 'esg', tema: 'impacto' },
  { _id: 'esg-materiales', chunk_text: 'Materiales PEYU certificados: Plástico 100% reciclado chileno (HDPE y PP post-consumo, procesado en Santiago) con certificación GRS en proceso. Alternativa Fibra de Trigo 100% compostable para productos desechables (vasos, platos, cubiertos).', tipo: 'esg', tema: 'materiales' },
  { _id: 'esg-calculadora', chunk_text: 'Por cada 100 productos PEYU producidos: se rescatan aproximadamente 5 kg de plástico del océano/vertederos, se ahorran 2.500 litros de agua vs plástico virgen, se evita 1,2 toneladas de CO2 equivalente, y se apoyan 4 horas de empleo local calificado.', tipo: 'esg', tema: 'calculadora' },
  { _id: 'esg-certificaciones', chunk_text: 'Certificaciones PEYU: Empresa B (en proceso de certificación final 2026), ISO 14001 gestión ambiental, GRS reciclado, Sello Chile 3R, huella de carbono medida con metodología GHG Protocol. Reportes ESG trimestrales públicos para clientes B2B.', tipo: 'esg', tema: 'certificaciones' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden - admin only' }, { status: 403 });
    }

    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ error: 'PINECONE_API_KEY missing' }, { status: 500 });

    const host = await getIndexHost(apiKey);
    const summary = {};

    // 1) PRODUCTOS (dinámico desde la entidad)
    const productos = await base44.asServiceRole.entities.Producto.filter({ activo: true });
    const productRecords = productos.map(p => ({
      _id: `prod-${p.sku}`,
      chunk_text: [
        p.nombre,
        p.descripcion || '',
        `Categoría: ${p.categoria}`,
        `Material: ${p.material}`,
        `Canal de venta: ${p.canal}`,
        p.precio_b2c ? `Precio individual (B2C): $${p.precio_b2c} CLP` : '',
        p.precio_base_b2b ? `Precio B2B desde 10u: $${p.precio_base_b2b} CLP` : '',
        p.precio_500_mas ? `Precio volumen 500+u: $${p.precio_500_mas} CLP` : '',
        p.moq_personalizacion ? `Personalización láser gratis desde ${p.moq_personalizacion}u` : '',
        p.area_laser_mm ? `Área grabable: ${p.area_laser_mm} mm` : '',
        p.garantia_anios ? `Garantía: ${p.garantia_anios} años` : '',
      ].filter(Boolean).join('. '),
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoria,
      material: p.material,
      canal: p.canal,
      precio_b2c: p.precio_b2c || 0,
      precio_base_b2b: p.precio_base_b2b || 0,
      tipo: 'producto',
    }));
    if (productRecords.length > 0) {
      summary.products = await upsertBatch(host, apiKey, 'products', productRecords);
    } else {
      summary.products = 0;
    }

    // 2) FAQ / POLÍTICAS
    summary.policies_faq = await upsertBatch(host, apiKey, 'policies_faq', FAQ_POLICIES);

    // 3) BRAND VOICE
    summary.brand_voice = await upsertBatch(host, apiKey, 'brand_voice', BRAND_VOICE);

    // 4) SOSTENIBILIDAD
    summary.sustainability = await upsertBatch(host, apiKey, 'sustainability', SUSTAINABILITY);

    const total = Object.values(summary).reduce((a, b) => a + b, 0);
    return Response.json({
      ok: true,
      message: `✅ ${total} vectores creados en peyu-brain`,
      summary,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});