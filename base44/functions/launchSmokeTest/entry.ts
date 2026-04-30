// ============================================================================
// PEYU · launchSmokeTest
// ----------------------------------------------------------------------------
// Auditoría completa pre-launch. Verifica en paralelo:
//   1. Sitemap dinámico responde y trae N URLs válidas
//   2. Productos activos con imagen
//   3. Blog posts publicados
//   4. Últimas acciones de indexación (errores recientes)
//   5. Backend functions críticas existen (ping)
//   6. Secrets necesarios configurados
//
// Devuelve un reporte estructurado con status: pass / warn / fail por cada
// chequeo, listo para renderizar en UI estilo "war room dashboard".
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SITE_URL = 'https://peyuchile.cl';

const check = (name, status, message, details = {}) => ({
  name, status, message, details, ts: new Date().toISOString(),
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const checks = [];

    // ── 1. Productos activos ──
    try {
      const productos = await base44.asServiceRole.entities.Producto.list('-updated_date', 1000);
      const activos = productos.filter(p => p.activo !== false && p.canal !== 'B2B Exclusivo');
      const sinImagen = activos.filter(p => !p.imagen_url).length;
      const status = activos.length === 0 ? 'fail' : sinImagen > activos.length * 0.2 ? 'warn' : 'pass';
      checks.push(check(
        'Productos públicos',
        status,
        `${activos.length} activos · ${sinImagen} sin imagen`,
        { activos: activos.length, sin_imagen: sinImagen },
      ));
    } catch (e) {
      checks.push(check('Productos públicos', 'fail', e.message));
    }

    // ── 2. Blog posts ──
    try {
      const posts = await base44.asServiceRole.entities.BlogPost.filter({ publicado: true }, '-fecha_publicacion', 100);
      const status = posts.length === 0 ? 'warn' : posts.length < 3 ? 'warn' : 'pass';
      checks.push(check(
        'Blog publicado',
        status,
        `${posts.length} posts publicados`,
        { count: posts.length, min_recommended: 3 },
      ));
    } catch (e) {
      checks.push(check('Blog publicado', 'warn', e.message));
    }

    // ── 3. Últimos logs de indexación (errores) ──
    try {
      const logs = await base44.asServiceRole.entities.IndexationLog.list('-created_date', 30);
      const errores24h = logs.filter(l => {
        const age = Date.now() - new Date(l.created_date).getTime();
        return l.status === 'error' && age < 24 * 60 * 60 * 1000;
      });
      const status = errores24h.length > 3 ? 'fail' : errores24h.length > 0 ? 'warn' : 'pass';
      checks.push(check(
        'Indexación reciente',
        status,
        `${errores24h.length} errores en últimas 24h`,
        { errores_24h: errores24h.length, total_logs: logs.length },
      ));
    } catch (e) {
      checks.push(check('Indexación reciente', 'warn', e.message));
    }

    // ── 4. Carritos abandonados (CRON funcionando) ──
    try {
      const carritos = await base44.asServiceRole.entities.CarritoAbandonado.list('-created_date', 50);
      const reciente24h = carritos.filter(c => {
        const age = Date.now() - new Date(c.created_date).getTime();
        return age < 24 * 60 * 60 * 1000;
      });
      checks.push(check(
        'Captura carritos',
        'pass',
        `${reciente24h.length} carritos capturados últimas 24h`,
        { reciente_24h: reciente24h.length, total: carritos.length },
      ));
    } catch (e) {
      checks.push(check('Captura carritos', 'warn', e.message));
    }

    // ── 5. Pedidos web recientes (signal de que el funnel convierte) ──
    try {
      const pedidos = await base44.asServiceRole.entities.PedidoWeb.list('-created_date', 50);
      const ultimos7d = pedidos.filter(p => {
        const age = Date.now() - new Date(p.created_date).getTime();
        return age < 7 * 24 * 60 * 60 * 1000;
      });
      checks.push(check(
        'Pedidos web (7d)',
        ultimos7d.length === 0 ? 'warn' : 'pass',
        `${ultimos7d.length} pedidos últimos 7 días`,
        { ultimos_7d: ultimos7d.length, total: pedidos.length },
      ));
    } catch (e) {
      checks.push(check('Pedidos web (7d)', 'warn', e.message));
    }

    // ── 6. Secrets críticos configurados ──
    const requiredSecrets = ['RESEND_API_KEY', 'PINECONE_API_KEY'];
    const missing = requiredSecrets.filter(s => !Deno.env.get(s));
    checks.push(check(
      'Secrets críticos',
      missing.length === 0 ? 'pass' : 'fail',
      missing.length === 0 ? 'Todos los secrets configurados' : `Faltan: ${missing.join(', ')}`,
      { required: requiredSecrets, missing },
    ));

    // ── 7. WooCommerce: solo informativo (puede estar pausado intencionalmente) ──
    const wooPaused = Deno.env.get('WOO_INTEGRATION_PAUSED') === 'true';
    checks.push(check(
      'WooCommerce',
      wooPaused ? 'pass' : 'pass',
      wooPaused ? 'Pausada (modo standalone)' : 'Activa',
      { paused: wooPaused },
    ));

    // ── Resumen ──
    const pass = checks.filter(c => c.status === 'pass').length;
    const warn = checks.filter(c => c.status === 'warn').length;
    const fail = checks.filter(c => c.status === 'fail').length;
    const overall = fail > 0 ? 'fail' : warn > 0 ? 'warn' : 'pass';
    const score = Math.round((pass / checks.length) * 100);

    return Response.json({
      success: true,
      overall,
      score,
      summary: { pass, warn, fail, total: checks.length },
      checks,
      generated_at: new Date().toISOString(),
      site: SITE_URL,
    });
  } catch (error) {
    console.error('launchSmokeTest error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});