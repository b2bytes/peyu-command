// PEYU · fixCarcasasUrgente
// Limpieza masiva en una sola pasada para la categoría "Carcasas B2C":
//
// 1. Matches Drive faltantes: aplica los archivos S20fe, S23*, S24*, P40*, etc.
//    que el matcher estricto no cerró por sufijos pero sí están en el Drive.
// 2. Import desde peyuchile.cl: para los SKUs CARC-IP* mapeados en
//    utils/productImages.js, descarga la URL real y la sube al CDN.
// 3. Limpieza de galerías: elimina cualquier imagen que NO sea una carcasa real
//    (Wayback orphans, mockups erróneos, watermarks). Deja solo lo que tiene
//    sentido visual: imagen_url nueva + galería de fotos del modelo correcto.
// 4. Desactiva (activo=false) los productos que quedan sin foto real, para que
//    no aparezcan rotos en la tienda.
//
// Body:
//   { mode: "preview" | "apply", desactivar?: bool }
//
// preview → reporta qué haría sin tocar nada.
// apply   → ejecuta el plan completo.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ROOT_FOLDER = '1qXw3mA_KcimLqC5pH5sZr1Ib7gm9mBDR';
const CARCASAS_SUBFOLDER_NAME = 'Carcasas';

// ─── URLs validadas peyuchile.cl para SKUs CARC-* ──────────────────
// Espejo de utils/productImages.js (SKU_IMAGES). Usadas SOLO si el SKU
// existe y no se cerró por Drive.
const SKU_PEYUCHILE = {
  'CARC-IP11':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-11-Biodegradable-amarillo.webp',
  'CARC-IP11P':  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-Iphone-11PRO-BIODEGRADABLE-negro.webp',
  'CARC-IP11PM': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/09/ip11promax-pi.jpg',
  'CARC-IP12M':  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-12-12-pro-Biodegradable-azul.webp',
  'CARC-IP13':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/carcasa-iphon-13-pro-turquesa.webp',
  'CARC-IP13M':  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-13-mini-Biodegradable-amarillo.webp',
  'CARC-IP13P':  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/carcasa-iphon-13-pro-amarillo.webp',
  'CARC-IP13PM': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-13-pro-Max-Biodegradable-amarillo.webp',
  'CARC-IP14':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-negro.webp',
  'CARC-IP14PL': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-Plus-negro.webp',
  'CARC-IP14P':  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-pro-negro.webp',
  'CARC-IP14PM': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-pro-Max-biodegradable-amarillo.webp',
  'CARC-IP15':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-negro.webp',
  'CARC-IP15P':  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-pro-negro.webp',
  'CARC-IP15PM': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-pro-Max-biodegradable-azul.webp',
  'CARC-IP16':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/i16-amarillo.jpg',
  'CARC-IP16PL': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/i16-plus-amarillo.jpg',
  'CARC-HW-P30': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-Huawei-p30-Biodegradable-negro.webp',
  'CARC-HW-P30L':'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-Huawei-p30-lite-Biodegradable-negro.webp',
};

// ─── Heurísticas ──────────────────────────────────────────────
const slugify = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

// Token modelo extraído del nombre del producto.
// "Carcasa Samsung S23 FE"  → { base: "s23", suffix: "fe", full: "s23fe" }
// "Carcasa para Huawei P40" → { base: "p40", suffix: "",   full: "p40" }
function extractProductoModel(nombre) {
  const norm = slugify(nombre)
    .replace(/\bcarcasa\b|\bpara\b|\bcase\b|\bbiodegradable\b|\bcompostable\b/g, ' ')
    .replace(/\bhuawei\b|\bsamsung\b|\bxiaomi\b|\bredmi\b|\bgalaxy\b|\bmotorola\b|\bnokia\b|\bnote\b|\bedge\b/g, ' ')
    .replace(/\biphone\b/g, 'ip')
    .replace(/\b4g\b|\b5g\b/g, ' ')
    .replace(/\s+/g, ' ').trim();

  // base = primer letra+número (1-3 letras)
  const baseMatch = norm.match(/\b([a-z]{1,3})\s*(\d{1,3})\b/);
  if (!baseMatch) return null;
  const base = baseMatch[1] + baseMatch[2];

  let suffix = '';
  if (/\bpro\s+max\b|\bpromax\b/.test(norm)) suffix = 'promax';
  else if (/\bplus\b/.test(norm)) suffix = 'plus';
  else if (/\bultra\b/.test(norm)) suffix = 'ultra';
  else if (/\blite\b/.test(norm)) suffix = 'lite';
  else if (/\bmini\b/.test(norm)) suffix = 'mini';
  else if (/\bfe\b/.test(norm)) suffix = 'fe';
  else if (/\bpro\b/.test(norm)) suffix = 'pro';

  return { base, suffix, full: base + suffix };
}

