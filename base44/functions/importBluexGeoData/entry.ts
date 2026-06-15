import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

// Importa el archivo oficial BX-GEO_DATA de BlueExpress a la entidad BluexGeoData.
// Fuente: Excel "BX-_GEO_DATA_ES1.xlsx" con columnas:
// COD PAIS, NOM PAIS, MONEDA, COD REGION, NOM REGION, COD COMUNA, NOM COMUNA, COD LOCALIDAD, NOM LOCALIDAD
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const sr = base44.asServiceRole;

    // Leer datos del Excel desde la URL del archivo subido
    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url requerido' }, { status: 400 });

    // Descargar y parsear el Excel
    const XLSX = await import('npm:xlsx@0.18.5');
    const resp = await fetch(file_url);
    if (!resp.ok) return Response.json({ error: `No se pudo descargar el archivo (${resp.status})` }, { status: 502 });
    const buf = await resp.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Limpiar registros existentes (idempotente)
    const existentes = await sr.entities.BluexGeoData.list(undefined, 5000);
    for (const e of existentes) {
      await sr.entities.BluexGeoData.delete(e.id);
    }

    // Insertar en lotes
    const batch = [];
    let count = 0;
    for (const row of rows) {
      const codRegion = parseInt(row['COD REGION']) || 0;
      const nomRegion = String(row['NOM REGION'] || '').trim();
      const codComuna = parseInt(row['COD COMUNA']) || 0;
      const nomComuna = String(row['NOM COMUNA'] || '').trim();
      const codLocalidad = String(row['COD LOCALIDAD'] || '').trim();
      const nomLocalidad = String(row['NOM LOCALIDAD'] || '').trim();

      if (!codComuna || !codLocalidad) continue;

      batch.push({
        cod_region: codRegion,
        nom_region: nomRegion,
        cod_comuna: codComuna,
        nom_comuna: nomComuna,
        cod_localidad: codLocalidad,
        nom_localidad: nomLocalidad,
        comuna_normalizada: norm(nomComuna),
        localidad_normalizada: norm(nomLocalidad),
      });
      count++;

      if (batch.length >= 200) {
        await sr.entities.BluexGeoData.bulkCreate(batch);
        batch.length = 0;
      }
    }
    if (batch.length > 0) {
      await sr.entities.BluexGeoData.bulkCreate(batch);
    }

    return Response.json({ ok: true, importados: count, total_rows: rows.length });
  } catch (error) {
    console.error('[importBluexGeoData]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});