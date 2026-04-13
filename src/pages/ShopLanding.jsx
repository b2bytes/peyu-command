import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, ArrowRight, ShoppingCart, Building2, Leaf, ChevronDown } from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import AsistenteChat from '@/components/AsistenteChat';

const OCASIONES = [
  { id: 'navidad', label: 'Navidad', emoji: '🎄' },
  { id: 'patrias', label: 'Fiestas Patrias', emoji: '🇨🇱' },
  { id: 'pascua', label: 'Pascua', emoji: '🥚' },
  { id: 'anio', label: 'Año Nuevo', emoji: '🎉' },
  { id: 'trabajador', label: 'Día Trabajador', emoji: '💼' },
  { id: 'secretaria', label: 'Secretaria', emoji: '💐' },
  { id: 'profesor', label: 'Profesor', emoji: '📚' },
  { id: 'bienvenida', label: 'Bienvenida', emoji: '👋' },
  { id: 'mujer', label: 'Día Mujer', emoji: '👩' },
  { id: 'madre', label: 'Día Madre', emoji: '❤️' },
  { id: 'padre', label: 'Día Padre', emoji: '👨' },
  { id: 'cumple', label: 'Cumpleaños', emoji: '🎂' },
];

export default function ShopLanding() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hola. Hace una década transformamos plástico en historias. ¿Cuál es la tuya?' }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-inter text-white overflow-hidden">
      {/* ──── NAVBAR ──── */}
      <nav className="sticky top-0 z-50 bg-black/40 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center font-bold text-white shadow-lg">P</div>
            <div className="hidden sm:block">
              <p className="font-poppins font-bold text-sm leading-none">PEYU</p>
              <p className="text-white/50 text-[10px] leading-none">Historias en Regalos</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            <Link to="/shop" className="px-3 py-2 text-white/70 hover:text-white text-xs font-medium rounded-lg hover:bg-white/5 transition">Tienda</Link>
            <a href="#ocasiones" className="px-3 py-2 text-white/70 hover:text-white text-xs font-medium rounded-lg hover:bg-white/5 transition">Ocasiones</a>
          </div>

          <div className="flex items-center gap-2">
            <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
              <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 gap-1">
                <span className="text-base">💬</span> <span className="hidden sm:inline text-xs">WhatsApp</span>
              </Button>
            </a>
            <Link to="/cart" className="relative">
              <Button size="sm" className="bg-gradient-to-r from-[#0F8B6C] to-[#0a7558] hover:from-[#0a7558] hover:to-[#084d3a] text-white gap-1 rounded-lg font-semibold">
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Carrito</span>
                {carrito.length > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{carrito.length}</span>}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ──── HERO: RELATO PEYU ──── */}
      <section className="relative pt-16 pb-20 px-5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-96 h-96 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-tr from-green-600/15 via-teal-600/15 to-transparent rounded-full blur-3xl opacity-50" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-white/90 text-sm font-semibold">Tu marca, tu historia, en cada regalo</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl font-poppins font-bold leading-[1.1] max-w-4xl mx-auto">
              <span className="text-white">Regalos </span>
              <span className="bg-gradient-to-r from-orange-400 via-red-400 to-rose-500 bg-clip-text text-transparent">Corporativos</span>
              <br />
              <span className="text-white">que Cuentan tu </span>
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">Historia</span>
            </h1>

            {/* Subheadline: Core Message */}
            <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light">
              Más de <strong className="text-white font-semibold">una década</strong> transformando plástico reciclado en impacto corporativo. 
              No vendemos catálogos. <strong className="text-white font-semibold">Abrimos conversaciones.</strong>
            </p>

            {/* Core Stats */}
            <div className="flex flex-wrap justify-center gap-4 py-4">
              {[
                { stat: '+2.400', label: 'Historias Contadas' },
                { stat: '10 años', label: 'Garantía PEYU' },
                { stat: '100%', label: 'Reciclado en Chile' },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center">
                  <p className="font-poppins font-bold text-lg text-white">{item.stat}</p>
                  <p className="text-white/60 text-xs mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Main CTA Row: Sales Funnel */}
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-16">
            {/* 1. Explore */}
            <Link to="/shop">
              <Button className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-2xl shadow-xl hover:shadow-2xl gap-2 transition-all group">
                <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Explorar Catálogo
              </Button>
            </Link>

            {/* 2. Quote (B2B) */}
            <Link to="/b2b/contacto">
              <Button className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-base rounded-2xl shadow-xl hover:shadow-2xl gap-2 transition-all group">
                <Building2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Cotizar B2B
              </Button>
            </Link>

            {/* 3. Create */}
            <Button className="w-full h-14 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-gray-900 font-bold text-base rounded-2xl shadow-xl hover:shadow-2xl gap-2 transition-all group">
              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Crear Regalo
            </Button>
          </div>

          {/* Occasions Section */}
          <div id="ocasiones" className="space-y-6 mb-20">
            <div className="text-center space-y-2">
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Cada momento cuenta</p>
              <h2 className="text-3xl font-poppins font-bold text-white">Ocasiones Especiales</h2>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
                {OCASIONES.map(occ => (
                  <Link key={occ.id} to={`/shop?occasion=${occ.id}`}>
                    <button className="w-full aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 transition-all group">
                      <span className="text-4xl group-hover:scale-125 transition-transform">{occ.emoji}</span>
                      <span className="text-white text-[9px] font-bold text-center leading-tight">{occ.label}</span>
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Chat + Story Grid */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: PEYU Story */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-poppins font-bold text-white">La Historia PEYU</h3>
                <div className="space-y-4 text-white/80 leading-relaxed">
                  <p>
                    <strong className="text-white">Nació de una pregunta:</strong> ¿Qué pasa cuando el plástico que contamina nuestras playas se transforma en historias corporativas memorables?
                  </p>
                  <p>
                    Hace más de <strong className="text-white">una década</strong>, comenzamos a recolectar plástico post-consumo en Santiago. Hoy, cada pieza que creamos cuenta la historia de una empresa comprometida con el impacto real.
                  </p>
                  <p>
                    <strong className="text-white">No es un catálogo.</strong> Es una plataforma conversacional donde tu marca cobra vida a través de regalos únicos, personalizables y 100% reciclados.
                  </p>
                </div>
              </div>

              {/* PEYU Values */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '♻️', title: 'Circular', desc: 'Del mar a tu marca' },
                  { icon: '🏭', title: 'Local', desc: 'Fabricado en Santiago' },
                  { icon: '💚', title: 'ESG', desc: 'Impacto Certificado' },
                  { icon: '🎯', title: 'Estratégico', desc: 'Gifting con Propósito' },
                ].map((v, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition">
                    <div className="text-3xl mb-2">{v.icon}</div>
                    <p className="font-bold text-white text-sm">{v.title}</p>
                    <p className="text-white/50 text-xs mt-1">{v.desc}</p>
                  </div>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
                <Button className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-2xl gap-2 shadow-lg">
                  💬 Conversar por WhatsApp
                </Button>
              </a>
            </div>

            {/* Right: Chat Widget */}
            <div className="lg:sticky lg:top-24">
              <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-2xl">
                <div className="mb-4 pb-4 border-b border-white/10">
                  <p className="text-white font-bold text-sm">Asistente PEYU</p>
                  <p className="text-white/50 text-xs mt-1">Tu compañero en la búsqueda del regalo perfecto</p>
                </div>

                {/* Messages */}
                <div className="h-72 overflow-y-auto space-y-3 mb-4 scrollbar-thin scrollbar-thumb-white/20">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-orange-500/70 to-red-500/70 text-white rounded-br-none'
                          : 'bg-white/15 text-white/95 rounded-bl-none border border-white/20'
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
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Cuéntanos tu historia..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm rounded-xl focus:ring-orange-400/50"
                    disabled={loading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── CLOSING CTA ──── */}
      <section className="relative border-t border-white/5 py-16 px-5 bg-gradient-to-b from-transparent to-[#0F8B6C]/10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-poppins font-bold text-white">¿Listo para contar tu historia?</h2>
          <p className="text-white/70 text-lg">Cada regalo PEYU es una conversación sobre quién eres y qué buscas impactar.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop">
              <Button className="px-8 h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl gap-2">
                <ShoppingCart className="w-5 h-5" /> Empezar
              </Button>
            </Link>
            <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
              <Button className="px-8 h-12 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl gap-2">
                💬 Consultar
              </Button>
            </a>
          </div>
        </div>
      </section>

      <WhatsAppWidget context="general" />
      <AsistenteChat />
    </div>
  );
}