// ============================================================================
// brainIngestPoliticas · Carga las REGLAS DEL NEGOCIO al cerebro PEYU.
// ----------------------------------------------------------------------------
// Los agentes ya conocían catálogo, clientes y ventas, pero improvisaban en
// políticas (envíos, devoluciones, garantía, personalización, pagos, B2B).
// Esta función indexa esas reglas en el namespace `knowledge_base`, tomadas
// textualmente de las páginas públicas /envios y /cambios y de la fuente
// única de promesas de entrega (src/lib/delivery-promise.js).
//
// Es idempotente: cada política tiene id fijo, así que volver a ejecutarla
// actualiza el texto en vez de duplicar memoria. Ejecútala cuando cambie una
// política publicada.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { getIndexHost, upsertRecords } from '../../shared/brain-records.ts';

// Reglas reales del negocio PEYU. `id` estable = actualizable sin duplicar.
const POLITICAS: { id: string; titulo: string; texto: string; tema: string }[] = [
  {
    id: 'pol-envios-cobertura',
    tema: 'envios',
    titulo: 'Cobertura y courier',
    texto:
      'Cobertura de envíos PEYU: despachamos a todo Chile con BlueExpress Express como courier principal. ' +
      'También existe retiro presencial gratuito en las tiendas de Providencia (Av. Francisco Bilbao 3775) y Macul (Av. Pedro de Valdivia 6603), ' +
      'lunes a viernes de 10:00 a 19:00 y sábados de 11:00 a 14:00.',
  },
  {
    id: 'pol-envios-plazos',
    tema: 'envios',
    titulo: 'Plazos de entrega por zona',
    texto:
      'Plazos de entrega PEYU (preparación 0 a 1 día hábil + tránsito): Región Metropolitana 1 a 3 días hábiles (entrega en 1 día hábil si el pedido se paga antes de las 14:00 hrs); ' +
      'resto urbano (Valparaíso, Concepción, La Serena, Temuco, Maule, O\'Higgins, Ñuble, Los Ríos, Los Lagos, Atacama, Antofagasta) 2 a 5 días hábiles; ' +
      'zonas extremas o rurales (Arica y Parinacota, Tarapacá, Aysén, Magallanes) 4 a 9 días hábiles. ' +
      'Retiro en tienda: mismo día o día siguiente. Pedidos con personalización láser suman 7 a 15 días hábiles de producción. ' +
      'Hora de corte: 14:00 hrs hora de Santiago; pagos posteriores se despachan el siguiente día hábil. ' +
      'Preparamos lunes a viernes (BlueExpress no retira sábados) y BlueExpress entrega lunes a sábado, no domingos ni festivos.',
  },
  {
    id: 'pol-envios-tarifas',
    tema: 'envios',
    titulo: 'Tarifas de envío',
    texto:
      'Tarifas de envío PEYU: tarifa plana de $5.990 CLP a todo Chile y envío gratuito en compras sobre $40.000 CLP (beneficio B2C; los pedidos B2B con factura pagan siempre su envío real). ' +
      'El costo final se confirma en el checkout según peso real y destino, cotizado en línea con BlueExpress. Retiro en tienda es siempre sin costo.',
  },
  {
    id: 'pol-envios-seguimiento',
    tema: 'envios',
    titulo: 'Seguimiento de pedidos',
    texto:
      'Seguimiento PEYU: al despachar, el cliente recibe su número de tracking BlueExpress por email. ' +
      'También puede consultar el estado en la página /seguimiento ingresando su número de pedido.',
  },
  {
    id: 'pol-cambios-plazos',
    tema: 'devoluciones',
    titulo: 'Plazos de cambio y devolución',
    texto:
      'Política de cambios y devoluciones PEYU: 30 días corridos desde la recepción para solicitar devolución o cambio (plazo mayor al mínimo legal de 10 días de la Ley 21.398 Pro-Consumidor). ' +
      'Se aceptan productos defectuosos y también arrepentimiento sin defecto. Se permiten cambios por color, modelo o producto distinto. ' +
      'El reembolso demora hasta 14 días hábiles desde que el producto llega a bodega y se valida su estado.',
  },
  {
    id: 'pol-cambios-condiciones',
    tema: 'devoluciones',
    titulo: 'Condiciones y costo del retorno',
    texto:
      'Condiciones de devolución PEYU: producto sin uso, limpio, con empaque original (caja, bolsas, tags) y comprobante (boleta, factura o número de pedido); si es defectuoso, foto o video del defecto en el primer contacto. ' +
      'Costo del retorno: si el producto es defectuoso o el error es de PEYU, PEYU paga el 100% del courier de retorno; ' +
      'si es arrepentimiento, el cliente paga el retorno; si es cambio por color o modelo, el cliente paga el retorno y PEYU paga el reenvío. ' +
      'El retiro presencial en las tiendas de Providencia y Macul es gratuito.',
  },
  {
    id: 'pol-cambios-no-devolvibles',
    tema: 'devoluciones',
    titulo: 'Productos que no admiten devolución',
    texto:
      'Productos NO devolvibles en PEYU: artículos con grabado láser UV personalizado (logo, texto o diseño del cliente), productos fabricados a pedido bajo brief específico, ' +
      'Gift Cards ya canjeadas total o parcialmente, y productos higiénicos abiertos. ' +
      'Excepción importante: si el grabado tiene un defecto técnico o un error no imputable al cliente, aplica garantía y reposición sin costo. El mockup aprobado por el cliente es la referencia oficial.',
  },
  {
    id: 'pol-reembolsos',
    tema: 'pagos',
    titulo: 'Métodos de reembolso',
    texto:
      'Reembolsos PEYU: siempre por el mismo medio de pago de la compra. WebPay o tarjeta de crédito/débito: reverso al mismo plástico en 3 a 10 días hábiles según el banco. ' +
      'Transferencia bancaria: devolución a la cuenta original del cliente. Mercado Pago: reembolso a la cuenta MP o medio asociado. Gift Card: se emite una nueva Gift Card por el monto devuelto. ' +
      'Plazo total hasta 14 días hábiles desde la recepción del producto en bodega.',
  },
  {
    id: 'pol-garantia',
    tema: 'garantia',
    titulo: 'Garantía legal y garantía extendida',
    texto:
      'Garantías PEYU: garantía legal de 6 meses por defectos de fábrica según Ley 19.496, con triple opción a elección del consumidor (cambio, reparación o devolución del dinero). ' +
      'Además, garantía extendida PEYU de 10 años contra defectos estructurales del plástico 100% reciclado en condiciones normales de uso.',
  },
  {
    id: 'pol-personalizacion',
    tema: 'personalizacion',
    titulo: 'Personalización con grabado láser',
    texto:
      'Personalización láser PEYU: el grabado láser es gratis desde 10 unidades del mismo producto; bajo esa cantidad se cobra un cargo de personalización por línea. ' +
      'El cliente puede grabar una frase, un diseño PEYU o su propio logo/archivo. Antes de comprar se genera un mockup de previsualización, y ese mockup aprobado es la referencia oficial de producción. ' +
      'Los pedidos con grabado suman entre 7 y 15 días hábiles de producción y no admiten devolución por arrepentimiento.',
  },
  {
    id: 'pol-pagos-medios',
    tema: 'pagos',
    titulo: 'Medios de pago y documentos tributarios',
    texto:
      'Medios de pago PEYU: Mercado Pago (tarjetas y saldo), transferencia bancaria, WebPay Plus de Transbank y Gift Card PEYU. ' +
      'Los pedidos por transferencia quedan "por confirmar pago" hasta que el equipo valida el abono. ' +
      'Documentos: por defecto se emite boleta; para factura de empresa se exigen razón social, RUT válido y giro, y la dirección de envío se usa como dirección de facturación.',
  },
  {
    id: 'pol-b2b-condiciones',
    tema: 'b2b',
    titulo: 'Condiciones comerciales B2B',
    texto:
      'Condiciones B2B PEYU: los precios corporativos bajan por tramo de volumen (desde 10 unidades y siguientes tramos hasta 2000+ unidades) y se cotizan sin IVA. ' +
      'Las propuestas corporativas tienen una validez estándar de 15 días y contemplan un anticipo de 50% para iniciar producción. ' +
      'El pedido express tiene un recargo de 12%. Los pedidos B2B pagan su costo real de envío (no aplica el envío gratis B2C).',
  },
  {
    id: 'pol-contacto-soporte',
    tema: 'soporte',
    titulo: 'Canales de contacto y tiempos de respuesta',
    texto:
      'Contacto PEYU: email hola@peyuchile.cl, WhatsApp +56 9 3504 0242 y formulario en /soporte. ' +
      'El equipo responde en menos de 24 horas hábiles. Para devoluciones o cambios se debe indicar "Devolución pedido #XXXX" o "Cambio pedido #XXXX" con número de pedido, motivo y fotos. ' +
      'Marco legal aplicable: Ley 19.496 y Ley 21.398 Pro-Consumidor; ante discrepancias el consumidor puede acudir a Sernac (www.sernac.cl).',
  },
  {
    id: 'pol-material-impacto',
    tema: 'producto',
    titulo: 'Material y propuesta de valor',
    texto:
      'Material PEYU: los productos se fabrican con plástico 100% reciclado (tapitas recuperadas) y algunos en fibra de trigo compostable, con fabricación nacional en Chile. ' +
      'Cada producto declara cuántas tapitas plásticas aproximadamente reutiliza. Es el argumento central de sostenibilidad para clientes B2C y para regalos corporativos con impacto medible.',
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ ok: false, error: 'Solo el equipo PEYU puede cargar políticas.' }, { status: 403 });
    }

    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ ok: false, error: 'PINECONE_API_KEY no configurada' }, { status: 500 });

    const host = await getIndexHost(apiKey);
    const records = POLITICAS.map((p) => ({
      _id: p.id,
      chunk_text: `Política PEYU · ${p.titulo}. ${p.texto}`,
      tema: p.tema,
      titulo: p.titulo,
      entity_type: 'policy',
    }));

    await upsertRecords(host, apiKey, 'knowledge_base', records);

    return Response.json({
      ok: true,
      indexadas: records.length,
      temas: [...new Set(POLITICAS.map((p) => p.tema))],
      mensaje: 'Políticas del negocio cargadas al cerebro. Todos los agentes ya pueden citarlas.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});