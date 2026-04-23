// ============================================================================
// docsCreateFromTemplate — Crea un Google Doc con contenido dinámico
// ============================================================================
// Flujo:
//   1. Crea un Doc nuevo en Drive (en la carpeta indicada)
//   2. Inyecta el contenido usando batchUpdate de Docs API
//   3. Opcionalmente lo hace público (anyone with link)
//
// Uso:
//   base44.functions.invoke('docsCreateFromTemplate', {
//     title: 'Contrato Acme SPA — Abril 2026',
//     folder_key: 'contratos',
//     content_blocks: [
//       { type: 'heading', text: 'Contrato de prestación' },
//       { type: 'paragraph', text: 'Entre PEYU Chile...' },
//     ],
//     make_public: false
//   })
// ----------------------------------------------------------------------------

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Convierte bloques de contenido en un array de requests batchUpdate.
 * Los bloques se insertan en orden al INICIO del documento, por lo que
 * procesamos en reverso para respetar el orden visual final.
 */
function buildBatchRequests(blocks) {
  // Concatenar todo el texto primero, tracking posiciones
  let fullText = '';
  const styleRequests = [];
  let cursor = 1; // Docs API: índice 1 = inicio del cuerpo

  blocks.forEach((block) => {
    const text = (block.text || '') + '\n';
    const startIdx = cursor;
    const endIdx = cursor + text.length - 1; // -1 para no incluir \n final en el estilo

    if (block.type === 'heading') {
      styleRequests.push({
        updateParagraphStyle: {
          range: { startIndex: startIdx, endIndex: endIdx + 1 },
          paragraphStyle: { namedStyleType: 'HEADING_1' },
          fields: 'namedStyleType',
        },
      });
    } else if (block.type === 'subheading') {
      styleRequests.push({
        updateParagraphStyle: {
          range: { startIndex: startIdx, endIndex: endIdx + 1 },
          paragraphStyle: { namedStyleType: 'HEADING_2' },
          fields: 'namedStyleType',
        },
      });
    } else if (block.type === 'bold_paragraph') {
      styleRequests.push({
        updateTextStyle: {
          range: { startIndex: startIdx, endIndex: endIdx },
          textStyle: { bold: true },
          fields: 'bold',
        },
      });
    }

    fullText += text;
    cursor += text.length;
  });

  const requests = [
    { insertText: { location: { index: 1 }, text: fullText } },
    ...styleRequests,
  ];

  return requests;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      title,
      folder_key = 'informes',
      folder_id: folderIdInput,
      content_blocks = [],
      make_public = false,
    } = await req.json();

    if (!title) return Response.json({ error: 'Missing title' }, { status: 400 });

    // Token: Drive para crear+mover, Docs para inyectar contenido
    const { accessToken: driveToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const { accessToken: docsToken } = await base44.asServiceRole.connectors.getConnection('googledocs');

    // 1. Resolver folder_id destino
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

    // 2. Crear el Doc (via Drive API) directamente en la carpeta destino
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${driveToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: title,
        mimeType: 'application/vnd.google-apps.document',
        parents: [folderId],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return Response.json(
        { error: `Drive create error: ${createRes.status}`, detail: err.slice(0, 500) },
        { status: 502 }
      );
    }

    const doc = await createRes.json();
    const documentId = doc.id;

    // 3. Inyectar contenido si se proveyó
    if (content_blocks.length > 0) {
      const requests = buildBatchRequests(content_blocks);
      const batchRes = await fetch(
        `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${docsToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests }),
        }
      );

      if (!batchRes.ok) {
        const err = await batchRes.text();
        // El Doc ya se creó; devolvemos el link aunque el contenido falle
        return Response.json({
          ok: true,
          partial: true,
          document_id: documentId,
          web_view_link: `https://docs.google.com/document/d/${documentId}/edit`,
          warning: `Content injection failed: ${err.slice(0, 300)}`,
        });
      }
    }

    // 4. Permisos públicos si se pide
    if (make_public) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${driveToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      });
    }

    return Response.json({
      ok: true,
      document_id: documentId,
      web_view_link: `https://docs.google.com/document/d/${documentId}/edit`,
      title,
      blocks_inserted: content_blocks.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});