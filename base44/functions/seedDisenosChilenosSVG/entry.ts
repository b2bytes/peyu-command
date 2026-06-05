import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ════════════════════════════════════════════════════════════════════════
// seedDisenosChilenosSVG — Galería oficial "Animales Chilenos" en SVG vectorial.
// Estos 18 diseños son line-art negro sobre blanco, listos para grabado láser.
// Al ser SVG, imagen_grabado_url apunta al mismo SVG (no requiere procesado:
// es vectorial monocromo perfecto). El JPG se guarda como imagen_url de respaldo
// para previews donde el SVG no renderice.
//
// Reemplaza por completo la categoría "Animales Chilenos" (borra los antiguos
// rotos y los re-inserta limpios). NO toca la categoría "Diseños IA" ni "Line Art".
// ════════════════════════════════════════════════════════════════════════

const BASE = 'https://media.base44.com/images/public/69d99b9d61f699701129c103';

// nombre, svg (arte láser definitivo), jpg/png (respaldo visual)
const DISENOS = [
  { nombre: 'Carpintero Magallánico', svg: `${BASE}/a1c66c4e8_carpintero_magallanico.svg`, raster: `${BASE}/da231e890_carpinteromagallanico.jpg`, orden: 1 },
  { nombre: 'Chinchilla', svg: `${BASE}/b6c79f7d0_chinchilla.svg`, raster: `${BASE}/1858ce9ef_chinchilla.jpg`, orden: 2 },
  { nombre: 'Chucao', svg: `${BASE}/94bbe29be_chucao.svg`, raster: `${BASE}/69702bb88_chucao.jpg`, orden: 3 },
  { nombre: 'Chungungo', svg: `${BASE}/b72d921e6_chungungo.svg`, raster: `${BASE}/8e89422c1_chungungo.jpg`, orden: 4 },
  { nombre: 'Cóndor', svg: `${BASE}/76a99e40e_condor.svg`, raster: `${BASE}/3c37f785f_condor.jpg`, orden: 5 },
  { nombre: 'Flamenco Chileno', svg: `${BASE}/a56e67c6e_flamenco_chileno.svg`, raster: `${BASE}/62173f066_flamencochileno.jpg`, orden: 6 },
  { nombre: 'Gato Andino', svg: `${BASE}/471e6c98d_gato_andino.svg`, raster: `${BASE}/5b1d77a38_gatoandino.jpg`, orden: 7 },
  { nombre: 'Guanaco', svg: `${BASE}/3cdd568ef_guanaco.svg`, raster: `${BASE}/b3121b9a9_guanaco.jpg`, orden: 8 },
  { nombre: 'Huemul', svg: `${BASE}/42086d07a_huemul.svg`, raster: `${BASE}/4c80383d8_huemul.jpg`, orden: 9 },
  { nombre: 'Loica', svg: `${BASE}/65bdce6a9_Loica.svg`, raster: `${BASE}/bfcd8c7be_Loica.png`, orden: 10 },
  { nombre: 'Martín Pescador', svg: `${BASE}/3f3fd89d1_martin_pescador.svg`, raster: `${BASE}/b6da1e9cf_martinpescador.jpg`, orden: 11 },
  { nombre: 'Monito del Monte', svg: `${BASE}/de2d9ab1a_monito_del_monte.svg`, raster: `${BASE}/431680be0_monitodelmonte.jpg`, orden: 12 },
  { nombre: 'Picaflores de Juan Fernández', svg: `${BASE}/cdd8cacf1_picaflores_de_juan_fernandez.svg`, raster: `${BASE}/bfb868406_picafloresdejuanfernandez.jpg`, orden: 13 },
  { nombre: 'Pingüino de Humboldt', svg: `${BASE}/482393214_pinguino_de_humboldt.svg`, raster: `${BASE}/ae32fe6df_pinguinodehumboldt.jpg`, orden: 14 },
  { nombre: 'Puma Concolor', svg: `${BASE}/ca831c7e1_puma_concolor.svg`, raster: `${BASE}/5c980cc34_pumaconcolor.jpg`, orden: 15 },
  { nombre: 'Rana de Darwin', svg: `${BASE}/d56f9a9ae_rana_de_darwin.svg`, raster: `${BASE}/04bb5e8f4_ranadedarwin.jpg`, orden: 16 },
  { nombre: 'Torres del Paine', svg: `${BASE}/c15c7f48f_torres_del_paine.svg`, raster: `${BASE}/8d7398cfb_torresdelpaine.jpg`, orden: 17 },
  { nombre: 'Zorro Culpeo', svg: `${BASE}/61853aabb_zorro_culpeo.svg`, raster: `${BASE}/48e587ce8_zorroculpeo.jpg`, orden: 18 },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const svc = base44.asServiceRole;

    // 1. Borrar SOLO la categoría "Animales Chilenos" (deja intactas las otras).
    const existentes = await svc.entities.DisenoPeyu.filter({ categoria: 'Animales Chilenos' }, 'orden', 500);
    for (const d of existentes) {
      await svc.entities.DisenoPeyu.delete(d.id);
    }

    // 2. Insertar los 18 SVG nuevos. imagen_grabado_url = SVG (arte láser directo).
    const registros = DISENOS.map((d) => ({
      nombre: d.nombre,
      categoria: 'Animales Chilenos',
      imagen_url: d.raster,
      imagen_grabado_url: d.svg,
      orden: d.orden,
      activo: true,
      es_ejemplo: false,
    }));
    await svc.entities.DisenoPeyu.bulkCreate(registros);

    return Response.json({
      borrados: existentes.length,
      insertados: registros.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});