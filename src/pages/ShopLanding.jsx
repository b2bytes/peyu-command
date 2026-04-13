import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, ArrowRight, ShoppingCart, Building2, Recycle } from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import AsistenteChat from '@/components/AsistenteChat';

const OCASIONES = [
  { id: 'navidad', label: 'Navidad', emoji: '🎄' },
  { id: 'patrias', label: 'Fiestas Patrias', emoji: '🇨🇱' },
  { id: 'pascua', label: 'Pascua', emoji: '🥚' },
  { id: 'anio', label: 'Año Nuevo', emoji: '🎉' },
  { id: 'trabajador', label: 'Día Trabajador', emoji: '💼' },
  { id: 'secretaria', label: 'Día Secretaria', emoji: '💐' },
  { id: 'profesor', label: 'Día Profesor', emoji: '📚' },
  { id: 'bienvenida', label: 'Bienvenida', emoji: '👋' },
  { id: 'mujer', label: 'Día Mujer', emoji: '👩' },
  { id: 'madre', label: 'Día Madre', emoji: '❤️' },
  { id: 'padre', label: 'Día Padre', emoji: '👨' },
  { id: 'cumple', label: 'Cumpleaños', emoji: '🎂' },
];

const PEYU_STATS = [
  { label: '+2.400 clientes', icon: '👥' },
  { label: '10 años garantía', icon: '🛡️' },
  { label: '100% reciclado', icon: '♻️' },
];

export default function ShopLanding() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Bienvenido. Hace una década perfeccionamos el arte del gifting estratégico. ¿Te gustaría que lleve a un recorrido personalizado?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedOcasion, setSelectedOcasion] = useState(null);
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

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      if (!conversationId) await initConversation();
      if (conversationId) {
        const conv = await base44.agents.getConversation(conversationId);
        await base44.agents.addMessage(conv, { role: 'user', content: userMsg });
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

  const handleOcasionClick = (ocasion) => {
    setSelectedOcasion(ocasion.id);
    const msg = `Me interesa crear un regalo para ${ocasion.label}. ¿Qué me recomiendas?`;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    sendMessage();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-inter">
      {/* ──── NAVBAR ──── */}
      <nav className="sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
              P
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-poppins font-bold text-sm leading-none">PEYU</p>
              <p className="text-white/40 text-[10px] leading-none mt-0.5">Historias en Regalos</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            {[
              { to: '/shop', label: 'Tienda', icon: '🛍️' },
              { to: '/b2b/contacto', label: 'B2B', icon: '🏢' },
            ].map(l => (
              <Link key={l.to} to={l.to}>
                <button className="px-3 py-2 text-white/60 hover:text-white text-xs font-medium rounded-lg hover:bg-white/5 transition-all">
                  {l.icon} {l.label}
                </button>
              </Link>
            ))}
          </div>

          <Link to="/cart" className="relative">
            <Button size="sm" className="gap-2 bg-gradient-to-r from-[#0F8B6C] to-[#0a7558] hover:from-[#0a7558] hover:to-[#084d3a] text-white rounded-xl shadow-lg font-semibold">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Carrito</span>
              {carrito.length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                  {carrito.length}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </nav>

      {/* ──── HERO SECTION ──── */}
      <section className="relative pt-8 pb-12 px-5 min-h-screen flex items-center">
        {/* Animated backgrounds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-80 h-80 bg-gradient-to-bl from-orange-500/30 to-transparent rounded-full blur-3xl opacity-50 animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-purple-600/20 via-blue-600/20 to-transparent rounded-full blur-3xl opacity-40" />
          <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-gradient-to-br from-rose-500/20 to-transparent rounded-full blur-3xl opacity-30" />
        </div>

        <div className="relative max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2">
                <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
                <span className="text-white/80 text-sm font-semibold">Tu marca, tu historia, en cada regalo</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-6xl md:text-7xl lg:text-6xl font-poppins font-bold leading-[1.1]">
                  <span className="text-white">Regalos </span>
                  <span className="bg-gradient-to-r from-orange-400 via-red-400 to-rose-500 bg-clip-text text-transparent">Corporativos</span>
                  <br />
                  <span className="text-white">que Cuentan tu </span>
                  <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 bg-clip-text text-transparent">Historia</span>
                </h1>

                <p className="text-lg text-white/70 max-w-xl leading-relaxed">
                  Más de una década transformando plástico reciclado en historias corporativas memorables. <strong className="text-white">Impacto real. Diseño duradero. Propósito claro.</strong>
                </p>
              </div>

              {/* Core Values */}
              <div className="grid grid-cols-3 gap-3 pt-4">
                {PEYU_STATS.map((stat, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center hover:bg-white/10 transition">
                    <div className="text-3xl mb-1">{stat.icon}</div>
                    <p className="text-white text-xs font-bold leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link to="/shop" className="flex-1">
                  <Button className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-2xl text-base gap-2 shadow-xl hover:shadow-2xl transition-all">
                    <ShoppingCart className="w-5 h-5" /> Explorar Catálogo
                  </Button>
                </Link>
                <Button className="flex-1 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-gray-900 font-bold rounded-2xl text-base gap-2 shadow-xl hover:shadow-2xl transition-all">
                  <Sparkles className="w-5 h-5" /> Crear Regalo
                </Button>
              </div>
            </div>

            {/* Right: Chat Box */}
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-2xl">
                {/* Header */}
                <div className="mb-4 pb-4 border-b border-white/10">
                  <p className="text-white font-bold text-sm">Bienvenido</p>
                  <p className="text-white/50 text-xs mt-1">Conversaremos sobre tu regalo perfecto</p>
                </div>

                {/* Messages */}
                <div className="h-72 overflow-y-auto space-y-3 mb-4 scrollbar-thin scrollbar-thumb-white/20">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-orange-500/60 to-red-500/60 text-white rounded-br-none'
                          : 'bg-white/15 text-white/95 rounded-bl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white/15 text-white/70 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1.5">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2 mb-4">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Cuéntame..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl focus:ring-orange-400/50 focus:border-white/30 text-sm"
                    disabled={loading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Ocasiones Grid */}
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-3">Selecciona ocasión</p>
                  <div className="grid grid-cols-4 gap-2">
                    {OCASIONES.slice(0, 8).map(occ => (
                      <button
                        key={occ.id}
                        onClick={() => handleOcasionClick(occ)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all hover:scale-105 ${
                          selectedOcasion === occ.id
                            ? 'border-white/50 bg-white/20'
                            : 'border-white/10 bg-white/5 hover:border-white/30'
                        }`}
                        title={occ.label}>
                        <span className="text-2xl">{occ.emoji}</span>
                        <span className="text-white text-[8px] font-bold text-center leading-tight">{occ.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer" className="block">
                <Button className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-2xl gap-2 shadow-lg text-sm">
                  💬 Conversar por WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ──── IMPACT SECTION ──── */}
      <section className="relative border-t border-white/5 py-12 px-5 bg-gradient-to-b from-transparent via-[#0F8B6C]/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest text-center mb-8">Nuestro Propósito</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '♻️', title: '100% Reciclado', desc: 'Plástico post-consumo transformado en diseño' },
              { icon: '🏭', title: 'Hecho en Chile', desc: 'Manufactura sustentable en Santiago' },
              { icon: '💚', title: 'Impacto Real', desc: '10 años de garantía en cada regalo' },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="text-white font-bold mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WhatsAppWidget context="general" />
      <AsistenteChat />
    </div>
  );
}