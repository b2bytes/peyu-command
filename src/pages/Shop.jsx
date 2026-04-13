import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PEYULogo from '@/components/PEYULogo';
import { Send, Home, ShoppingCart, BookOpen, Grid3x3, HelpCircle, Bell, Settings, Star } from 'lucide-react';

const OCASIONES = [
  { id: 'navidad', label: 'Navidad', icon: '🎄' },
  { id: 'patrias', label: 'Patrias', icon: '🇨🇱' },
  { id: 'anio', label: 'Año Nuevo', icon: '🎉' },
  { id: 'trabajador', label: 'Trabajador', icon: '💼' },
  { id: 'secretaria', label: 'Secretaria', icon: '💐' },
  { id: 'profesor', label: 'Profesor', icon: '📚' },
  { id: 'madre', label: 'Día Madre', icon: '❤️' },
  { id: 'padre', label: 'Día Padre', icon: '👨' },
  { id: 'bienestar', label: 'Bienestar', icon: '🌟' },
  { id: 'logros', label: 'Logros', icon: '🏆' },
];

const SIDEBAR_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/shop', label: 'Tienda', icon: ShoppingCart },
  { href: '/catalogo-visual', label: 'Catálogo', icon: Grid3x3 },
  { href: '/b2b/contacto', label: 'B2B', icon: BookOpen },
  { href: '/soporte', label: 'Soporte', icon: HelpCircle },
];

