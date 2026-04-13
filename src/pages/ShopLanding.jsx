import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PEYULogo from '@/components/PEYULogo';
import { Send, Home, BookOpen, Grid3x3, HelpCircle, ShoppingCart, Bell, Star, Building2, ChevronLeft, ChevronRight } from 'lucide-react';

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
  { href: '/', label: 'Inicio', icon: Home, color: 'bg-teal-500' },
  { href: '/shop', label: 'Tienda', icon: ShoppingCart, color: 'bg-teal-500' },
  { href: '/b2b/catalogo', label: 'Catálogo', icon: Grid3x3, color: 'bg-teal-500' },
  { href: '/b2b/contacto', label: 'B2B', icon: Building2, color: 'bg-teal-500' },
  { href: '/soporte', label: 'Soporte', icon: HelpCircle, color: 'bg-teal-500' },
];

const FEATURED_PRODUCTS = [
  { id: 1, nombre: 'Kit Escritorio Pro', precio: 30099, imagen: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg', rating: 5.0, reviews: 2400, description: 'Plástico 100% reciclado • Personalización UV • Garantía 10 años' },
  { id: 2, nombre: 'Soporte Celular Aguas', precio: 6990, imagen: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/5085b8b77_WhatsAppImage2026-03-23at51806PM2.jpg', rating: 5.0, reviews: 1840, description: 'Plástico 100% reciclado • Múltiples colores • Garantía 10 años' },
  { id: 3, nombre: 'Soporte Notebook', precio: 18500, imagen: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/f9a08d799_kitclasico.jpg', rating: 5.0, reviews: 1620, description: 'Plástico 100% reciclado • Entretenimiento • Garantía 10 años' },
  { id: 4, nombre: 'Soporte Aguas Andinas', precio: 12999, imagen: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/407f18312_WhatsAppImage2026-03-23at51544PM.jpg', rating: 5.0, reviews: 980, description: 'Plástico 100% reciclado • Diseño moderno • Garantía 10 años' },
];

export default function ShopLanding() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '✨ Bienvenido. Con más de una década perfeccionando el arte del gifting estratégico. ¿Te gustaría que lleve a un recorrido personalizado?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProductIndex((prev) => (prev + 1) % FEATURED_PRODUCTS.length);
    }, 23000);
    return () => clearInterval(interval);
  }, []);

  const initConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'asistente_compras',
        metadata: { context: 'landing' }
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

  const handleOccasionClick = async (ocasion) => {
    if (!conversationId) {
      const conv = await base44.agents.createConversation({
        agent_name: 'asistente_compras',
        metadata: { context: 'landing' }
      });
      setConversationId(conv.id);
    }
    const mensaje = `Me interesa un regalo corporativo para ${ocasion.label}. ¿Puedes ayudarme?`;
    await sendMessage(mensaje);
  };

  const msgClass = (msg) => {
    const baseClass = 'max-w-[85%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm';
    if (msg.role === 'user') {
      return `${baseClass} bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-br-none`;
    }
    return `${baseClass} bg-white/20 border border-white/30 text-white rounded-bl-none`;
  };

  return (
    <div className={`h-screen w-full relative overflow-hidden flex flex-col lg:flex-row transition-opacity duration-500 ${!pageLoaded ? 'opacity-0' : 'opacity-100'}`} style={{

      backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(15, 78, 137, 0.75) 50%, rgba(15, 23, 42, 0.75) 100%), url('https://media.base44.com/images/public/69d99b9d61f699701129c103/6935b8ac0_image.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Main container with glassmorphism */}
      <div className="flex-1 flex gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6 relative z-10 w-full flex-col lg:flex-row items-stretch h-full">
        
        {/* SIDEBAR - macOS style */}
        <div 
          className={`hidden lg:flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden ${
            sidebarExpanded ? 'w-48' : 'w-16'
          }`}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          {/* macOS Header */}
          <div className="bg-white/5 border-b border-white/10 px-3 py-2.5 flex items-center gap-2 flex-shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow"></div>
            </div>
            {sidebarExpanded && <span className="text-xs text-white/50 ml-auto font-medium">MENU</span>}
          </div>

          {/* Menu Items */}
          <div className="flex flex-col items-center gap-1 px-2 py-3 flex-1 justify-start">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center text-white hover:bg-white/20 transition-all rounded-lg group relative ${
                    sidebarExpanded ? 'w-full px-3 py-2.5 justify-start gap-3' : 'w-12 h-12 justify-center'
                  }`}
                  title={item.label}
                >
                  <Icon className={`flex-shrink-0 ${
                    sidebarExpanded ? 'w-4 h-4' : 'w-6 h-6'
                  }`} />
                  {sidebarExpanded && <span className="text-xs font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* LEFT CONTAINER - Content */}
        <div className="flex-1 bg-white/3 backdrop-blur-xs border border-white/15 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col min-w-0">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500/40 to-cyan-500/40 border-b border-white/20 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0">
            <PEYULogo size="xs" showText={true} />
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all flex-shrink-0">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <Link to="/cart">
                <button className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-500 hover:bg-teal-600 rounded-full flex items-center justify-center text-white transition-all relative flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  {carrito.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[8px] sm:text-[9px] font-bold rounded-full flex items-center justify-center">{carrito.length}</span>}
                </button>
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 flex-1">
            {/* Hero Title */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-poppins font-black leading-tight text-white drop-shadow-lg">
                Regalos Corporativos <span className="text-teal-400">100%</span>
                <br />
                <span className="text-emerald-400">Sostenibles</span> Con Propósito ESG
              </h1>
              <p className="text-white/90 text-xs sm:text-sm leading-tight drop-shadow font-medium max-w-2xl">Productos de plástico reciclado con personalización láser. Diseña, crea y mide el impacto de tu programa de gifting corporativo.</p>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-2 flex-col sm:flex-row">
              <Link to="/shop" className="flex-1 min-w-0">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-full px-4 sm:px-6 py-2 sm:py-2.5 gap-2 shadow-lg hover:shadow-xl text-xs sm:text-sm transition-all">
                  📮 Explorar Regalos
                </Button>
              </Link>
              <Link to="/b2b/contacto" className="flex-1 min-w-0">
                <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-full px-4 sm:px-6 py-2 sm:py-2.5 gap-2 shadow-lg hover:shadow-xl text-xs sm:text-sm transition-all">
                  ✨ B2B Corporativo
                </Button>
              </Link>
            </div>

            {/* Chat Agent */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-2xl lg:rounded-3xl p-3 sm:p-4 flex flex-col shadow-xl flex-1 min-h-48 sm:min-h-56 overflow-hidden">
              
              {/* Agent Header */}
              <div className="mb-2 pb-2 border-b border-white/20 flex items-center gap-2 flex-shrink-0 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm shadow-lg">✨</div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-xs">Asistente PEYU</p>
                  <p className="text-white/50 text-[10px] line-clamp-1">¿Te gustaría un recorrido personalizado?</p>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-2 scrollbar-hide">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${msg.role === 'user' ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white' : 'bg-white/20 border border-white/30 text-white'} rounded-lg px-3 py-2 text-xs sm:text-sm max-w-[85%] break-words`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2 flex-shrink-0 min-w-0">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  placeholder="¿Qué necesitas?"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/40 text-xs sm:text-sm rounded-2xl focus:ring-teal-400/50 flex-1 h-9 sm:h-10"
                  disabled={loading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-teal-500 hover:bg-teal-600 text-white rounded-full w-9 h-9 sm:w-10 sm:h-10 p-0 flex items-center justify-center flex-shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>

            </div>

            {/* Ocasiones Carousel */}
            <div className="overflow-x-auto scrollbar-hide flex gap-2 sm:gap-3 pb-1 justify-center">
              {OCASIONES.map(occ => (
                <button
                  key={occ.id}
                  onClick={() => handleOccasionClick(occ)}
                  className="flex flex-col items-center gap-1 flex-shrink-0 hover:scale-105 transition-transform group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/25 border border-white/40 flex items-center justify-center text-xl sm:text-2xl group-hover:bg-white/35 group-hover:border-white/60 transition-all shadow-lg">
                    {occ.icon}
                  </div>
                  <span className="text-white text-[8px] sm:text-xs font-bold text-center leading-tight whitespace-nowrap">{occ.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CONTAINER - Product Carousel */}
        <Link to={`/producto/${FEATURED_PRODUCTS[currentProductIndex].id}`} className="hidden lg:block flex-shrink-0">
        <div className="w-64 bg-gradient-to-br from-orange-600/10 to-red-600/5 border border-orange-500/20 rounded-2xl lg:rounded-3xl p-4 lg:p-6 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:border-orange-500/40 transition-all cursor-pointer group h-full">
          {(() => {
            const product = FEATURED_PRODUCTS[currentProductIndex];
            return (
              <>
                {/* Product Image */}
                <div className="w-full aspect-square bg-gradient-to-br from-yellow-300/40 via-orange-400/30 to-red-500/20 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-inner overflow-hidden">
                  <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover object-center" loading="lazy" />
                </div>

                {/* Rating */}
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 lg:w-5 lg:h-5 fill-yellow-300 text-yellow-300 drop-shadow" />
                    ))}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-yellow-300 font-bold text-sm lg:text-base">⭐ {product.rating.toFixed(1)}</span>
                    <span className="text-white/70 text-xs lg:text-sm">({product.reviews.toLocaleString()} valoraciones)</span>
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-2 lg:space-y-3">
                  <p className="text-white font-poppins font-bold text-sm lg:text-base line-clamp-2">{product.nombre}</p>
                  <div className="bg-white/20 backdrop-blur border border-white/40 rounded-lg lg:rounded-xl p-3 lg:p-4 space-y-1.5 shadow-lg">
                    <p className="text-white/95 text-xs lg:text-sm leading-snug">{product.description}</p>
                    <p className="text-white font-black text-xl lg:text-2xl">${product.precio.toLocaleString()}</p>
                  </div>
                </div>

                {/* Carousel Controls */}
                <div className="flex gap-1.5 justify-center mt-2.5">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentProductIndex((prev) => (prev - 1 + FEATURED_PRODUCTS.length) % FEATURED_PRODUCTS.length);
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex gap-1 items-center">
                    {FEATURED_PRODUCTS.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentProductIndex(idx);
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentProductIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentProductIndex((prev) => (prev + 1) % FEATURED_PRODUCTS.length);
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            );
          })()}
        </div>
        </Link>
      </div>
    </div>
  );
}