// Token modelo del archivo Drive: "S24fe blu.jpg" → { base: "s24", suffix: "fe", full: "s24fe" }
function extractFileModel(filename) {
  const norm = slugify(filename)
    .replace(/\bblu\b|\bneg\b|\byel\b|\bros\b|\btur\b|\bbla\b|\bmar\b|\bver\b|\bgri\b/g, ' ')
    .replace(/\s+/g, '');

  // primer bloque letra+número en el nombre compacto
  const m = norm.match(/^([a-z]{1,3})(\d{1,3})([a-z]*)/);
  if (!m) return null;
  const base = m[1] + m[2];
  const tail = m[3] || '';

  let suffix = '';
  if (tail.startsWith('promax')) suffix = 'promax';
  else if (tail.startsWith('plus')) suffix = 'plus';
  else if (tail.startsWith('ultra')) suffix = 'ultra';
  else if (tail.startsWith('lite')) suffix = 'lite';
  else if (tail.startsWith('mini')) suffix = 'mini';
  else if (tail.startsWith('fe')) suffix = 'fe';
  else if (tail.startsWith('pro')) suffix = 'pro';

  return { base, suffix, full: base + suffix };
}

// ─── Drive helpers ──────────────────────────────────────────────
async function findSubfolder(parentId, name, headers) {
  const params = new URLSearchParams({
    q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '${name.replace(/'/g, "\\'")}'`,
    fields: 'files(id,name)',
    supportsAllDrives: 'true', includeItemsFromAllDrives: 'true',
  });
  const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, { headers });
  if (!r.ok) throw new Error(`Drive ${r.status}`);
  const data = await r.json();
  return data.files?.[0] || null;
}

async function listImagesIn(folderId, headers) {
  const out = [];
  let pageToken = null;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
      fields: 'nextPageToken,files(id,name,mimeType,size)',
      pageSize: '200',
      supportsAllDrives: 'true', includeItemsFromAllDrives: 'true',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, { headers });
    if (!r.ok) throw new Error(`Drive ${r.status}`);
    const data = await r.json();
    out.push(...(data.files || []));
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return out;
}

// Detecta si una URL es foto real validada del producto.
// Aceptamos SOLO lo que viene del Drive (-drv-) o del importador peyuchile (-pyc.).
// EXCLUIMOS explícitamente:
//   - logos PEYU (wb-log_peyu, log_peyu, peyu-18)
//   - watermarks / archivos wayback genéricos (-wb-)
//   - placeholders (Photoroom, generic image names sin SKU)
const isFotoRealCDN = (url, sku) => {
  if (!url || typeof url !== 'string') return false;
  if (!url.includes('base44.app/api/apps')) return false;
  // Excluir logos y watermarks aunque tengan el SKU al inicio
  if (/log[_-]?peyu|peyu-?18|peyu_logo/i.test(url)) return false;
  // Excluir wayback (no son carcasas, son banners/genéricos)
  if (/-wb-/.test(url)) return false;
  // Aceptar solo drive validado o peyuchile importado o nombres explícitos del modelo
  return url.includes(`${sku}-drv-`) || url.includes(`${sku}-pyc.`);
};

