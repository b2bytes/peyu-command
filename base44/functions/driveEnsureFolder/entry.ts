// ============================================================================
// driveEnsureFolder — Crea o recupera una carpeta en Google Drive
// ============================================================================
// Con scope drive.file solo podemos ver archivos creados por la app. Por eso
// persistimos el folder_id en una entidad interna (DriveFolder) en vez de
// buscarlo cada vez en Drive.
//
// Uso:
//   base44.functions.invoke('driveEnsureFolder', { key: 'propuestas_b2b' })
//
// Devuelve: { folder_id, web_view_link, created: boolean }
// ----------------------------------------------------------------------------

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Carpetas estándar del ecosistema PEYU
const FOLDER_NAMES = {
  propuestas_b2b: 'PEYU · Propuestas B2B',
  contratos: 'PEYU · Contratos',
  informes: 'PEYU · Informes',
  mockups: 'PEYU · Mockups',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { key = 'propuestas_b2b', custom_name } = await req.json();
    const folderName = custom_name || FOLDER_NAMES[key] || 'PEYU · Archivos';

    // 1. Intentar recuperar de la entidad DriveFolder
    const existing = await base44.asServiceRole.entities.DriveFolder.filter({ key });
    if (existing.length > 0) {
      return Response.json({
        ok: true,
        created: false,
        folder_id: existing[0].folder_id,
        web_view_link: existing[0].web_view_link,
        name: existing[0].name,
      });
    }

    // 2. No existe → crearla en Drive
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return Response.json(
        { error: `Drive API error: ${createRes.status}`, detail: err.slice(0, 500) },
        { status: 502 }
      );
    }

    const folder = await createRes.json();
    const webViewLink = `https://drive.google.com/drive/folders/${folder.id}`;

    // 3. Persistir en entidad para futuras llamadas
    await base44.asServiceRole.entities.DriveFolder.create({
      key,
      name: folderName,
      folder_id: folder.id,
      web_view_link: webViewLink,
    });

    return Response.json({
      ok: true,
      created: true,
      folder_id: folder.id,
      web_view_link: webViewLink,
      name: folderName,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});