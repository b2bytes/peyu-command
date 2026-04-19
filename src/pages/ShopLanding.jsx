import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PEYULogo from '@/components/PEYULogo';
import { Send, ShoppingCart, Bell, Star, ChevronLeft, ChevronRight, Home, Grid3x3, Building2, HelpCircle, Heart } from 'lucide-react';
import MobileMenu from '@/components/MobileMenu';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import ChatMessageContent from '@/components/chat/ChatMessageContent';

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

const STORAGE_KEY = 'peyu_chat_conversation_id';

export default function ShopLanding() {
  const [conversationId, setConversationId] = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy Peyu 🐢. Ayudo a empresas y personas a encontrar el regalo perfecto hecho con plástico 100% reciclado.\n\n¿Buscas regalo para empresa o uso personal?' }
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
    { href: '/nosotros', label: 'Nosotros', icon: Heart },
    { href: '/soporte', label: 'Soporte', icon: HelpCircle },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Recuperar conversación existente al montar (si el usuario vuelve al home)
  useEffect(() => {
    if (!conversationId) return;
    let alive = true;
    (async () => {
      try {
        const conv = await base44.agents.getConversation(conversationId);
        const msgs = (conv?.messages || []).filter(m => m.content);
        if (alive && msgs.length > 0) setMessages(msgs);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setConversationId(null);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProductIndex((prev) => (prev + 1) % FEATURED_PRODUCTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (messageText) => {
    const text = (typeof messageText === 'string' ? messageText : input).trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    try {
      // Crear o recuperar conversación (persistida para continuar en otras páginas)
      let conv;
      if (!conversationId) {
        conv = await base44.agents.createConversation({
          agent_name: 'asistente_compras',
          metadata: { context: 'landing' }
        });
        setConversationId(conv.id);
        localStorage.setItem(STORAGE_KEY, conv.id);
      } else {
        conv = await base44.agents.getConversation(conversationId);
      }

      const msgCountBefore = (conv.messages || []).length;

      // Enviar mensaje al agente
      await base44.agents.addMessage(conv, { role: 'user', content: text });

      // Polling: verificar cada 1.5s si llegó respuesta del agente
      let attempts = 0;
      const maxAttempts = 30; // 45 segundos máx

      const poll = async () => {
        attempts++;
        const updated = await base44.agents.getConversation(conv.id);
        const msgs = (updated.messages || []).filter(m => m.content);
        const last = msgs[msgs.length - 1];

        // Actualizar mensajes siempre (para mostrar streaming parcial si aplica)
        if (msgs.length > 0) setMessages(msgs);

        // Respuesta lista: más mensajes que antes, y el último es del asistente
        if (last?.role === 'assistant' && msgs.length > msgCountBefore + 1) {
          setLoading(false);
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 1500);
        } else {
          setLoading(false);
        }
      };

      setTimeout(poll, 1500);

    } catch (e) {
      console.error('Error chat:', e);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error de conexión. Intenta de nuevo.' }]);
      setLoading(false);
    }
  };

  const handleOccasionClick = async (ocasion) => {
    const mensaje = `Me gustaría un regalo corporativo para ${ocasion.label}. ¿Cuáles son las opciones disponibles y qué me recomiendas?`;
    await sendMessage(mensaje);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
      <WhatsAppFloat />
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
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <Link to="/admin" className="hidden sm:block">
                  <button className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white transition-all active:bg-white/40 touch-target">
                    👤 Admin
                  </button>
                </Link>
                <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all active:bg-white/40 flex-shrink-0 touch-target hidden sm:flex">
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm shadow-lg">🐢</div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-xs">Peyu</p>
                    <p className="text-white/50 text-[10px] line-clamp-1">Asistente de Gifting</p>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 mb-3 scrollbar-hide">
                  {messages.length === 0 && (
                    <div className="text-center text-white/60 text-xs py-6 space-y-2">
                      <p className="text-sm font-medium">👋 Hola, soy Peyu</p>
                      <p>Tu asistente para regalos corporativos sostenibles</p>
                      <p className="text-[10px] text-white/40 mt-2">Cuéntame qué necesitas o usa los botones de ocasiones</p>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-teal-500/30 flex items-center justify-center flex-shrink-0 text-xs">🐢</div>
                      )}
                      <div className={`rounded-xl px-3.5 py-2.5 text-xs sm:text-sm break-words leading-relaxed ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-br-none max-w-[75%]' : 'bg-white/15 text-white border border-white/25 rounded-bl-none backdrop-blur-sm max-w-[85%] w-full'}`}>
                        {msg.role === 'assistant'
                          ? <ChatMessageContent content={msg.content} />
                          : msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-6 h-6 rounded-full bg-teal-500/30 flex items-center justify-center flex-shrink-0 text-xs">🐢</div>
                      <div className="bg-white/15 border border-white/25 rounded-xl rounded-bl-none px-3.5 py-2.5 text-white flex items-center gap-2 backdrop-blur-sm">
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
                    onKeyDown={e => e.key === 'Enter' && !loading && sendMessage(input)}
                    placeholder="¿Qué necesitas?"
                    className="bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/50 text-xs sm:text-sm rounded-full focus:ring-teal-400/50 focus:border-teal-400/50 flex-1 h-10 sm:h-11 px-4 py-2 touch-target disabled:opacity-60 transition-all"
                    disabled={loading}
                  />
                  <Button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 active:from-teal-700 active:to-cyan-700 text-white rounded-full w-10 h-10 sm:w-11 sm:h-11 p-0 flex items-center justify-center flex-shrink-0 touch-target shadow-lg transition-all disabled:opacity-60">
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
            <div className="w-60 bg-gradient-to-br from-teal-600/20 via-cyan-600/10 to-orange-600/10 border border-teal-400/40 rounded-2xl p-3 flex flex-col gap-2.5 shadow-2xl hover:shadow-3xl hover:border-teal-400/60 hover:-translate-y-1 transition-all cursor-pointer group h-full">
              {(() => {
                const product = FEATURED_PRODUCTS[currentProductIndex];
                return (
                  <>
                    {/* Product Image */}
                    <div className="w-full aspect-square bg-gradient-to-br from-yellow-300/50 via-orange-400/40 to-red-500/30 rounded-xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all flex-shrink-0">
                      <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    </div>

                    {/* Rating + Name + Price — all together */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-2.5 space-y-1.5 flex-shrink-0">
                      {/* Stars + count */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span className="text-yellow-300 font-bold text-xs">{product.rating.toFixed(1)}</span>
                        <span className="text-white/50 text-[10px]">({product.reviews.toLocaleString()})</span>
                      </div>
                      {/* Name */}
                      <p className="text-white font-poppins font-bold text-sm leading-tight line-clamp-1 group-hover:text-cyan-300 transition-colors">{product.nombre}</p>
                      {/* Description */}
                      <p className="text-white/60 text-[10px] leading-relaxed line-clamp-2">{product.description}</p>
                      {/* Price */}
                      <div className="flex items-baseline gap-1.5 pt-0.5 border-t border-white/15">
                        <span className="text-white/60 text-[10px]">Desde</span>
                        <span className="text-white font-black text-xl group-hover:text-teal-300 transition-colors">${product.precio.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Carousel Controls */}
                    <div className="flex gap-2 justify-between items-center flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentProductIndex((prev) => (prev - 1 + FEATURED_PRODUCTS.length) % FEATURED_PRODUCTS.length);
                        }}
                        className="bg-white/20 hover:bg-teal-500/40 active:bg-teal-600/50 text-white p-1.5 rounded-lg transition-all hover:scale-110"
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
                        className="bg-white/20 hover:bg-teal-500/40 active:bg-teal-600/50 text-white p-1.5 rounded-lg transition-all hover:scale-110"
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