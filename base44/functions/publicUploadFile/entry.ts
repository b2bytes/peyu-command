import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// ════════════════════════════════════════════════════════════════════════
// publicUploadFile — Subida PÚBLICA de imágenes para el personalizador B2C/B2B.
// Los compradores anónimos no pueden llamar integrations.Core.UploadFile
// directamente desde el navegador (requiere sesión), lo que dejaba pedidos
// parados: "la página no permite subir una imagen". Este endpoint recibe la
// imagen en base64 y la sube con service role.
// Guardas: solo imágenes, máx 10MB.
// ════════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { filename, mime, data_base64 } = await req.json();

    if (!data_base64 || typeof data_base64 !== 'string') {
      return Response.json({ error: 'Falta el archivo (data_base64).' }, { status: 400 });
    }
    const mimeType = String(mime || '');
    const esImagen = mimeType.startsWith('image/') || mimeType === 'application/pdf' && false;
    if (!esImagen) {
      return Response.json({ error: 'Solo se permiten imágenes (PNG, JPG, SVG, WEBP).' }, { status: 400 });
    }
    // base64 → bytes (límite 10MB reales ≈ 13.4MB base64)
    if (data_base64.length > 14_000_000) {
      return Response.json({ error: 'El archivo supera 10MB.' }, { status: 400 });
    }

    const binary = atob(data_base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const safeName = String(filename || 'diseno.png').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const file = new File([bytes], safeName, { type: mimeType });

    const res = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    return Response.json({ file_url: res.file_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});