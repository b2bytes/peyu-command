import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, ShoppingCart, Gift, Building2, Heart, Zap, Leaf, Users, Star, Lightbulb, Award, Target, ChevronRight } from 'lucide-react';

const OCASIONES = [
  { id: 'navidad', label: 'Navidad', icon: '🎄', color: 'bg-red-100/20 border-red-500/30' },
  { id: 'patrias', label: 'Patrias', icon: '🇨🇱', color: 'bg-blue-100/20 border-blue-500/30' },
  { id: 'anio', label: 'Año Nuevo', icon: '🎉', color: 'bg-yellow-100/20 border-yellow-500/30' },
  { id: 'trabajador', label: 'Trabajador', icon: '💼', color: 'bg-gray-100/20 border-gray-500/30' },
  { id: 'secretaria', label: 'Secretaria', icon: '💐', color: 'bg-pink-100/20 border-pink-500/30' },
  { id: 'profesor', label: 'Profesor', icon: '📚', color: 'bg-purple-100/20 border-purple-500/30' },
  { id: 'madre', label: 'Día Madre', icon: '❤️', color: 'bg-rose-100/20 border-rose-500/30' },
  { id: 'padre', label: 'Día Padre', icon: '👨', color: 'bg-slate-100/20 border-slate-500/30' },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-inter text-white overflow-x-hidden">
      {/* ──── NAVBAR ──── */}
      <nav className="sticky top-0 z-50 bg-black/40 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center font-bold text-white">P</div>
            <div className="hidden sm:block">
              <p className="font-poppins font-bold text-sm">PEYU</p>
              <p className="text-white/50 text-[10px]">Historias en Regalos</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
              <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 gap-1">
                <span className="text-base">💬</span>
              </Button>
            </a>
            <Link to="/cart">
              <Button size="sm" className="bg-gradient-to-r from-[#0F8B6C] to-[#0a7558] hover:from-[#0a7558] hover:to-[#084d3a] text-white rounded-lg gap-1">
                <ShoppingCart className="w-4 h-4" />
                {carrito.length > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{carrito.length}</span>}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ──── HERO: AGENT-CENTRIC ──── */}
      <section className="relative pt-12 pb-12 px-5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-80 h-80 bg-gradient-to-bl from-orange-500/15 via-amber-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-green-600/10 via-teal-600/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-500/40 rounded-full px-4 py-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-white/90 text-sm font-semibold">♻️ Regalos Corporativos con Propósito</span>
            </div>
          </div>

          {/* Main Layout: Agent + Content */}
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Left: Title & CTAs */}
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-poppins font-bold leading-[1.1]">
                  <span className="text-white">Regalos Corporativos</span><br />
                  <span className="bg-gradient-to-r from-[#0F8B6C] to-[#A7D9C9] bg-clip-text text-transparent">100% Sostenibles</span><br />
                  <span className="text-white">Con Propósito ESG</span>
                </h1>

                <p className="text-white/70 text-sm leading-relaxed">
                  Productos de plástico reciclado con personalización láser. Diseña, crea y mide el impacto de tu programa de gifting corporativo.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Link to="/shop">
                  <Button className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl gap-2 shadow-lg text-base">
                    <Gift className="w-5 h-5" />
                    Explorar Regalos
                  </Button>
                </Link>

                <Link to="/b2b/contacto">
                  <Button className="w-full h-12 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-gray-900 font-bold rounded-xl gap-2 shadow-lg text-base">
                    <Sparkles className="w-5 h-5" />
                    Diseñar Propuesta
                  </Button>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 pt-4">
                {[
                  { num: '+2.400', label: 'Clientes' },
                  { num: '10 años', label: 'Garantía' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                    <p className="font-bold text-white text-sm">{s.num}</p>
                    <p className="text-white/50 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Center: Agent Chat (PROTAGONIST) */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl">
                {/* Chat Header */}
                <div className="mb-4 pb-4 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold flex-shrink-0">✨</div>
                  <div>
                    <p className="text-white font-bold text-sm">Asistente PEYU</p>
                    <p className="text-white/50 text-xs">Hablamos tu idioma</p>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-orange-600/70 to-red-600/70 text-white rounded-br-none'
                          : 'bg-white/20 text-white/95 border border-white/20 rounded-bl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white/20 border border-white/20 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1.5">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Agent Input */}
                <div className="space-y-3 flex-shrink-0">
                  <label className="text-white/60 text-xs font-semibold">¿Qué programa necesitas?</label>
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Cuéntame tu necesidad..."
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/40 text-sm rounded-xl focus:ring-orange-400/50 flex-1"
                      disabled={loading}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={loading || !input.trim()}
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg p-2.5">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Occasions & Product Showcase */}
            <div className="lg:col-span-1 space-y-6">
              {/* Occasions Grid */}
              <div className="space-y-3">
                <label className="text-white/60 text-xs font-semibold block">OCASIONES ESPECIALES</label>
                <div className="grid grid-cols-4 gap-2">
                    {OCASIONES.map(occ => (
                      <button
                        key={occ.id}
                        onClick={() => handleOccasionClick(occ)}
                        className={`w-full aspect-square flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl border-2 ${occ.color} hover:border-white/40 hover:bg-white/5 transition-all group cursor-pointer`}
                        title={`Consultar sobre ${occ.label}`}
                      >
                        <span className="text-3xl group-hover:scale-125 transition-transform">{occ.icon}</span>
                        <span className="text-white text-[8px] font-bold text-center leading-tight group-hover:text-yellow-300">{occ.label}</span>
                      </button>
                    ))}
                  </div>
              </div>

              {/* Product Showcase Card */}
              <div className="bg-gradient-to-br from-orange-600/20 to-red-600/10 border border-orange-500/30 rounded-2xl overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-orange-400/30 to-red-500/30 flex items-center justify-center text-6xl">
                  🎁
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-white/50 text-xs ml-auto">(+2.400 empresas)</span>
                  </div>
                  <p className="text-white font-bold text-sm">Regalos que Crean Impacto</p>
                  <p className="text-white/70 text-xs">Plástico 100% reciclado • Personalización UV • Emisión cero • Garantía 10 años</p>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
                <Button className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl gap-2 shadow-lg text-sm">
                  💬 Consultar por WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ──── BENEFITS SECTION ──── */}
      <section className="relative border-t border-white/5 py-16 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">DIFERENCIAL PEYU</p>
            <h2 className="text-3xl font-poppins font-bold text-white">Gifting Corporativo con Propósito</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Leaf, title: 'Sostenible', desc: 'Plástico 100% reciclado post-consumo' },
              { icon: Award, title: 'Duradero', desc: 'Garantía 10 años en cada regalo' },
              { icon: Zap, title: 'Rápido', desc: 'Personalización láser en 48h' },
              { icon: Target, title: 'Estratégico', desc: 'Gifting corporativo con ROI medible' },
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all group">
                  <Icon className="w-8 h-8 text-orange-400 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-white mb-1">{b.title}</p>
                  <p className="text-white/60 text-sm">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}