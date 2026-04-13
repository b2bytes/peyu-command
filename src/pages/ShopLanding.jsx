import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import AsistenteChat from '@/components/AsistenteChat';

const OCASIONES = [
  { id: 'navidad', label: 'Navidad', emoji: '🎄', color: 'from-red-500 to-green-600' },
  { id: 'patrias', label: 'Fiestas Patrias', emoji: '🇨🇱', color: 'from-blue-600 to-red-500' },
  { id: 'pascua', label: 'Pascua', emoji: '🥚', color: 'from-yellow-400 to-orange-500' },
  { id: 'anio', label: 'Año Nuevo', emoji: '🎉', color: 'from-purple-500 to-pink-500' },
  { id: 'trabajador', label: 'Día del Trabajador', emoji: '💼', color: 'from-blue-500 to-cyan-400' },
  { id: 'secretaria', label: 'Día de la Secretaria', emoji: '💐', color: 'from-pink-500 to-red-400' },
  { id: 'profesor', label: 'Día del Profesor', emoji: '📚', color: 'from-green-500 to-teal-400' },
  { id: 'bienvenida', label: 'Bienvenida', emoji: '👋', color: 'from-yellow-400 to-amber-500' },
  { id: 'mujer', label: 'Día de la Mujer', emoji: '👩‍⚕️', color: 'from-orange-400 to-red-500' },
  { id: 'madre', label: 'Día de la Madre', emoji: '👩', color: 'from-rose-400 to-pink-500' },
  { id: 'padre', label: 'Día del Padre', emoji: '👨', color: 'from-slate-500 to-gray-600' },
  { id: 'cumple', label: 'Cumpleaños', emoji: '🎂', color: 'from-purple-400 to-pink-500' },
];

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: '👋 Bienvenido! Con más de una década perfeccionando el arte del gifting estratégico. ¿Te gustaría que lleve a un recorrido personalizado por nuestra galería?'
};

export default function ShopLanding() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedOcasion, setSelectedOcasion] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const initConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'asistente_compras',
        metadata: { context: 'landing_hero' }
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
      const conv = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conv, { role: 'user', content: userMsg });

      const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
        setMessages(data.messages || []);
      });

      setTimeout(() => unsubscribe(), 15000);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOcasionClick = async (ocasion) => {
    setSelectedOcasion(ocasion.id);
    const msg = `Me interesa crear un regalo para ${ocasion.label}. ¿Qué opciones tienes?`;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    
    try {
      if (!conversationId) await initConversation();
      const conv = await base44.agents.getConversation(conversationId || '');
      if (conversationId) {
        await base44.agents.addMessage(conv, { role: 'user', content: msg });
      }
    } catch (e) {
      console.error('Error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-inter overflow-hidden">
      {/* ──── NAVBAR ──── */}
      <nav className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform">
              P
            </div>
            <div>
              <p className="text-white font-poppins font-bold text-sm">PEYU</p>
              <p className="text-white/40 text-[10px]">Historias en Regalos</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/shop" className="text-white/60 hover:text-white text-sm font-medium transition">Tienda</Link>
            <Link to="/b2b/contacto" className="text-white/60 hover:text-white text-sm font-medium transition">B2B</Link>
            <Link to="/cart" className="relative">
              <Button size="sm" className="gap-2 bg-[#0F8B6C] hover:bg-[#0a7558] text-white rounded-xl">
                <MessageCircle className="w-4 h-4" /> Conversar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ──── HERO + CHAT ──── */}
      <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center px-5 py-12">
        {/* Gradient BG */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-purple-500/10 to-blue-600/20 blur-3xl opacity-40" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-full blur-3xl opacity-30" />

        <div className="relative max-w-5xl w-full">
          {/* Content */}
          <div className="mb-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 rounded-full px-4 py-2 text-sm text-white/80 mb-6">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Tu marca, tu historia, en cada regalo
            </div>

            <h1 className="text-5xl md:text-7xl font-poppins font-bold leading-[1.1] max-w-3xl mx-auto">
              <span className="text-white">Regalos </span>
              <span className="bg-gradient-to-r from-orange-400 via-red-400 to-rose-400 bg-clip-text text-transparent">Corporativos</span>
              <span className="text-white"> que Cuentan tu </span>
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">Historia</span>
            </h1>

            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Toda gran historia comienza con una verdad. La tuya. Nuestro viaje no empieza en un catálogo, sino en una conversación. Plástico reciclado que cobra vida con propósito.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 justify-center pt-4">
              <Link to="/shop">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-2xl h-12 px-8 shadow-lg">
                  <MessageCircle className="w-5 h-5" /> Explorar Catálogo
                </Button>
              </Link>
              <Button size="lg" className="gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-gray-900 font-bold rounded-2xl h-12 px-8 shadow-lg">
                <Sparkles className="w-5 h-5" /> Crear Regalo
              </Button>
            </div>
          </div>

          {/* Chat Box */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl max-w-2xl mx-auto">
            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto space-y-4 mb-4 pr-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-white/20 text-white rounded-br-none'
                      : 'bg-white/10 text-white/90 rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white/70 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1.5">
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                placeholder="Escribe tu respuesta..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl focus:ring-orange-400/50"
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
          </div>

          {/* Ocasiones Grid */}
          <div className="mt-12">
            <p className="text-white/60 text-sm font-semibold uppercase tracking-widest text-center mb-6">Ocasiones Especiales</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
              {OCASIONES.map(occ => (
                <button
                  key={occ.id}
                  onClick={() => handleOcasionClick(occ)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all hover:scale-105 ${
                    selectedOcasion === occ.id
                      ? 'border-white/50 bg-white/20'
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <span className="text-3xl">{occ.emoji}</span>
                  <span className="text-white text-[10px] font-bold text-center leading-tight">{occ.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative py-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-3 gap-8 text-center">
          {[
            { num: '+2.400', label: 'Clientes Satisfechos', emoji: '👥' },
            { num: '10 años', label: 'Garantía en Productos', emoji: '🛡️' },
            { num: '100%', label: 'Plástico Reciclado', emoji: '♻️' },
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="text-4xl">{item.emoji}</div>
              <p className="text-white font-poppins font-bold text-2xl">{item.num}</p>
              <p className="text-white/50 text-sm">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-white/5 py-12 px-5">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h3 className="text-3xl font-poppins font-bold text-white">¿Listo para contar tu historia?</h3>
          <p className="text-white/60">Nuestro equipo está aquí para ayudarte a crear el regalo corporativo perfecto.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
              <Button size="lg" className="gap-2 bg-[#0F8B6C] hover:bg-[#0a7558] text-white rounded-2xl font-bold">
                💬 Contactar por WhatsApp
              </Button>
            </a>
            <Link to="/b2b/contacto">
              <Button size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10 rounded-2xl font-bold">
                Solicitar Cotización <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <WhatsAppWidget context="general" />
      <AsistenteChat />
    </div>
  );
}