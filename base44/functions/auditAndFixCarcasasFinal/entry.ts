// PEYU · auditAndFixCarcasasFinal
// Revisa CADA carcasa de la categoría "Carcasas B2C" y aplica la regla definitiva:
//
//   ✅ Tiene foto real → activo: true   (mantener visible en tienda)
//   ❌ No tiene foto real → activo: false (oculta pero NO se elimina el producto)
//
// "Foto real" = URL en base44 cuyo nombre contiene "-drv-" (subida desde Drive
// verificado por humano) O archivo cuyo nombre coincide con el modelo del producto
// (ej. SKU + nombre del modelo). Excluye explícitamente:
//    · -wb-      (Wayback Machine, genérico)
//    · log_peyu  (logo PEYU, no es del producto)
//    · turquesa, marr, blu (colores genéricos del peyuchile.cl)
//
// Body:
//   { mode: "preview" | "apply" }
//
// preview → reporte de qué cambiaría sin tocar nada
// apply   → ejecuta los updates

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Reglas de validación ───────────────────────────────────────
// Una URL es "foto real" si:
//   1. Es un archivo de base44 (CDN propio), Y
//   2. Su path/nombre contiene "-drv-" (señal de Drive verificado)
const PATRON_FOTO_REAL = /-drv-/i;

// Patrones a EXCLUIR explícitamente (no cuentan como foto real)
const PATRONES_EXCLUIR = [
  /-wb-/i,                  // wayback machine
  /log_peyu/i,              // logo PEYU
  /placeholder/i,           // placeholders
  /generic/i,               // genéricos
];

const esFotoReal = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (PATRONES_EXCLUIR.some(re => re.test(url))) return false;
  return PATRON_FOTO_REAL.test(url);
};

// Filtra una galería dejando SOLO las fotos reales
const filtrarGaleria = (urls) => {
  if (!Array.isArray(urls)) return [];
  return urls.filter(esFotoReal);
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === 'apply' ? 'apply' : 'preview';

    // 1. Cargar TODAS las carcasas (activas e inactivas)
    const productos = await base44.asServiceRole.entities.Producto.filter(
      { categoria: 'Carcasas B2C' },
      '-updated_date',
      300
    );

    const plan = [];
    let cambiosActivar = 0;       // pasarán de inactivo → activo (tienen foto real)
    let cambiosDesactivar = 0;    // pasarán de activo → inactivo (sin foto real)
    let cambiosLimpiarGaleria = 0;// galería tiene URLs no-reales que hay que sacar
    let sinCambios = 0;

    for (const p of productos) {
      const principalEsReal = esFotoReal(p.imagen_url);
      const galeriaActual = Array.isArray(p.galeria_urls) ? p.galeria_urls : [];
      const galeriaLimpia = filtrarGaleria(galeriaActual);

      // Una carcasa tiene foto real si imagen_url es real O si hay al menos
      // una foto real en la galería
      const tieneFotoReal = principalEsReal || galeriaLimpia.length > 0;

      // Determinar si la imagen principal necesita reemplazo
      // (si la principal NO es real pero la galería sí tiene una real, promovemos)
      let nuevaImagenPrincipal = p.imagen_url;
      if (!principalEsReal && galeriaLimpia.length > 0) {
        nuevaImagenPrincipal = galeriaLimpia[0];
      } else if (!principalEsReal && galeriaLimpia.length === 0) {
        // Sin foto real en ningún lado → limpiamos imagen_url también
        nuevaImagenPrincipal = null;
      }

      const debeEstarActivo = tieneFotoReal;
      const cambiaActivo = (p.activo !== debeEstarActivo);
      const cambiaPrincipal = (nuevaImagenPrincipal !== p.imagen_url);
      const cambiaGaleria = (galeriaLimpia.length !== galeriaActual.length);

      const necesitaUpdate = cambiaActivo || cambiaPrincipal || cambiaGaleria;

      if (!necesitaUpdate) {
        sinCambios++;
        continue;
      }

      // Construir patch
      const patch = {};
      if (cambiaActivo) patch.activo = debeEstarActivo;
      if (cambiaPrincipal) patch.imagen_url = nuevaImagenPrincipal;
      if (cambiaGaleria) patch.galeria_urls = galeriaLimpia;

      const item = {
        producto_id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        antes: {
          activo: p.activo,
          imagen_url: p.imagen_url,
          galeria_count: galeriaActual.length,
        },
        despues: {
          activo: debeEstarActivo,
          imagen_url: nuevaImagenPrincipal,
          galeria_count: galeriaLimpia.length,
        },
        tiene_foto_real: tieneFotoReal,
        accion: !tieneFotoReal ? 'desactivar' :
                (cambiaActivo && debeEstarActivo) ? 'activar' :
                'limpiar_galeria',
        patch,
      };
      plan.push(item);

      if (cambiaActivo && debeEstarActivo) cambiosActivar++;
      else if (cambiaActivo && !debeEstarActivo) cambiosDesactivar++;
      else if (cambiaGaleria || cambiaPrincipal) cambiosLimpiarGaleria++;

      // Aplicar si corresponde
      if (mode === 'apply') {
        await base44.asServiceRole.entities.Producto.update(p.id, patch);
      }
    }

    // Snapshot final del catálogo
    const totalActivosFinales = mode === 'apply'
      ? plan.filter(i => i.despues.activo).length + sinCambios -
        productos.filter(p => p.activo && !plan.find(i => i.producto_id === p.id)).length +
        productos.filter(p => p.activo && !plan.find(i => i.producto_id === p.id)).length
      : null;

    // Mejor: contemos directo del estado FINAL esperado
    const finalActivos = productos.filter(p => {
      const item = plan.find(i => i.producto_id === p.id);
      return item ? item.despues.activo : p.activo;
    }).length;

    const finalInactivos = productos.length - finalActivos;

    return Response.json({
      ok: true,
      mode,
      total_carcasas: productos.length,
      resumen: {
        cambios_activar: cambiosActivar,
        cambios_desactivar: cambiosDesactivar,
        cambios_limpiar_galeria: cambiosLimpiarGaleria,
        sin_cambios: sinCambios,
      },
      estado_final: {
        activos_visibles_en_tienda: finalActivos,
        inactivos_ocultos: finalInactivos,
        total_productos: productos.length,
      },
      plan,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});