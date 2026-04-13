import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PRODUCT_IMAGE_MAPPING = {
  // Escritorio
  'Kit Escritorio Clásico': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/f9a08d799_kitclasico.jpg',
  'Kit Escritorio Pro': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
  'Soporte Celular Ajustable': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/5085b8b77_WhatsAppImage2026-03-23at51806PM2.jpg',
  'Soporte Notebook': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/f9a08d799_kitclasico.jpg',
  'Bandeja Escritorio Organizadora': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
  
  // Hogar
  'Macetero Ecológico': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/355ca531a_sopooll1.jpg',
  'Macetero Pequeño PEYU': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/355ca531a_sopooll1.jpg',
  'Pack Maceteros': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/355ca531a_sopooll1.jpg',
  'Soporte Botellas': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/407f18312_WhatsAppImage2026-03-23at51544PM.jpg',
  'Posavasos': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/4bfe4fc51_sopooll.jpg',
  'Set Posavasos': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/4bfe4fc51_sopooll.jpg',
  
  // Entretenimiento
  'Paletas de Playa': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/407f18312_WhatsAppImage2026-03-23at51544PM.jpg',
  'Cachos': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/da02d09c2_kitclassssprro4.jpg',
  'Sombrilla': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/407f18312_WhatsAppImage2026-03-23at51544PM.jpg',
  
  // Corporativo
  'Pack Accesorios Escritorio': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
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
      
      // Search for exact or partial match in product name
      for (const [key, url] of Object.entries(PRODUCT_IMAGE_MAPPING)) {
        if (producto.nombre.toLowerCase().includes(key.toLowerCase()) ||
            key.toLowerCase().includes(producto.nombre.toLowerCase())) {
          imagenUrl = url;
          break;
        }
      }
      
      // Update if found a match and is different
      if (imagenUrl && producto.imagen_url !== imagenUrl) {
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