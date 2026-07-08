// ============================================================================
// catalogManager · CRUD completo del catálogo desde el Agent OS (solo admin)
// ----------------------------------------------------------------------------
// Potencia la card CatalogManagerCard del chat del Agente: permite al founder
// editar, crear, subir/cambiar imágenes y administrar TODO el catálogo
// (carcasas y demás productos) sin salir de la conversación.
//
// Acciones:
//   - list        { categoria?, query? }                 → productos para la grilla
//   - update      { id, campos:{...} }                   → edita campos editables
//   - create      { campos:{ sku, nombre, categoria... } } → nuevo producto
//   - setImage    { id, imagen_url }                     → imagen principal
//   - removeImage { id }                                 → quita imagen principal
//   - addGallery  { id, imagen_url }                     → agrega a galería
//   - removeGallery { id, imagen_url }                   → quita de galería
//   - setColorImage { id, color, imagen_url }            → imagen por color
//   - toggleActivo  { id, activo }                       → activa/desactiva
//   - delete      { id }                                 → elimina producto
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Campos editables seguros del producto (evita escribir built-ins / SEO autom.).
const CAMPOS_EDITABLES = new Set([
  'sku', 'nombre', 'categoria', 'material', 'canal', 'descripcion',
  'precio_b2c', 'precio_base_b2b', 'stock_actual', 'activo',
  'incluye', 'dimensiones', 'garantia_anios', 'colores',
  'lead_time_sin_personal', 'lead_time_con_personal',
]);

function limpiarCampos(campos = {}) {
  const out = {};
  for (const [k, v] of Object.entries(campos)) {
    if (CAMPOS_EDITABLES.has(k)) out[k] = v;
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: solo founders/admin' }, { status: 403 });

    const { action, payload = {} } = await req.json();
    const Producto = base44.asServiceRole.entities.Producto;

    switch (action) {
      case 'list': {
        const filtro = {};
        if (payload.categoria && payload.categoria !== 'Todas') filtro.categoria = payload.categoria;
        let productos = await Producto.filter(filtro, '-updated_date', 300).catch(() => []);
        if (payload.query) {
          const q = payload.query.toLowerCase();
          productos = productos.filter(
            (p) => (p.nombre || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q),
          );
        }
        return Response.json({ ok: true, productos });
      }

      case 'update': {
        if (!payload.id) throw new Error('Falta id de producto');
        const campos = limpiarCampos(payload.campos || {});
        if (!Object.keys(campos).length) throw new Error('Nada que actualizar');
        await Producto.update(payload.id, campos);
        return Response.json({ ok: true, message: `Producto actualizado: ${Object.keys(campos).join(', ')}` });
      }

      case 'create': {
        const campos = limpiarCampos(payload.campos || {});
        if (!campos.sku || !campos.nombre || !campos.categoria || !campos.material || !campos.canal) {
          throw new Error('Para crear un producto se requiere: sku, nombre, categoria, material y canal');
        }
        if (typeof campos.activo !== 'boolean') campos.activo = true;
        if (payload.imagen_url && String(payload.imagen_url).startsWith('http')) campos.imagen_url = payload.imagen_url;
        const nuevo = await Producto.create(campos);
        return Response.json({ ok: true, message: `Producto "${campos.nombre}" creado ✓`, producto: nuevo });
      }

      case 'setImage': {
        if (!payload.id || !payload.imagen_url) throw new Error('Falta id o imagen_url');
        await Producto.update(payload.id, { imagen_url: payload.imagen_url });
        return Response.json({ ok: true, message: 'Imagen principal actualizada ✓' });
      }

      case 'removeImage': {
        if (!payload.id) throw new Error('Falta id de producto');
        await Producto.update(payload.id, { imagen_url: '' });
        return Response.json({ ok: true, message: 'Imagen principal quitada ✓' });
      }

      case 'addGallery': {
        if (!payload.id || !payload.imagen_url) throw new Error('Falta id o imagen_url');
        const [p] = await Producto.filter({ id: payload.id });
        if (!p) throw new Error('Producto no encontrado');
        const galeria = Array.isArray(p.galeria_urls) ? [...p.galeria_urls] : [];
        if (!galeria.includes(payload.imagen_url)) galeria.push(payload.imagen_url);
        await Producto.update(payload.id, { galeria_urls: galeria });
        return Response.json({ ok: true, message: 'Imagen agregada a la galería ✓', galeria_urls: galeria });
      }

      case 'removeGallery': {
        if (!payload.id || !payload.imagen_url) throw new Error('Falta id o imagen_url');
        const [p] = await Producto.filter({ id: payload.id });
        if (!p) throw new Error('Producto no encontrado');
        const galeria = (Array.isArray(p.galeria_urls) ? p.galeria_urls : []).filter((u) => u !== payload.imagen_url);
        await Producto.update(payload.id, { galeria_urls: galeria });
        return Response.json({ ok: true, message: 'Imagen quitada de la galería ✓', galeria_urls: galeria });
      }

      case 'setColorImage': {
        if (!payload.id || !payload.color || !payload.imagen_url) throw new Error('Falta id, color o imagen_url');
        const [p] = await Producto.filter({ id: payload.id });
        if (!p) throw new Error('Producto no encontrado');
        const mapa = (p.imagenes_por_color && typeof p.imagenes_por_color === 'object') ? { ...p.imagenes_por_color } : {};
        mapa[payload.color] = payload.imagen_url;
        // Asegura que el color exista en el selector.
        const colores = Array.isArray(p.colores) ? [...p.colores] : [];
        if (!colores.includes(payload.color)) colores.push(payload.color);
        await Producto.update(payload.id, { imagenes_por_color: mapa, colores });
        return Response.json({ ok: true, message: `Imagen del color ${payload.color} actualizada ✓` });
      }

      case 'removeColorImage': {
        if (!payload.id || !payload.color) throw new Error('Falta id o color');
        const [p] = await Producto.filter({ id: payload.id });
        if (!p) throw new Error('Producto no encontrado');
        const mapa = (p.imagenes_por_color && typeof p.imagenes_por_color === 'object') ? { ...p.imagenes_por_color } : {};
        delete mapa[payload.color];
        await Producto.update(payload.id, { imagenes_por_color: mapa });
        return Response.json({ ok: true, message: `Imagen del color ${payload.color} quitada ✓`, imagenes_por_color: mapa });
      }

      case 'setColores': {
        if (!payload.id || !Array.isArray(payload.colores)) throw new Error('Falta id o colores (array)');
        const colores = payload.colores.map((c) => String(c).trim()).filter(Boolean);
        await Producto.update(payload.id, { colores });
        return Response.json({ ok: true, message: `Colores actualizados: ${colores.length} colores`, colores });
      }

      case 'toggleActivo': {
        if (!payload.id) throw new Error('Falta id de producto');
        await Producto.update(payload.id, { activo: !!payload.activo });
        return Response.json({ ok: true, message: payload.activo ? 'Producto activado ✓' : 'Producto desactivado' });
      }

      case 'delete': {
        if (!payload.id) throw new Error('Falta id de producto');
        await Producto.delete(payload.id);
        return Response.json({ ok: true, message: 'Producto eliminado' });
      }

      default:
        return Response.json({ error: `Acción no soportada: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('catalogManager error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});