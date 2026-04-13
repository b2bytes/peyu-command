import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const productos = await base44.entities.Producto.filter({ activo: true });
    const sinImagen = productos.filter(p => !p.imagen_url);
    const conImagenGenera = productos.filter(p => 
      p.imagen_url && p.imagen_url.includes('unsplash')
    );
    
    return Response.json({ 
      total: productos.length,
      sinImagen: sinImagen.length,
      conImagenGenera: conImagenGenera.length,
      productos: productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        sku: p.sku,
        categoria: p.categoria,
        imagen_url: p.imagen_url
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});