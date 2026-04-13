import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PEYULogo from '@/components/PEYULogo';
import { Send, Home, BookOpen, Grid3x3, HelpCircle, ShoppingCart, Bell, Star, Building2 } from 'lucide-react';

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

export default function ShopLanding() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '✨ Bienvenido. Con más de una década perfeccionando el arte del gifting estratégico. ¿Te gustaría que lleve a un recorrido personalizado?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="h-screen w-screen bg-gradient-to-br from-blue-900 via-blue-600 to-orange-300 relative overflow-hidden flex flex-col">
      {/* Decorative snowflakes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute text-4xl opacity-20 animate-pulse" style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.5}s`
          }}>❄️</div>
        ))}
      </div>

      {/* Main container with glassmorphism */}
      <div className="flex-1 flex gap-3 sm:gap-5 p-3 sm:p-6 relative z-10 overflow-hidden max-w-7xl mx-auto w-full">
        
        {/* SIDEBAR - Floating vertical */}
        <div className="hidden lg:flex flex-col items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-3 sm:p-5 shadow-xl w-20 sm:w-24 h-fit self-center my-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`${item.color} w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform group relative flex-shrink-0`}
                title={item.label}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute bottom-full mb-2 bg-white/20 backdrop-blur text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* MAIN GLASS CARD */}
        <div className="flex-1 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500/40 to-cyan-500/40 border-b border-white/20 px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 flex items-center justify-between flex-shrink-0">
            <PEYULogo size="sm" showText={true} />
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

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8 flex-1 overflow-hidden">
            
            {/* Left Column - 60% */}
            <div className="md:col-span-2 space-y-4 sm:space-y-6 md:space-y-8 flex flex-col justify-between overflow-y-auto md:overflow-visible">
              {/* Hero Title */}
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div>
                  <h1 className="text-5xl sm:text-6xl md:text-8xl font-poppins font-black leading-tight text-white drop-shadow-lg mb-2">
                    Regalos Corporativos
                  </h1>
                  <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3">
                    <span className="text-5xl sm:text-6xl md:text-7xl font-poppins font-black text-emerald-300">100%</span>
                    <div>
                      <span className="text-5xl sm:text-6xl md:text-7xl font-poppins font-black text-emerald-300 block md:inline">Sostenibles</span>
                      <span className="text-3xl sm:text-4xl md:text-5xl font-poppins font-bold text-white block md:inline md:ml-4">Con Propósito ESG</span>
                    </div>
                  </div>
                </div>
                <p className="text-white/95 text-base sm:text-lg md:text-lg leading-relaxed drop-shadow font-medium max-w-xl">Productos de plástico reciclado con personalización láser. Diseña, crea y mide el impacto de tu programa de gifting corporativo.</p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-shrink-0">
               <Link to="/shop" className="flex-1 sm:flex-none">
                 <Button className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold rounded-full px-6 sm:px-10 py-3 md:py-4 gap-2 shadow-xl hover:shadow-2xl text-base md:text-lg transition-all">
                   🎁 Explorar Regalos
                 </Button>
               </Link>
               <Link to="/b2b/contacto" className="flex-1 sm:flex-none">
                 <Button className="w-full bg-gradient-to-r from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold rounded-full px-6 sm:px-10 py-3 md:py-4 gap-2 shadow-xl hover:shadow-2xl text-base md:text-lg transition-all">
                   ✨ Regalos Corporativos con Propósito
                 </Button>
               </Link>
              </div>

              {/* Chat Agent */}
              <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-3xl p-4 sm:p-5 md:p-7 flex-1 flex flex-col shadow-xl min-h-[280px] sm:min-h-[350px]">
                
                {/* Agent Header */}
                <div className="mb-4 md:mb-5 pb-4 md:pb-5 border-b border-white/20 flex items-center gap-3 md:gap-4 flex-shrink-0">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-2xl shadow-lg">✨</div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-base md:text-lg">Asistente PEYU</p>
                    <p className="text-white/60 text-sm">Bienvenido. Con más de una década perfeccionando el arte del gifting estratégico.</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 mb-3 sm:mb-4 md:mb-5 scrollbar-hide">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={msgClass(msg) + ' text-sm sm:text-base'}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white/20 border border-white/30 rounded-xl sm:rounded-2xl rounded-bl-none px-3 sm:px-4 py-2 sm:py-3 flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
                    placeholder="¿Qué programa necesitas?"
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/40 text-sm sm:text-base rounded-full focus:ring-orange-400/50 flex-1 h-10 sm:h-12"
                    disabled={loading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="bg-teal-500 hover:bg-teal-600 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 p-0 flex items-center justify-center flex-shrink-0">
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>

              {/* Ocasiones Carousel */}
              <div className="overflow-x-auto scrollbar-hide flex gap-2 sm:gap-3 pb-2 flex-shrink-0">
                {OCASIONES.map(occ => (
                  <button
                    key={occ.id}
                    onClick={() => handleOccasionClick(occ)}
                    className="flex flex-col items-center gap-1 sm:gap-1.5 flex-shrink-0 hover:scale-110 transition-transform group"
                  >
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/20 border border-white/30 sm:border-2 flex items-center justify-center text-xl sm:text-3xl group-hover:bg-white/30 group-hover:border-white/50 transition-all shadow-lg">
                      {occ.icon}
                    </div>
                    <span className="text-white text-[9px] sm:text-xs font-bold text-center leading-tight">{occ.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column - 40% - Product Showcase */}
            <div className="md:col-span-1 bg-gradient-to-br from-orange-600/40 to-red-600/30 border border-orange-500/40 rounded-3xl p-4 sm:p-5 md:p-7 flex flex-col justify-between h-full shadow-xl">
              
              {/* Product Image */}
              <div className="aspect-square bg-gradient-to-br from-yellow-300/40 via-orange-400/30 to-red-500/20 rounded-2xl md:rounded-3xl flex items-center justify-center text-8xl md:text-9xl shadow-inner">
                🎁
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 md:w-6 md:h-6 fill-yellow-300 text-yellow-300 drop-shadow" />
                  ))}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-yellow-300 font-bold text-lg">⭐ 5.0</span>
                  <span className="text-white/70 text-sm">(+2.400 valoraciones)</span>
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-3 md:space-y-4">
                <p className="text-white font-bold text-base md:text-lg line-clamp-2">Canasta Estrelita Estrelita - Edición Corporativa</p>
                <div className="bg-white/20 backdrop-blur border border-white/40 rounded-xl p-4 md:p-5 space-y-2 shadow-lg">
                  <p className="text-white/95 text-xs md:text-sm leading-snug">Plástico 100% reciclado • Personalización UV • Garantía 10 años</p>
                  <p className="text-white font-black text-2xl md:text-3xl">$30.099</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}