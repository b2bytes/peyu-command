import { base44 } from '@/api/base44Client';

// ════════════════════════════════════════════════════════════════════════
// uploadImagePublic(file) → { file_url }
// Subida de imágenes que FUNCIONA para visitantes anónimos de la tienda.
// 1) Intenta la subida directa (usuarios logueados / admin).
// 2) Si falla (comprador anónimo sin sesión), cae al backend público
//    publicUploadFile enviando el archivo en base64.
// Usado por el personalizador B2C (PersonalizadorV2) y el mockup B2B.
// ════════════════════════════════════════════════════════════════════════

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // dataURL → solo la parte base64
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export async function uploadImagePublic(file) {
  // Intento 1: subida directa (funciona con sesión activa)
  try {
    const res = await base44.integrations.Core.UploadFile({ file });
    if (res?.file_url) return { file_url: res.file_url };
  } catch (e) {
    console.warn('Subida directa falló, usando canal público:', e?.message);
  }

  // Intento 2: canal público backend (compradores anónimos)
  const data_base64 = await fileToBase64(file);
  const res = await base44.functions.invoke('publicUploadFile', {
    filename: file.name,
    mime: file.type || 'image/png',
    data_base64,
  });
  const url = res?.data?.file_url;
  if (!url) throw new Error(res?.data?.error || 'No se pudo subir el archivo');
  return { file_url: url };
}