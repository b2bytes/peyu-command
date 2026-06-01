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
        const ids = Array.isArray(body?.ids) ? body.ids : [];
        const valor = typeof body?.valor === 'boolean' ? body.valor : true;

        if (ids.length === 0) {
            return Response.json({ ok: false, error: 'No ids provided' }, { status: 400 });
        }

        const base44 = createClientFromRequest(req);

        const ids_ok = [];
        const ids_error = [];

        for (const id of ids) {
            try {
                // Solo el campo mostrar_en_v2 — no se toca ningún otro campo.
                await base44.asServiceRole.entities.Producto.update(id, { mostrar_en_v2: valor });
                ids_ok.push(id);
            } catch (e) {
                ids_error.push({ id, error: e?.message || String(e) });
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