// ─── Handler ───────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === 'apply' ? 'apply' : 'preview';
    const desactivar = body.desactivar !== false; // default true

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { 'Authorization': `Bearer ${accessToken}` };

    // 1. Listar Drive
    const carcasasFolder = await findSubfolder(ROOT_FOLDER, CARCASAS_SUBFOLDER_NAME, headers);
    if (!carcasasFolder) return Response.json({ error: 'No existe carpeta Carcasas en Drive' }, { status: 404 });
    const driveFiles = await listImagesIn(carcasasFolder.id, headers);

    // 2. Productos
    const productos = await base44.asServiceRole.entities.Producto.filter(
      { categoria: 'Carcasas B2C' }, '-updated_date', 200
    );

    // 3. Index Drive por modelo full (s23fe → archivo)
    const driveByModel = new Map();
    for (const f of driveFiles) {
      const m = extractFileModel(f.name);
      if (!m) continue;
      if (!driveByModel.has(m.full)) driveByModel.set(m.full, []);
      driveByModel.get(m.full).push(f);
    }

    // 4. Plan de acción por producto
    const plan = [];
    for (const p of productos) {
      const model = extractProductoModel(p.nombre);
      const tieneReal = isFotoRealCDN(p.imagen_url, p.sku);
      let accion = 'desactivar';
      let nuevaImagen = null;
      let nuevaGaleria = [];
      let fuente = null;

      // 4a. Ya tiene foto real → solo limpiar galería
      if (tieneReal) {
        accion = 'limpiar_galeria';
        nuevaImagen = p.imagen_url;
        // Galería: solo URLs con prefijo SKU (foto real validada)
        nuevaGaleria = (Array.isArray(p.galeria_urls) ? p.galeria_urls : [])
          .filter(u => isFotoRealCDN(u, p.sku));
        fuente = 'mantener';
      }
      // 4b. Drive tiene archivo para este modelo
      else if (model && driveByModel.has(model.full)) {
        accion = 'aplicar_drive';
        const files = driveByModel.get(model.full);
        // Tomamos el primero como principal (luego en apply lo subimos)
        plan.push({
          producto: { id: p.id, sku: p.sku, nombre: p.nombre },
          accion, fuente: 'drive',
          drive_files: files.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType })),
          model: model.full,
        });
        continue;
      }
      // 4c. SKU mapeado a peyuchile.cl
      else if (p.sku && SKU_PEYUCHILE[p.sku]) {
        accion = 'aplicar_peyuchile';
        plan.push({
          producto: { id: p.id, sku: p.sku, nombre: p.nombre },
          accion, fuente: 'peyuchile',
          source_url: SKU_PEYUCHILE[p.sku],
        });
        continue;
      }
      // 4d. Sin foto real disponible → desactivar
      else {
        plan.push({
          producto: { id: p.id, sku: p.sku, nombre: p.nombre, activo: p.activo },
          accion: 'desactivar',
          fuente: 'ninguna',
          model: model?.full || null,
        });
        continue;
      }

      plan.push({
        producto: { id: p.id, sku: p.sku, nombre: p.nombre },
        accion, fuente, nuevaImagen, nuevaGaleria,
        galeria_actual_count: (p.galeria_urls || []).length,
        galeria_final_count: nuevaGaleria.length,
      });
    }

    // ── Preview ──
    if (mode === 'preview') {
      const summary = {
        total_productos: productos.length,
        aplicar_drive: plan.filter(x => x.accion === 'aplicar_drive').length,
        aplicar_peyuchile: plan.filter(x => x.accion === 'aplicar_peyuchile').length,
        limpiar_galeria: plan.filter(x => x.accion === 'limpiar_galeria').length,
        desactivar: plan.filter(x => x.accion === 'desactivar').length,
      };
      return Response.json({ ok: true, mode, summary, plan });
    }

    // ── Apply ──
    const results = { aplicados_drive: 0, aplicados_peyuchile: 0, galerias_limpias: 0, desactivados: 0, errores: [] };

    for (const item of plan) {
      try {
        // a) aplicar Drive
        if (item.accion === 'aplicar_drive') {
          const uploadedUrls = [];
          for (const f of item.drive_files) {
            const dlR = await fetch(
              `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media&supportsAllDrives=true`,
              { headers }
            );
            if (!dlR.ok) continue;
            const blob = await dlR.blob();
            if (blob.size < 5000) continue;
            const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const file = new File([blob], `${item.producto.sku}-drv-${safeName}`, {
              type: f.mimeType || 'image/jpeg',
            });
            const up = await base44.asServiceRole.integrations.Core.UploadFile({ file });
            if (up?.file_url) uploadedUrls.push(up.file_url);
          }
          if (uploadedUrls.length === 0) {
            results.errores.push({ sku: item.producto.sku, motivo: 'no se subió nada de Drive' });
            continue;
          }
          await base44.asServiceRole.entities.Producto.update(item.producto.id, {
            imagen_url: uploadedUrls[0],
            galeria_urls: uploadedUrls,
            activo: true,
          });
          results.aplicados_drive++;
        }
        // b) aplicar peyuchile
        else if (item.accion === 'aplicar_peyuchile') {
          // peyuchile.cl tiene hotlink protection: necesitamos UA + Referer válidos
          const dlR = await fetch(item.source_url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
              'Referer': 'https://peyuchile.cl/',
              'Accept': 'image/webp,image/avif,image/apng,image/*,*/*;q=0.8',
            },
          });
          if (!dlR.ok) {
            results.errores.push({ sku: item.producto.sku, motivo: `peyuchile ${dlR.status}` });
            continue;
          }
          const blob = await dlR.blob();
          if (blob.size < 3000) {
            results.errores.push({ sku: item.producto.sku, motivo: 'imagen muy pequeña' });
            continue;
          }
          const ext = (blob.type || '').includes('png') ? 'png' : (blob.type?.includes('jpeg') ? 'jpg' : 'webp');
          const file = new File([blob], `${item.producto.sku}-pyc.${ext}`, { type: blob.type || 'image/webp' });
          const up = await base44.asServiceRole.integrations.Core.UploadFile({ file });
          if (!up?.file_url) {
            results.errores.push({ sku: item.producto.sku, motivo: 'upload peyuchile falló' });
            continue;
          }
          await base44.asServiceRole.entities.Producto.update(item.producto.id, {
            imagen_url: up.file_url,
            galeria_urls: [up.file_url],
            activo: true,
          });
          results.aplicados_peyuchile++;
        }
        // c) limpiar galería
        else if (item.accion === 'limpiar_galeria') {
          await base44.asServiceRole.entities.Producto.update(item.producto.id, {
            galeria_urls: item.nuevaGaleria,
          });
          results.galerias_limpias++;
        }
        // d) desactivar
        else if (item.accion === 'desactivar' && desactivar) {
          await base44.asServiceRole.entities.Producto.update(item.producto.id, {
            activo: false,
          });
          results.desactivados++;
        }
      } catch (err) {
        results.errores.push({ sku: item.producto.sku, motivo: err.message });
      }
    }

    return Response.json({ ok: true, mode, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});