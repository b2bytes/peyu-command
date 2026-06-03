import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Actualiza el imagen_url de los 18 diseños OFICIALES PEYU (SVG reales de Carlos).
// Reemplaza los JPG genéricos por los SVG vectoriales (mejor calidad láser).
// Admin-only. Actualiza por ID exacto vía service role.
const UPDATES = [
  { id: '6a1fcbbdc95c85e52d8e704f', nombre: 'Loica', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/c3478b9b3_loica.svg' },
  { id: '6a1fcbbdc95c85e52d8e7050', nombre: 'Carpintero Magallánico', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/db120f451_carpintero_magallanico.svg' },
  { id: '6a1fcbbdc95c85e52d8e7051', nombre: 'Chinchilla', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/7fa9ca702_chinchilla.svg' },
  { id: '6a1fcbbdc95c85e52d8e7052', nombre: 'Chucao', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/01f9e4d50_chucao.svg' },
  { id: '6a1fcbbdc95c85e52d8e7053', nombre: 'Chungungo', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/63f11f8f9_chungungo.svg' },
  { id: '6a1fcbbdc95c85e52d8e7054', nombre: 'Cóndor', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/0f3818432_condor.svg' },
  { id: '6a1fcbbdc95c85e52d8e7055', nombre: 'Flamenco Chileno', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/54edd7763_flamenco_chileno.svg' },
  { id: '6a1fcbbdc95c85e52d8e7056', nombre: 'Gato Andino', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/eb3198225_gato_andino.svg' },
  { id: '6a1fcbbdc95c85e52d8e7057', nombre: 'Guanaco', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/1d6985bc6_guanaco.svg' },
  { id: '6a1fcbbdc95c85e52d8e7058', nombre: 'Huemul', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/c0896890b_huemul.svg' },
  { id: '6a1fcbbdc95c85e52d8e7059', nombre: 'Martín Pescador', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/897396249_martin_pescador.svg' },
  { id: '6a1fcbbdc95c85e52d8e705a', nombre: 'Monito del Monte', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/66175bcc3_monito_del_monte.svg' },
  { id: '6a1fcbbdc95c85e52d8e705b', nombre: 'Picaflores de Juan Fernández', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/554fbbb28_picaflores_de_juan_fernandez.svg' },
  { id: '6a1fcbbdc95c85e52d8e705c', nombre: 'Pingüino de Humboldt', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/e67fae528_pinguino_de_humboldt.svg' },
  { id: '6a1fcbbdc95c85e52d8e705d', nombre: 'Puma Concolor', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/a87199c79_puma_concolor.svg' },
  { id: '6a1fcbbdc95c85e52d8e705e', nombre: 'Rana de Darwin', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/c9ba64f9b_rana_de_darwin.svg' },
  { id: '6a1fcbbdc95c85e52d8e705f', nombre: 'Torres del Paine', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/372fc3aec_torres_del_paine.svg' },
  { id: '6a1fcbbdc95c85e52d8e7060', nombre: 'Zorro Culpeo', url: 'https://base44.app/api/apps/69da8ea2c96eac4341626b3f/files/mp/public/69da8ea2c96eac4341626b3f/809146ed9_zorro_culpeo.svg' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = [];
    for (const u of UPDATES) {
      try {
        await base44.asServiceRole.entities.DisenoPeyu.update(u.id, { imagen_url: u.url });
        results.push({ id: u.id, nombre: u.nombre, status: 'ok' });
      } catch (e) {
        results.push({ id: u.id, nombre: u.nombre, status: 'error', error: e.message });
      }
    }

    const okCount = results.filter(r => r.status === 'ok').length;
    return Response.json({
      total: UPDATES.length,
      actualizados: okCount,
      errores: UPDATES.length - okCount,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});