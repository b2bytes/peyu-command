import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PEYULogo from '@/components/PEYULogo';
import { Send, ShoppingCart, Bell, Star, ChevronLeft, ChevronRight, Home, Grid3x3, Building2, HelpCircle } from 'lucide-react';
import MobileMenu from '@/components/MobileMenu';

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
  const messagesEndRef = useRef(null);
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');

  const MENU_ITEMS = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/shop', label: 'Tienda', icon: ShoppingCart },
    { href: '/catalogo-visual', label: 'Catálogo', icon: Grid3x3 },
    { href: '/b2b/contacto', label: 'B2B', icon: Building2 },
    { href: '/soporte', label: 'Soporte', icon: HelpCircle },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProductIndex((prev) => (prev + 1) % FEATURED_PRODUCTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (messageText = input) => {
    const text = messageText || input;
    if (!text.trim()) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      let convId = conversationId;
      if (!convId) {
        const conv = await base44.agents.createConversation({
          agent_name: 'asistente_compras',
          metadata: { context: 'landing', timestamp: new Date().toISOString() }
        });
        convId = conv.id;
        setConversationId(convId);
      }
      if (convId) {
        const conv = await base44.agents.getConversation(convId);
        await base44.agents.addMessage(conv, { role: 'user', content: text });
        
        let unsubscribe = null;
        let responseTimeout = null;
        
        unsubscribe = base44.agents.subscribeToConversation(convId, (data) => {
          const messages = data.messages || [];
          setMessages(messages);
          
          // Si hay una respuesta del asistente, mantener la suscripción un poco más
          const hasAssistantResponse = messages.some(msg => msg.role === 'assistant');
          if (hasAssistantResponse) {
            // Cancelar timeout anterior si existe
            if (responseTimeout) clearTimeout(responseTimeout);
            // Dejar tiempo para que el agente complete su respuesta
            responseTimeout = setTimeout(() => {
              if (unsubscribe) unsubscribe();
              setLoading(false);
            }, 5000);
          }
        });
        
        // Máximo timeout de 30 segundos
        setTimeout(() => {
          if (unsubscribe) unsubscribe();
          if (responseTimeout) clearTimeout(responseTimeout);
          setLoading(false);
        }, 30000);
      }
    } catch (e) {
      console.error('Error:', e);
      setLoading(false);
    }
  };

  const handleOccasionClick = async (ocasion) => {
    if (!conversationId) {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: 'asistente_compras',
          metadata: { context: 'landing', occasion: ocasion.id, timestamp: new Date().toISOString() }
        });
        setConversationId(conv.id);
      } catch (e) {
        console.error('Error creando conversación:', e);
        return;
      }
    }
    const mensaje = `Me gustaría un regalo corporativo para ${ocasion.label}. ¿Cuáles son las opciones disponibles y qué me recomiendas?`;
    await sendMessage(mensaje);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
      {/* SIDEBAR - macOS style */}
      <div 
        className={`hidden lg:flex flex-col bg-white/10 backdrop-blur-md border-r border-white/20 transition-all duration-300 overflow-hidden ${sidebarExpanded ? 'w-48' : 'w-16'}`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(15, 78, 137, 0.75) 50%, rgba(15, 23, 42, 0.75) 100%), url('https://media.base44.com/images/public/69d99b9d61f699701129c103/6935b8ac0_image.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* macOS Header */}
        <div className="bg-white/5 border-b border-white/10 px-3 py-2.5 flex items-center gap-2 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow"></div>
          </div>
          {sidebarExpanded && <span className="text-xs text-white/50 ml-auto font-medium">PEYU</span>}
        </div>

        {/* Menu Items */}
        <div className="flex flex-col items-center gap-1 px-2 py-4 flex-1 justify-start">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/';
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center text-white transition-all rounded-lg group relative ${
                  sidebarExpanded ? 'w-full px-3 py-2.5 justify-start gap-3' : 'w-12 h-12 justify-center'
                } ${
                  isActive ? 'bg-teal-500/30 border border-teal-500/50' : 'hover:bg-white/20'
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

      {/* Main content area */}
      <div className="flex-1 overflow-auto w-full relative" style={{
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(15, 78, 137, 0.75) 50%, rgba(15, 23, 42, 0.75) 100%), url('https://media.base44.com/images/public/69d99b9d61f699701129c103/6935b8ac0_image.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}>
        {/* Main container with glassmorphism */}
        <div className="flex gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 relative z-10 w-full flex-col lg:flex-row items-stretch h-full">
          {/* LEFT CONTAINER - Content */}
          <div className="flex-1 bg-white/3 backdrop-blur-xs border border-white/15 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col min-w-0">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500/40 to-cyan-500/40 border-b border-white/20 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MobileMenu items={MENU_ITEMS} />
                <PEYULogo size="xs" showText={true} />
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button className="w-10 h-10 lg:w-10 lg:h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all active:bg-white/40 flex-shrink-0 touch-target">
                  <Bell className="w-5 h-5" />
                </button>
                <Link to="/cart">
                  <button className="w-10 h-10 bg-teal-500 hover:bg-teal-600 rounded-full flex items-center justify-center text-white transition-all relative flex-shrink-0 active:bg-teal-700 touch-target">
                    <ShoppingCart className="w-5 h-5" />
                    {carrito.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{carrito.length}</span>}
                  </button>
                </Link>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 flex-1 overflow-y-auto">
              {/* Hero Title */}
              <div className="space-y-1.5 flex-shrink-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-poppins font-black leading-tight text-white drop-shadow-lg">
                  Regalos Corporativos <span className="text-cyan-400">100%</span>
                  <br />
                  <span className="text-emerald-400">Sostenibles</span> ESG
                </h1>
                <p className="text-white/85 text-xs sm:text-sm leading-snug drop-shadow font-medium max-w-xl">Plástico reciclado con personalización láser. Gifting corporativo con impacto.</p>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-2 flex-col sm:flex-row flex-shrink-0">
                <Link to="/shop" className="flex-1 min-w-0">
                  <Button className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-full px-4 sm:px-6 py-2.5 sm:py-3 gap-2 shadow-lg hover:shadow-xl text-xs sm:text-sm transition-all touch-target">
                    📮 Explorar Regalos
                  </Button>
                </Link>
                <Link to="/b2b/contacto" className="flex-1 min-w-0">
                  <Button className="w-full bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-gray-900 font-bold rounded-full px-4 sm:px-6 py-2.5 sm:py-3 gap-2 shadow-lg hover:shadow-xl text-xs sm:text-sm transition-all touch-target">
                    ✨ B2B Corporativo
                  </Button>
                </Link>
              </div>

              {/* Chat Agent */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-xl lg:rounded-2xl p-2 sm:p-3 flex flex-col shadow-xl flex-1 min-h-40 sm:min-h-48 overflow-hidden">
                
                {/* Agent Header */}
                <div className="mb-2 pb-2 border-b border-white/20 flex items-center gap-2 flex-shrink-0 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm shadow-lg">✨</div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-xs">Asistente</p>
                    <p className="text-white/50 text-[10px] line-clamp-1">¿Necesitas ayuda?</p>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-2 scrollbar-hide">
                  {messages.length === 0 && (
                    <div className="text-center text-white/50 text-xs py-4">
                      <p>Hola 👋 Soy tu asistente PEYU</p>
                      <p className="text-[10px] mt-1">Usa los botones abajo o escribe tu pregunta</p>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${msg.role === 'user' ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white' : 'bg-white/20 border border-white/30 text-white'} rounded-lg px-3 py-2 text-xs sm:text-sm max-w-[85%] break-words`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2 flex-shrink-0 min-w-0">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && !loading && sendMessage()}
                    placeholder="¿Necesitas?"
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/40 text-xs sm:text-sm rounded-xl focus:ring-teal-400/50 flex-1 h-10 sm:h-11 px-3 py-2 touch-target disabled:opacity-60"
                    disabled={loading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white rounded-full w-10 h-10 sm:w-11 sm:h-11 p-0 flex items-center justify-center flex-shrink-0 touch-target">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Ocasiones Carousel */}
              <div className="overflow-x-auto scrollbar-hide flex gap-1.5 sm:gap-2 pb-1 justify-center flex-shrink-0">
                {OCASIONES.map(occ => (
                  <button
                    key={occ.id}
                    onClick={() => handleOccasionClick(occ)}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 hover:scale-105 active:scale-95 transition-transform group touch-target p-1"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/25 border border-white/40 flex items-center justify-center text-xl sm:text-2xl group-hover:bg-white/35 group-hover:border-white/60 active:bg-white/40 transition-all shadow-lg">
                      {occ.icon}
                    </div>
                    <span className="text-white text-[8px] sm:text-[10px] font-bold text-center leading-tight whitespace-nowrap">{occ.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT CONTAINER - Product Carousel */}
          <Link to={`/producto/${FEATURED_PRODUCTS[currentProductIndex].id}`} className="hidden lg:block flex-shrink-0">
            <div className="w-64 bg-gradient-to-br from-teal-600/20 via-cyan-600/10 to-orange-600/10 border border-teal-400/40 rounded-2xl p-4 flex flex-col justify-between shadow-2xl hover:shadow-3xl hover:border-teal-400/60 hover:-translate-y-1 transition-all cursor-pointer group h-full">
              {(() => {
                const product = FEATURED_PRODUCTS[currentProductIndex];
                return (
                  <>
                    {/* Product Image */}
                    <div className="w-full aspect-square bg-gradient-to-br from-yellow-300/50 via-orange-400/40 to-red-500/30 rounded-xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all">
                      <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    </div>

                    {/* Rating */}
                    <div className="space-y-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400 drop-shadow-lg" />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-300 font-bold text-sm">⭐ {product.rating.toFixed(1)}</span>
                        <span className="text-white/60 text-xs">({product.reviews.toLocaleString()})</span>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-white font-poppins font-bold text-base line-clamp-1 group-hover:text-cyan-300 transition-colors">{product.nombre}</p>
                        <p className="text-white/70 text-xs mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                      </div>
                      <div className="bg-gradient-to-r from-teal-500/30 to-cyan-500/20 backdrop-blur border border-teal-400/40 rounded-xl p-3 space-y-1">
                        <p className="text-white/80 text-xs">Precio desde</p>
                        <p className="text-white font-black text-2xl group-hover:text-teal-300 transition-colors">${product.precio.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Carousel Controls */}
                    <div className="flex gap-2 justify-between items-center mt-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentProductIndex((prev) => (prev - 1 + FEATURED_PRODUCTS.length) % FEATURED_PRODUCTS.length);
                        }}
                        className="bg-white/20 hover:bg-teal-500/40 active:bg-teal-600/50 text-white p-2 rounded-lg transition-all touch-target hover:scale-110"
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
                            className={`rounded-full transition-all ${
                              idx === currentProductIndex ? 'w-2.5 h-2.5 bg-teal-400 shadow-lg' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentProductIndex((prev) => (prev + 1) % FEATURED_PRODUCTS.length);
                        }}
                        className="bg-white/20 hover:bg-teal-500/40 active:bg-teal-600/50 text-white p-2 rounded-lg transition-all touch-target hover:scale-110"
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
    </div>
  );
}