export default function Shop() {
  const [productos, setProductos] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Bienvenido! Con más de una década perfeccionando el arte del gifting estratégico. ¿Te gustaría que lleve a un recorrido personalizado?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [featuredProduct, setFeaturedProduct] = useState(null);
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  const messagesEndRef = useRef(null);

  const productImages = {
    'Kit Escritorio Pro': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/11/Kit-Escritorio-Pro-2-1-1.png?fit=500&ssl=1',
    'Carcasa': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=500&ssl=1',
    'Canasta Estrelita': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/4-mixto-1024x1024-1.webp?fit=500&ssl=1',
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await base44.entities.Producto.filter({ activo: true });
        const filtered = data.filter(p => p.canal !== 'B2B Exclusivo');
        setProductos(filtered);
        if (filtered.length > 0) {
          setFeaturedProduct(filtered[0]);
        }
      } catch (e) {
        console.error('Error:', e);
      }
    };
    fetchProductos();
  }, []);

  const initConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'asistente_compras',
        metadata: { context: 'shop' }
      });
      setConversationId(conv.id);
    } catch (e) {
      console.error('Error:', e);
    }
  };

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim()) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageText }]);
    setLoading(true);

    try {
      if (!conversationId) await initConversation();
      if (conversationId) {
        const conv = await base44.agents.getConversation(conversationId);
        await base44.agents.addMessage(conv, { role: 'user', content: messageText });
        const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
          setMessages(data.messages || []);
        });
        setTimeout(() => unsubscribe(), 15000);
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const msgClass = (msg) => {
    const baseClass = 'max-w-xs rounded-xl px-3 py-2 text-xs sm:text-sm';
    if (msg.role === 'user') {
      return `${baseClass} bg-orange-500 text-white rounded-br-none`;
    }
    return `${baseClass} bg-white/20 text-white rounded-bl-none`;
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-900 via-blue-600 to-orange-300 relative overflow-hidden flex flex-col">
      <div className="flex-1 flex gap-4 p-4 relative z-10 overflow-hidden max-w-7xl mx-auto w-full">
        
        {/* LEFT SIDEBAR */}
        <div className="hidden lg:flex flex-col items-center gap-2 bg-black/30 border border-white/20 rounded-3xl p-4 shadow-xl w-20 h-fit self-start mt-4">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 flex-shrink-0"
                title={item.label}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
          <button className="w-12 h-12 rounded-full bg-red-500/80 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 flex-shrink-0 mt-auto">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* HEADER */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <PEYULogo size="md" showText={true} />
            </div>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all">
                <Bell className="w-5 h-5" />
              </button>
              <Link to="/cart">
                <button className="w-10 h-10 bg-teal-500 hover:bg-teal-600 rounded-full flex items-center justify-center text-white transition-all relative">
                  <ShoppingCart className="w-5 h-5" />
                  {carrito.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{carrito.length}</span>
                  )}
                </button>
              </Link>
            </div>
          </div>

          {/* CONTENT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
            
            {/* LEFT - HERO + CHAT */}
            <div className="md:col-span-2 space-y-4 flex flex-col overflow-y-auto">
              
              {/* HERO TITLE */}
              <div className="space-y-3 flex-shrink-0">
                <h1 className="text-5xl font-poppins font-bold leading-tight text-white">
                  Regalos Corporativos<br />
                  <span className="text-emerald-300">100%</span><br />
                  <span className="text-white">Sostenibles Con Propósito ESG</span>
                </h1>
                <p className="text-white/90 text-sm leading-relaxed font-medium">Productos de plástico reciclado con personalización láser. Diseña, crea y mide el impacto de tu programa de gifting corporativo.</p>
              </div>

              {/* CTA BUTTONS */}
              <div className="flex gap-3 flex-shrink-0">
                <Link to="/catalogo-visual" className="flex-1">
                  <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold rounded-full px-6 py-3 gap-2 shadow-lg text-sm">
                    🎁 Explorar Regalos
                  </Button>
                </Link>
                <Link to="/b2b/contacto" className="flex-1">
                  <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-full px-6 py-3 gap-2 shadow-lg text-sm">
                    💡 Corporativo
                  </Button>
                </Link>
              </div>

              {/* CHAT */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex-1 flex flex-col min-h-64">
                
                <div className="mb-3 pb-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">✨</div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm">Asistente PEYU</p>
                    <p className="text-white/50 text-xs">Bienvenido al gifting</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 mb-3 will-change-scroll">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={msgClass(msg)}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white/15 rounded-xl rounded-bl-none px-3 py-2 flex gap-1">
                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
                    placeholder="¿Qué programa necesitas?"
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/40 text-sm rounded-full focus:ring-orange-400/50 flex-1 h-9"
                    disabled={loading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="bg-teal-500 hover:bg-teal-600 text-white rounded-full w-9 h-9 p-0 flex items-center justify-center flex-shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* RIGHT - FEATURED PRODUCT */}
            <div className="md:col-span-1 bg-pink-600/30 border border-pink-400/30 rounded-2xl p-4 flex flex-col justify-between h-full shadow-lg">
              
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">P</div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-xs">@peyuchile</p>
                  <p className="text-white/50 text-[10px]">Historias en Regalos</p>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center mb-4 rounded-lg bg-gradient-to-br from-yellow-400/20 to-orange-400/20">
                {featuredProduct && (
                  <img 
                    src={productImages[featuredProduct.nombre] || 'https://via.placeholder.com/300x300'}
                    alt={featuredProduct.nombre}
                    className="w-full h-full object-contain p-2"
                    loading="lazy"
                  />
                )}
              </div>

              <div className="space-y-3 flex-shrink-0">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-white/70 text-xs ml-auto">5.0</span>
                </div>

                {featuredProduct && (
                  <div>
                    <p className="text-white font-bold text-sm mb-1 line-clamp-2">{featuredProduct.nombre}</p>
                    <p className="text-white/80 text-xs line-clamp-1">Edición Corporativa</p>
                    <p className="text-white font-bold text-xl mt-2">${(featuredProduct.precio_b2c / 1000).toFixed(0)}K</p>
                  </div>
                )}

                <button className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg font-semibold text-sm transition-colors">
                  Cotizar ahora
                </button>
              </div>
            </div>
          </div>

          {/* OCASIONES */}
          <div className="overflow-x-auto scrollbar-hide flex gap-2 pb-2 flex-shrink-0">
            {OCASIONES.map(occ => (
              <button
                key={occ.id}
                className="flex flex-col items-center gap-1 flex-shrink-0 hover:scale-110 transition-transform group"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xl group-hover:bg-white/30 group-hover:border-white/50 transition-all shadow-lg">
                  {occ.icon}
                </div>
                <span className="text-white text-[9px] font-bold text-center leading-tight">{occ.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}