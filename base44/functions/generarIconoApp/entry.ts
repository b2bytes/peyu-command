import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts';

// ============================================================================
// generarIconoApp · Toma el logo ORIGINAL de PEYU (sin alterarlo) y lo centra
// dentro de un canvas cuadrado 1024×1024 con fondo blanco. Sube el PNG a
// almacenamiento y devuelve la URL lista para subir como ícono de la app Meta.
// No usa IA: el arte y la tipografía del logo quedan EXACTOS.
// ============================================================================

const LOGO_URL = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/9ebc95dcf_image.png';
const SIZE = 1024;
const PADDING = 90; // margen para que el logo respire dentro del cuadrado

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // 1 · Descargar el logo original
    const resp = await fetch(LOGO_URL);
    const logoBuf = new Uint8Array(await resp.arrayBuffer());
    const logo = await Image.decode(logoBuf);

    // 2 · Escalar el logo para que quepa dentro del cuadrado con padding (sin deformar)
    const maxW = SIZE - PADDING * 2;
    const maxH = SIZE - PADDING * 2;
    const scale = Math.min(maxW / logo.width, maxH / logo.height);
    const targetW = Math.round(logo.width * scale);
    const targetH = Math.round(logo.height * scale);
    logo.resize(targetW, targetH);

    // 3 · Canvas 1024×1024 blanco opaco
    const canvas = new Image(SIZE, SIZE);
    canvas.fill(0xffffffff); // blanco RGBA

    // 4 · Componer el logo centrado
    const x = Math.round((SIZE - targetW) / 2);
    const y = Math.round((SIZE - targetH) / 2);
    canvas.composite(logo, x, y);

    // 5 · Codificar a PNG y subir
    const out = await canvas.encode();
    const file = new File([out], 'peyu-icon-1024.png', { type: 'image/png' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    return Response.json({ ok: true, url: file_url, size: `${SIZE}x${SIZE}` });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});