import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Plus, Home, BookOpen, Grid3x3, Settings, HelpCircle, Lock, Zap, ShoppingCart, Bell, Star } from 'lucide-react';

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
  { icon: Plus, label: 'Crear', color: 'bg-green-400' },
  { icon: Home, label: 'Inicio', color: 'bg-slate-400' },
  { icon: BookOpen, label: 'Editorial', color: 'bg-slate-400' },
  { icon: Grid3x3, label: 'Galería', color: 'bg-slate-400' },
  { icon: Settings, label: 'Comercial', color: 'bg-slate-400' },
  { icon: HelpCircle, label: 'Soporte', color: 'bg-slate-400' },
  { icon: Lock, label: 'Admin', color: 'bg-red-500' },
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

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-blue-900 via-blue-600 to-orange-300 relative overflow-hidden">
      {/* Decorative snowflakes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute text-4xl opacity-20 animate-pulse" style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.5}s`
          }}>❄️</div>
        ))}
      </div>

      {/* Main container with glassmorphism */}
      <div className="h-screen flex gap-4 p-4 relative z-10">
        
        {/* SIDEBAR - Floating vertical */}
        <div className="flex flex-col items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 shadow-xl w-20 h-fit self-start mt-4">
          {SIDEBAR_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                className={`${item.color} w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform group relative`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
                <span className="absolute bottom-full mb-2 bg-white/20 backdrop-blur text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* MAIN GLASS CARD */}
        <div className="flex-1 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500/40 to-cyan-500/40 border-b border-white/20 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">PAG</div>
              <div>
                <p className="font-poppins font-bold text-white text-sm">PEYU</p>
                <p className="text-white/70 text-xs">Historias en Regalos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all">
                <Bell className="w-5 h-5" />
              </button>
              <Link to="/cart">
                <button className="w-10 h-10 bg-teal-500 hover:bg-teal-600 rounded-full flex items-center justify-center text-white transition-all relative">
                  <ShoppingCart className="w-5 h-5" />
                  {carrito.length > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{carrito.length}</span>}
                </button>
              </Link>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-3 gap-6 p-8 h-[calc(100%-80px)] overflow-y-auto">
            
            {/* Left Column - 60% */}
            <div className="col-span-2 space-y-6 flex flex-col">
              {/* Hero Title */}
              <div className="space-y-3">
                <h1 className="text-5xl font-poppins font-bold leading-tight">
                  <span className="text-white">Regalos Corporativos</span><br />
                  <span className="text-emerald-300 font-black">100% Sostenibles</span><br />
                  <span className="text-white">Con Propósito ESG</span>
                </h1>
                <p className="text-white/80 text-sm leading-relaxed">Productos de plástico reciclado con personalización láser. Diseña, crea y mide el impacto de tu programa de gifting corporativo.</p>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-4">
                <Link to="/shop">
                  <Button className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full px-8 py-3 gap-2 shadow-lg text-base">
                    🎁 Explorar Regalos
                  </Button>
                </Link>
                <Link to="/b2b/contacto">
                  <Button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-full px-8 py-3 gap-2 shadow-lg text-base">
                    ✨ Regalos Corporativos con Propósito
                  </Button>
                </Link>
              </div>

              {/* Chat Agent */}
              <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-3xl p-6 flex-1 flex flex-col shadow-xl">
                
                {/* Agent Header */}
                <div className="mb-4 pb-4 border-b border-white/20 flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold flex-shrink-0">✨</div>
                  <div>
                    <p className="text-white font-bold text-sm">Asistente PEYU</p>
                    <p className="text-white/50 text-xs">Bienvenido. Con más de una década perfeccionando el arte del gifting</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-br-none'
                          : 'bg-white/20 border border-white/30 text-white rounded-bl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white/20 border border-white/30 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1.5">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2 flex-shrink-0">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
                    placeholder="¿Qué programa necesitas? Cuéntame tu necesidad..."
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/40 text-sm rounded-full focus:ring-orange-400/50 flex-1"
                    disabled={loading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="bg-teal-500 hover:bg-teal-600 text-white rounded-full w-10 h-10 p-0 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Ocasiones Carousel */}
              <div className="overflow-x-auto scrollbar-hide flex gap-2 pb-2">
                {OCASIONES.map(occ => (
                  <button
                    key={occ.id}
                    onClick={() => handleOccasionClick(occ)}
                    className="flex flex-col items-center gap-1 flex-shrink-0 hover:scale-110 transition-transform group"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-2xl group-hover:bg-white/30 group-hover:border-white/50 transition-all shadow-lg">
                      {occ.icon}
                    </div>
                    <span className="text-white text-[10px] font-bold text-center leading-tight">{occ.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column - 40% - Product Showcase */}
            <div className="col-span-1 bg-gradient-to-br from-orange-600/40 to-red-600/30 border border-orange-500/40 rounded-2xl p-6 flex flex-col justify-between h-full shadow-xl">
              
              {/* Product Image */}
              <div className="aspect-square bg-gradient-to-br from-orange-400/30 to-red-500/30 rounded-2xl flex items-center justify-center text-8xl">
                🎁
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/70 text-xs">(+2.400 empresas)</p>
              </div>

              {/* Product Details */}
              <div className="space-y-2">
                <p className="text-white font-bold text-lg">Canasta Estrelita Estrelita - Edición Corporativa</p>
                <div className="bg-white/20 border border-white/30 rounded-lg p-3 space-y-1">
                  <p className="text-white/80 text-xs leading-tight">Plástico 100% reciclado • Personalización UV • Emisión cero • Garantía 10 años</p>
                  <p className="text-white font-bold text-lg">$30.099</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}