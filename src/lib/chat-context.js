// Construye un bloque [CONTEXTO] que se inyecta al agente junto al mensaje del usuario.
// Este bloque es INVISIBLE en la UI (el ChatMessageContent ya filtra texto; aquí lo
// agregamos al payload enviado al agente, no al mensaje mostrado).
//
// El agente lo parsea según las instrucciones en agents/asistente_compras.json.

import { base44 } from '@/api/base44Client';

export async function buildChatContext() {
  const ctx = {};

  // Ruta actual
  if (typeof window !== 'undefined') {
    ctx.page = window.location.pathname;
  }

  // Producto visto (si estamos en /producto/:id)
  try {
    if (ctx.page && ctx.page.startsWith('/producto/')) {
      const id = ctx.page.split('/producto/')[1]?.split('?')[0]?.split('/')[0];
      if (id) {
        const productos = await base44.entities.Producto.list();
        const p = productos.find(x => x.id === id);
        if (p) {
          ctx.viewing_sku = p.sku || null;
          ctx.viewing_name = p.nombre || null;
          ctx.viewing_category = p.categoria || null;
          ctx.viewing_price_b2c = p.precio_b2c || null;
        }
      }
    }
  } catch { /* no-op */ }

  // Carrito
  try {
    const raw = localStorage.getItem('carrito');
    const cart = raw ? JSON.parse(raw) : [];
    if (Array.isArray(cart)) {
      ctx.cart_items = cart.length;
      ctx.cart_total = cart.reduce((s, it) => s + ((it.precio || 0) * (it.cantidad || 1)), 0);
    }
  } catch { /* no-op */ }

  // Cantidad detectada previamente
  try {
    const q = localStorage.getItem('peyu_chat_last_qty');
    if (q) ctx.detected_qty = parseInt(q, 10);
  } catch { /* no-op */ }

  // Usuario si está autenticado
  try {
    const user = await base44.auth.me();
    if (user) {
      ctx.user_name = user.full_name || null;
      ctx.user_email = user.email || null;
    }
  } catch { /* not logged in, ignore */ }

  return ctx;
}

// Serializa el contexto en una línea compacta estilo key=value para el prompt.
export function serializeContext(ctx) {
  const parts = Object.entries(ctx)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => {
      if (typeof v === 'string' && v.includes(' ')) return `${k}="${v.replace(/"/g, '')}"`;
      return `${k}=${v}`;
    });
  return parts.length ? `[CONTEXTO] ${parts.join(' ')}` : '';
}

// Helper unificado: arma el contexto y lo antepone al mensaje del usuario.
export async function withContext(userMessage) {
  const ctx = await buildChatContext();
  const ctxLine = serializeContext(ctx);
  if (!ctxLine) return userMessage;
  return `${ctxLine}\n\n${userMessage}`;
}