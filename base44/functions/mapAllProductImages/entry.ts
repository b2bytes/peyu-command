import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Mapeo por palabras clave
const KEYWORD_IMAGES = {
  'Macetero': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/355ca531a_sopooll1.jpg',
  'Posavasos': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/4bfe4fc51_sopooll.jpg',
  'Escritorio': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
  'Kit': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
  'Soporte': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/5085b8b77_WhatsAppImage2026-03-23at51806PM2.jpg',
  'Cacho': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/da02d09c2_kitclassssprro4.jpg',
  'Paleta': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/407f18312_WhatsAppImage2026-03-23at51544PM.jpg',
  'Playa': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/407f18312_WhatsAppImage2026-03-23at51544PM.jpg',
  'Carcasa': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/5085b8b77_WhatsAppImage2026-03-23at51806PM2.jpg',
  'Lámpara': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
  'Llavero': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/5085b8b77_WhatsAppImage2026-03-23at51806PM2.jpg',
  'Cuadro': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
  'Pocillo': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/355ca531a_sopooll1.jpg',
  'Jenga': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/da02d09c2_kitclassssprro4.jpg',
  'Botella': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/407f18312_WhatsAppImage2026-03-23at51544PM.jpg',
  'Sombrilla': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/407f18312_WhatsAppImage2026-03-23at51544PM.jpg',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch all active products
    const productos = await base44.entities.Producto.filter({ activo: true });
    
    // Update each product with keyword match
    const updates = [];
    
    for (const producto of productos) {
      let imagenUrl = null;
      
      // Find first keyword match
      for (const [keyword, url] of Object.entries(KEYWORD_IMAGES)) {
        if (producto.nombre.toLowerCase().includes(keyword.toLowerCase())) {
          imagenUrl = url;
          break;
        }
      }
      
      // If no keyword match, use category fallback
      if (!imagenUrl) {
        const categoryMap = {
          'Escritorio': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
          'Hogar': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/355ca531a_sopooll1.jpg',
          'Entretenimiento': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/da02d09c2_kitclassssprro4.jpg',
          'Corporativo': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
          'Carcasas B2C': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/5085b8b77_WhatsAppImage2026-03-23at51806PM2.jpg',
        };
        imagenUrl = categoryMap[producto.categoria];
      }
      
      // Update if image is different
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