import { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

export default function InstagramGallery() {
  const [liked, setLiked] = useState({});

  const posts = [
    {
      id: 1,
      username: '@peyuchile',
      avatar: '🐢',
      image: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/11/Kit-Escritorio-Pro-2-1-1.png?fit=1920&ssl=1',
      title: 'Kit Escritorio Pro',
      description: 'Personalización UV • 10 años garantía',
      likes: 2547,
      comments: 184,
      price: '$89.990'
    },
    {
      id: 2,
      username: '@peyuchile',
      avatar: '🐢',
      image: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=300&ssl=1',
      title: 'Carcasas 100% Recicladas',
      description: '69 Diseños | Protección + Estilo',
      likes: 3124,
      comments: 256,
      price: '$34.990'
    },
    {
      id: 3,
      username: '@peyuchile',
      avatar: '🐢',
      image: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/4-mixto-1024x1024-1.webp?fit=300&ssl=1',
      title: 'Cachos Multicolor',
      description: '8 Colores | Fibra Natural',
      likes: 1892,
      comments: 142,
      price: '$12.990'
    },
    {
      id: 4,
      username: '@peyuchile',
      avatar: '🐢',
      image: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/09/dce80c23-7441-4922-a656-8627018c1e5d-1.jpeg?fit=300&ssl=1',
      title: 'Accesorios Escritorio',
      description: '7 Modelos | Diseño Minimalista',
      likes: 2156,
      comments: 198,
      price: '$19.990'
    },
    {
      id: 5,
      username: '@peyuchile',
      avatar: '🐢',
      image: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/potfinal_porta-Photoroom-1.jpg?fit=300&ssl=1',
      title: 'Maceteros Eco',
      description: '6 Modelos | Perfecto para plantas',
      likes: 1743,
      comments: 127,
      price: '$24.990'
    },
    {
      id: 6,
      username: '@peyuchile',
      avatar: '🐢',
      image: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/07/WhatsApp-Image-2025-09-10-at-6.08.47-PM-2.jpeg?fit=300&ssl=1',
      title: 'Posavasos Premium',
      description: '3 Modelos | Protege tu mesa',
      likes: 987,
      comments: 84,
      price: '$16.990'
    }
  ];

  const toggleLike = (id) => {
    setLiked(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-poppins font-bold text-center mb-12 text-gray-900">
          Galería PEYU <span className="text-[#0F8B6C]">Instagram</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b">
                <div className="text-4xl">{post.avatar}</div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{post.username}</p>
                  <p className="text-xs text-gray-500">Regalos Sostenibles</p>
                </div>
              </div>

              {/* Image */}
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-200"
                  loading="lazy"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-4 py-3 border-b">
                <button 
                  onClick={() => toggleLike(post.id)}
                  className="transition-colors"
                >
                  <Heart 
                    className={`w-6 h-6 ${liked[post.id] ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'}`}
                  />
                </button>
                <MessageCircle className="w-6 h-6 text-gray-600 hover:text-blue-500 transition-colors cursor-pointer" />
                <Share2 className="w-6 h-6 text-gray-600 hover:text-green-500 transition-colors cursor-pointer" />
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="font-bold text-sm text-gray-800 mb-1">{liked[post.id] ? post.likes + 1 : post.likes} likes</p>
                <div className="mb-3">
                  <p className="font-bold text-gray-900 text-sm line-clamp-1">{post.title}</p>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-1">{post.description}</p>
                </div>
                <p className="text-xl font-bold text-[#0F8B6C] mb-3">{post.price}</p>
                <button className="w-full bg-[#0F8B6C] hover:bg-[#0a7558] text-white py-2 rounded-lg font-semibold text-sm transition-colors">
                  Ver
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}