// ============================================================================
// driveUploadFile — Sube un archivo a Drive (desde URL o base64) y devuelve
// un link compartible público (con anyone-with-link).
// ============================================================================
// Uso típico:
//   base44.functions.invoke('driveUploadFile', {
//     folder_key: 'propuestas_b2b',
//     file_url: 'https://media.base44.com/....pdf',
//     name: 'Propuesta-Acme-2026-04.pdf',
//     mime_type: 'application/pdf',
//     make_public: true
//   })
//
// Devuelve: { file_id, web_view_link, download_link, name }
// ----------------------------------------------------------------------------

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      folder_key = 'propuestas_b2b',
      folder_id: folderIdInput,
      file_url,
      name,
      mime_type = 'application/pdf',
      make_public = true,
    } = await req.json();

    if (!file_url || !name) {
      return Response.json({ error: 'Missing file_url or name' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // 1. Resolver folder_id
    let folderId = folderIdInput;
    if (!folderId) {
      const folders = await base44.asServiceRole.entities.DriveFolder.filter({ key: folder_key });
      if (folders.length === 0) {
        return Response.json(
          { error: `Folder "${folder_key}" not initialized. Call driveEnsureFolder first.` },
          { status: 400 }
        );
      }
      folderId = folders[0].folder_id;
    }

    // 2. Descargar el archivo desde la URL fuente
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) {
      return Response.json(
        { error: `Failed to fetch source file: ${fileRes.status}` },
        { status: 400 }
      );
    }
    const fileBuffer = await fileRes.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    // 3. Upload multipart a Drive
    const boundary = `peyu-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const metadata = { name, parents: [folderId], mimeType: mime_type };

    // Construir body multipart manualmente (Deno soporta Uint8Array en body)
    const encoder = new TextEncoder();
    const preamble = encoder.encode(
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${mime_type}\r\n\r\n`
    );
    const closing = encoder.encode(`\r\n--${boundary}--`);

    const body = new Uint8Array(preamble.length + fileBytes.length + closing.length);
    body.set(preamble, 0);
    body.set(fileBytes, preamble.length);
    body.set(closing, preamble.length + fileBytes.length);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return Response.json(
        { error: `Drive upload error: ${uploadRes.status}`, detail: err.slice(0, 500) },
        { status: 502 }
      );
    }

    const uploaded = await uploadRes.json();

    // 4. Hacer el archivo público (anyone with link) si se pide
    if (make_public) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${uploaded.id}/permissions`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      });
    }

    return Response.json({
      ok: true,
      file_id: uploaded.id,
      name: uploaded.name,
      web_view_link: uploaded.webViewLink,
      download_link: `https://drive.google.com/uc?export=download&id=${uploaded.id}`,
      size_bytes: fileBytes.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});