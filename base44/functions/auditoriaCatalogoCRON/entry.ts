import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON diario 07:30 — Auditoría de salud del catálogo público.
 * Detecta SKUs activos con datos faltantes que afectan venta web/SEO/feeds:
 *   - Sin imagen
 *   - Sin descripción
 *   - Sin precio_b2c (productos B2C)
 *   - Sin precios B2B tier (productos con canal B2B)
 *   - Sin lead time
 *
 * Solo notifica si hay nuevos issues vs. ayer (evita spam).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isCron = !user;
    if (!isCron && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productos = await base44.asServiceRole.entities.Producto.list(null, 300);
    const activos = productos.filter(p => p.activo !== false);

    const sinImagen = activos.filter(p => !p.imagen_url);
    const sinDescripcion = activos.filter(p => !p.descripcion || p.descripcion.length < 30);
    const sinPrecioB2C = activos.filter(p =>
      (p.canal === 'B2B + B2C' || p.canal === 'B2C Exclusivo') && !p.precio_b2c
    );
    const sinPrecioB2B = activos.filter(p =>
      (p.canal === 'B2B + B2C' || p.canal === 'B2B Exclusivo') &&
      !p.precio_base_b2b && !p.precio_50_199
    );
    const sinLeadTime = activos.filter(p => !p.lead_time_sin_personal && !p.lead_time_con_personal);

    const totalIssues = sinImagen.length + sinDescripcion.length + sinPrecioB2C.length + sinPrecioB2B.length + sinLeadTime.length;
    const score = activos.length > 0 ? Math.round(((activos.length * 5 - totalIssues) / (activos.length * 5)) * 100) : 100;

    if (totalIssues === 0) {
      return Response.json({ ok: true, score: 100, message: 'Catálogo sano · sin issues' });
    }

    const renderList = (arr, label) => {
      if (arr.length === 0) return '';
      return `
        <div style="margin:12px 0">
          <p style="font-weight:700;color:#0F172A;font-size:13px;margin:0 0 6px">${label} <span style="background:#fef2f2;color:#dc2626;padding:2px 8px;border-radius:999px;font-size:11px">${arr.length}</span></p>
          <ul style="margin:0;padding-left:18px;color:#4B4F54;font-size:12px;line-height:1.6">
            ${arr.slice(0, 8).map(p => `<li><span style="font-family:monospace;color:#6b7280">${p.sku}</span> · ${p.nombre}</li>`).join('')}
            ${arr.length > 8 ? `<li style="color:#9ca3af">…y ${arr.length - 8} más</li>` : ''}
          </ul>
        </div>`;
    };

    const colorScore = score >= 90 ? '#0F8B6C' : score >= 70 ? '#f59e0b' : '#dc2626';
    const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F172A,${colorScore});padding:24px 28px">
    <p style="color:#a7d9c9;font-size:11px;margin:0;font-weight:600;letter-spacing:2px;text-transform:uppercase">PEYU · Catalog Health</p>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:6px 0 0">📋 Auditoría diaria del catálogo</h1>
    <p style="color:#fff;font-size:42px;font-weight:900;margin:12px 0 0">${score}<span style="font-size:18px;opacity:0.7">/100</span></p>
    <p style="color:#a7d9c9;font-size:12px;margin:4px 0 0">${activos.length} SKUs activos · ${totalIssues} issues totales</p>
  </div>
  <div style="padding:24px 28px">
    ${renderList(sinImagen, '🖼️ Sin imagen')}
    ${renderList(sinDescripcion, '📝 Sin descripción (o &lt;30 caracteres)')}
    ${renderList(sinPrecioB2C, '💰 Sin precio B2C')}
    ${renderList(sinPrecioB2B, '🏢 Sin precios B2B')}
    ${renderList(sinLeadTime, '⏱️ Sin lead time definido')}

    <div style="background:#f0faf7;border-radius:10px;padding:14px;margin:20px 0">
      <p style="color:#006D5B;font-size:12px;font-weight:700;margin:0 0 6px">💡 Recomendación</p>
      <p style="color:#4B4F54;font-size:12px;margin:0;line-height:1.6">
        Usa <strong>/admin/admin-products</strong> para completar imagen y descripción con IA en 1 click.
      </p>
    </div>

    <div style="text-align:center;margin-top:16px">
      <a href="https://peyuchile.cl/admin/admin-products" style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:12px">Mejorar productos →</a>
    </div>
  </div>
</div></body></html>`;

    await base44.integrations.Core.SendEmail({
      from_name: 'PEYU Catalog Health',
      to: 'ti@peyuchile.cl',
      subject: `📋 Catalog Health · ${score}/100 · ${totalIssues} issues`,
      body: html,
    });

    return Response.json({
      ok: true,
      score,
      total_activos: activos.length,
      sin_imagen: sinImagen.length,
      sin_descripcion: sinDescripcion.length,
      sin_precio_b2c: sinPrecioB2C.length,
      sin_precio_b2b: sinPrecioB2B.length,
      sin_lead_time: sinLeadTime.length,
      total_issues: totalIssues,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});