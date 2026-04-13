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
    if (!conversationId) await initConversation();
    const mensaje = `Me interesa un regalo corporativo para ${ocasion.label}. ¿Puedes ayudarme?`;
    sendMessage(mensaje);
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
      <div className="flex-1 flex gap-2 sm:gap-4 p-2 sm:p-4 relative z-10 overflow-hidden">
        
        {/* SIDEBAR - Floating vertical */}
        <div className="hidden sm:flex flex-col items-center gap-1 sm:gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl p-2 sm:p-4 shadow-xl w-16 sm:w-20 h-fit self-center my-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`${item.color} w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform group relative flex-shrink-0`}
                title={item.label}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute bottom-full mb-1 bg-white/20 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* MAIN GLASS CARD */}
        <div className="flex-1 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500/40 to-cyan-500/40 border-b border-white/20 px-3 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <PEYULogo size="sm" showText={false} />
              <div className="hidden sm:block">
                <p className="font-poppins font-bold text-white text-xs sm:text-sm">PEYU</p>
                <p className="text-white/70 text-[10px] sm:text-xs">Historias en Regalos</p>
              </div>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 p-3 sm:p-4 md:p-8 flex-1 overflow-hidden">
            
            {/* Left Column - 60% */}
            <div className="md:col-span-2 space-y-2 sm:space-y-4 md:space-y-6 flex flex-col justify-between overflow-y-auto md:overflow-visible">
              {/* Hero Title */}
              <div className="space-y-1 sm:space-y-2 md:space-y-3">
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-poppins font-bold leading-tight">
                  <span className="text-white">Regalos</span><br className="sm:hidden" /><span className="hidden sm:inline"> Corporativos</span><br />
                  <span className="text-emerald-300 font-black">100% Sostenibles</span><br />
                  <span className="text-white text-lg sm:text-2xl md:text-4xl">Con Propósito ESG</span>
                </h1>
                <p className="text-white/80 text-xs sm:text-sm md:text-base leading-relaxed">Plástico reciclado con personalización láser. Diseña, crea y mide el impacto de tu gifting.</p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
                <Link to="/shop" className="flex-1 sm:flex-none">
                  <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold rounded-full px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 gap-1.5 sm:gap-2 shadow-lg text-xs sm:text-sm md:text-base">
                    🎁 Explorar
                  </Button>
                </Link>
                <Link to="/b2b/contacto" className="flex-1 sm:flex-none">
                  <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-full px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 gap-1.5 sm:gap-2 shadow-lg text-xs sm:text-sm md:text-base">
                    ✨ B2B
                  </Button>
                </Link>
              </div>

              {/* Chat Agent */}
              <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 flex-1 flex flex-col shadow-xl min-h-[200px] sm:min-h-[300px]">
                
                {/* Agent Header */}
                <div className="mb-2 sm:mb-3 md:mb-4 pb-2 sm:pb-3 md:pb-4 border-b border-white/20 flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-lg">✨</div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-xs sm:text-sm truncate">Asistente PEYU</p>
                    <p className="text-white/50 text-[10px] sm:text-xs line-clamp-1">Bienvenido al arte del gifting</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 mb-2 sm:mb-3 md:mb-4 scrollbar-hide">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={msgClass(msg)}>
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
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/40 text-xs sm:text-sm rounded-full focus:ring-orange-400/50 flex-1 h-8 sm:h-10"
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
              <div className="overflow-x-auto scrollbar-hide flex gap-1.5 sm:gap-2 pb-1 flex-shrink-0">
                {OCASIONES.map(occ => (
                  <button
                    key={occ.id}
                    onClick={() => handleOccasionClick(occ)}
                    className="flex flex-col items-center gap-0.5 sm:gap-1 flex-shrink-0 hover:scale-110 transition-transform group"
                  >
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/20 border border-white/30 sm:border-2 flex items-center justify-center text-lg sm:text-2xl group-hover:bg-white/30 group-hover:border-white/50 transition-all shadow-lg">
                      {occ.icon}
                    </div>
                    <span className="text-white text-[8px] sm:text-[10px] font-bold text-center leading-tight">{occ.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column - 40% - Product Showcase */}
            <div className="md:col-span-1 bg-gradient-to-br from-orange-600/40 to-red-600/30 border border-orange-500/40 rounded-2xl md:rounded-2xl p-3 sm:p-4 md:p-6 flex flex-col justify-between h-full shadow-xl">
              
              {/* Product Image */}
              <div className="aspect-square bg-gradient-to-br from-orange-400/30 to-red-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-5xl sm:text-7xl md:text-8xl">
                🎁
              </div>

              {/* Rating */}
              <div className="space-y-1 sm:space-y-2">
                <div className="flex gap-0.5 sm:gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/70 text-[10px] sm:text-xs">(+2.400)</p>
              </div>

              {/* Product Details */}
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-white font-bold text-xs sm:text-sm md:text-lg line-clamp-2">Canasta Estrelita - Edición Corporativa</p>
                <div className="bg-white/20 border border-white/30 rounded-lg p-2 sm:p-3 space-y-1">
                  <p className="text-white/80 text-[9px] sm:text-xs leading-tight">Plástico 100% reciclado • UV • Garantía 10 años</p>
                  <p className="text-white font-bold text-xs sm:text-sm md:text-lg">$30.099</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}