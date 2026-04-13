import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CATEGORY_IMAGES = {
  'Escritorio': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
  'Hogar': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/355ca531a_sopooll1.jpg',
  'Entretenimiento': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/da02d09c2_kitclassssprro4.jpg',
  'Corporativo': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
  'Carcasas B2C': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/5085b8b77_WhatsAppImage2026-03-23at51806PM2.jpg',
};

const PRODUCT_IMAGES = {
  'Kit Escritorio Pro': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
  'Soporte Celular': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/5085b8b77_WhatsAppImage2026-03-23at51806PM2.jpg',
  'Soporte Notebook': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/f9a08d799_kitclasico.jpg',
  'Soporte Aguas': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/407f18312_WhatsAppImage2026-03-23at51544PM.jpg',
  'Cachos': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/da02d09c2_kitclassssprro4.jpg',
  'Macetero': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/355ca531a_sopooll1.jpg',
  'Posavasos': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/4bfe4fc51_sopooll.jpg',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch all active products
    const productos = await base44.entities.Producto.filter({ activo: true });
    
    // Update each product with correct image
    const updates = [];
    for (const producto of productos) {
      let imagenUrl = null;
      
      // First try exact product name match
      for (const [productName, url] of Object.entries(PRODUCT_IMAGES)) {
        if (producto.nombre.toLowerCase().includes(productName.toLowerCase()) ||
            productName.toLowerCase().includes(producto.nombre.toLowerCase())) {
          imagenUrl = url;
          break;
        }
      }
      
      // If not found, use category image as fallback
      if (!imagenUrl && producto.categoria) {
        imagenUrl = CATEGORY_IMAGES[producto.categoria];
      }
      
      // Update if has image and is different
      if (imagenUrl && (!producto.imagen_url || producto.imagen_url !== imagenUrl)) {
        updates.push(
          base44.entities.Producto.update(producto.id, { imagen_url: imagenUrl })
        );
      }
    }
    
    await Promise.all(updates);
    
    return Response.json({ 
      success: true, 
      updated: updates.length,
      total: productos.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});