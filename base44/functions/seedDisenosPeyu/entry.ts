import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DISENOS = [
  { nombre: "Flamenco", categoria: "Animales Chilenos", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/cc78aa003_ach_Flamenco.jpg", orden: 1, activo: true, es_ejemplo: false },
  { nombre: "Puma", categoria: "Animales Chilenos", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/7ccc047d8_ach_Puma.jpg", orden: 2, activo: true, es_ejemplo: false },
  { nombre: "Chinchilla", categoria: "Animales Chilenos", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/c0063e4c8_ach_chinchilla.jpg", orden: 3, activo: true, es_ejemplo: false },
  { nombre: "Chucao", categoria: "Animales Chilenos", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/b49472d5e_ach_chucao.jpg", orden: 4, activo: true, es_ejemplo: false },
  { nombre: "Gato Andino", categoria: "Animales Chilenos", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/51303ce0b_ach_gato_andino.jpg", orden: 5, activo: true, es_ejemplo: false },
  { nombre: "Huemul", categoria: "Animales Chilenos", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/e80f58278_ach_huemul.jpg", orden: 6, activo: true, es_ejemplo: false },
  { nombre: "Picaflor de Juan Fernández", categoria: "Animales Chilenos", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/ea12bff7f_ach_picaflor_de_Juan_Ferna_ndez.jpg", orden: 7, activo: true, es_ejemplo: false },
  { nombre: "Zorro Chilla", categoria: "Animales Chilenos", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/f11b13591_ach_zorro_chilla.jpg", orden: 8, activo: true, es_ejemplo: false },
  { nombre: "Loica", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/39e3a1374_ia_Loica.png", orden: 9, activo: true, es_ejemplo: false },
  { nombre: "Carpintero Magallánico", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/4bbf51afb_ia_carpintero_magallanico.jpg", orden: 10, activo: true, es_ejemplo: false },
  { nombre: "Chinchilla", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/2292c5df7_ia_chinchilla.jpg", orden: 11, activo: true, es_ejemplo: false },
  { nombre: "Chucao", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/ccb1be1d9_ia_chucao.jpg", orden: 12, activo: true, es_ejemplo: false },
  { nombre: "Chungungo", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/6e1f8f0c6_ia_chungungo.jpg", orden: 13, activo: true, es_ejemplo: false },
  { nombre: "Cóndor", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/6db80ba9e_ia_co_ndor.jpg", orden: 14, activo: true, es_ejemplo: false },
  { nombre: "Flamenco Chileno", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/222c0240f_ia_flamenco_chileno.jpg", orden: 15, activo: true, es_ejemplo: false },
  { nombre: "Gato Andino", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/a6f0b3f43_ia_gato_andino.jpg", orden: 16, activo: true, es_ejemplo: false },
  { nombre: "Guanaco", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/aea30e149_ia_guanaco.jpg", orden: 17, activo: true, es_ejemplo: false },
  { nombre: "Huemul", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/7bfaed82b_ia_huemul.jpg", orden: 18, activo: true, es_ejemplo: false },
  { nombre: "Martín Pescador", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/1c557ec28_ia_marti_n_pescador.jpg", orden: 19, activo: true, es_ejemplo: false },
  { nombre: "Monito del Monte", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/9007fc73b_ia_monito_del_monte.jpg", orden: 20, activo: true, es_ejemplo: false },
  { nombre: "Picaflores de Juan Fernández", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/0da6f1bb0_ia_picaflores_de_juan_fernandez.jpg", orden: 21, activo: true, es_ejemplo: false },
  { nombre: "Pingüino de Humboldt", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/a5d56a368_ia_pinguino_de_humboldt.jpg", orden: 22, activo: true, es_ejemplo: false },
  { nombre: "Puma Concolor", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/95706a8f8_ia_puma_concolor.jpg", orden: 23, activo: true, es_ejemplo: false },
  { nombre: "Rana de Darwin", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/200c4ec1c_ia_rana_de_darwin.jpg", orden: 24, activo: true, es_ejemplo: false },
  { nombre: "Torres del Paine", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/c52b5c621_ia_torres_del_paine.jpg", orden: 25, activo: true, es_ejemplo: false },
  { nombre: "Zorro Culpeo", categoria: "Diseños IA", imagen_url: "https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/2b930ec31_ia_zorro_culpeo.jpg", orden: 26, activo: true, es_ejemplo: false },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const svc = base44.asServiceRole;

    // 1. Borrar TODOS los registros existentes (ejemplos y cualquier residuo)
    const existentes = await svc.entities.DisenoPeyu.list('orden', 500);
    for (const d of existentes) {
      await svc.entities.DisenoPeyu.delete(d.id);
    }

    // 2. Insertar los 26 diseños reales
    await svc.entities.DisenoPeyu.bulkCreate(DISENOS);

    // 3. Contar
    const finales = await svc.entities.DisenoPeyu.list('orden', 500);

    return Response.json({
      borrados: existentes.length,
      insertados: DISENOS.length,
      total: finales.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});