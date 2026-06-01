import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        if (req.method !== 'POST') {
            return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
        }

        // Protección por secreto simple
        const secret = req.headers.get('X-Madre-Secret');
        const expected = Deno.env.get('MADRE_V2_SECRET');
        if (!expected || secret !== expected) {
            return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const productos = Array.isArray(body?.productos) ? body.productos : [];

        if (productos.length === 0) {
            return Response.json({ ok: false, error: 'No productos provided' }, { status: 400 });
        }

        const base44 = createClientFromRequest(req);

        const ids_ok = [];
        const ids_error = [];

        for (const item of productos) {
            const id = item?.id;
            try {
                if (!id) throw new Error('Missing id');

                // Solo se actualizan los campos V2 — nunca seo_*, precio_b2c ni otros.
                const update = { mostrar_en_v2: true };
                if (item.categoria_v2 !== undefined) update.categoria_v2 = item.categoria_v2;
                if (item.precio_b2b_tramos !== undefined) update.precio_b2b_tramos = item.precio_b2b_tramos;
                if (item.incluye !== undefined) update.incluye_v2 = item.incluye;
                if (item.personalizacion !== undefined) update.personalizacion_v2 = item.personalizacion;

                await base44.asServiceRole.entities.Producto.update(id, update);
                ids_ok.push(id);
            } catch (e) {
                ids_error.push({ id: id || null, error: e?.message || String(e) });
            }
        }

        return Response.json({
            ok: true,
            actualizados: ids_ok.length,
            ids_ok,
            ids_error,
        });
    } catch (error) {
        return Response.json({ ok: false, error: error.message }, { status: 500 });
    }
});