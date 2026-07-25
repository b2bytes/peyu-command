// ════════════════════════════════════════════════════════════════════════
// whatsappPlantillasIA — Genera plantillas de WhatsApp con IA, con el tono
// real de PEYU y las variables {{nombre}} / {{empresa}} ya puestas.
// El admin escribe la intención ("recuperar clientes de junio") y recibe
// varias plantillas listas para guardar.
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CATEGORIAS = ['Bienvenida', 'Seguimiento', 'Cotización', 'Postventa', 'Promoción', 'Reactivación', 'Otro'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') return Response.json({ error: 'Solo admins' }, { status: 403 });

    const { intencion = '', categoria = '', cantidad = 3, guardar = false } = await req.json();
    if (!intencion.trim()) return Response.json({ error: 'Cuéntame para qué es la plantilla.' }, { status: 400 });

    const n = Math.min(6, Math.max(1, Number(cantidad) || 3));

    // Contexto real del catálogo para que los mensajes no sean genéricos
    const productos = await base44.asServiceRole.entities.Producto.filter({ activo: true }, '-updated_date', 25).catch(() => []);
    const catalogo = productos.slice(0, 15)
      .map((p) => `${p.nombre} (${p.sku}) $${Math.round(p.precio_b2c || 0)}`).join(' · ');

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres el copywriter de PEYU Chile, marca de productos de plástico 100% reciclado y fibra de trigo (carcasas de celular, cachos, soportes de escritorio, paletas, artículos de hogar), todos personalizables con grabado láser. Vendes a personas (B2C) y a empresas (B2B).

Catálogo real: ${catalogo || 'productos PEYU personalizables'}

Escribe ${n} plantillas DISTINTAS de mensaje de WhatsApp para esta intención:
"${intencion}"
${categoria ? `Categoría: ${categoria}` : ''}

Reglas del tono PEYU:
- Español de Chile, cercano y directo, sin ser cursi ni vendedor agresivo.
- Cortas: máximo 4 líneas. WhatsApp se lee en el celular.
- Usa {{nombre}} para el nombre del cliente y {{empresa}} solo si el mensaje es para empresas.
- Máximo 1 o 2 emojis. La tortuga 🐢 es la mascota, úsala con moderación.
- Negritas de WhatsApp con *asteriscos simples* si hace falta destacar algo.
- Termina con una pregunta o llamada a la acción clara.
- No inventes precios, plazos ni descuentos que no estén en el catálogo entregado.

Cada plantilla necesita: nombre corto interno, categoría (una de: ${CATEGORIAS.join(', ')}) y el mensaje.`,
      response_json_schema: {
        type: 'object',
        properties: {
          plantillas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nombre: { type: 'string' },
                categoria: { type: 'string', enum: CATEGORIAS },
                mensaje: { type: 'string' },
              },
              required: ['nombre', 'mensaje'],
            },
          },
        },
        required: ['plantillas'],
      },
    });

    const plantillas = (resultado?.plantillas || [])
      .filter((p) => p?.nombre && p?.mensaje)
      .map((p) => ({
        nombre: p.nombre.slice(0, 80),
        categoria: CATEGORIAS.includes(p.categoria) ? p.categoria : (categoria || 'Otro'),
        mensaje: p.mensaje.trim(),
        activo: true,
        usos: 0,
      }));

    if (!plantillas.length) return Response.json({ error: 'La IA no devolvió plantillas. Intenta describir la intención con más detalle.' }, { status: 502 });

    let creadas = [];
    if (guardar) {
      creadas = await base44.asServiceRole.entities.PlantillaWhatsApp.bulkCreate(plantillas);
    }

    return Response.json({ ok: true, plantillas, guardadas: guardar ? creadas.length : 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});