import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, X, Loader } from 'lucide-react';

export default function AsistenteChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
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
        metadata: { name: 'Chat Asistente Compras', context: 'storefront' }
      });
      setConversationId(conv.id);
      setMessages([
        { role: 'assistant', content: '¡Hola! 👋 Soy tu asistente PEYU. ¿En qué puedo ayudarte? Busco productos, una cotización corporativa, o tienes preguntas sobre personalización. 🌱' }
      ]);
    } catch (e) {
      console.error('Error creando conversación:', e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const conv = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conv, { role: 'user', content: userMsg });

      const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
        setMessages(data.messages || []);
      });

      setTimeout(() => unsubscribe(), 15000);
    } catch (e) {
      console.error('Error enviando mensaje:', e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error procesando tu mensaje. Por favor intenta nuevamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (!conversationId) initConversation();
  };

  return (
    <>
      {/* FAB Button */}
      {!open && (
        <button onClick={handleOpen}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-[#0F8B6C] to-[#06634D] rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white group hover:scale-110">
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0F8B6C] to-[#06634D] text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Asistente PEYU</h3>
              <p className="text-xs text-white/70">Respondo en tiempo real</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white hover:bg-white/20 p-1 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto h-96 space-y-3 p-4 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2.5 flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              placeholder="Escribe tu consulta..."
              className="text-sm rounded-xl border-gray-200 focus:ring-[#0F8B6C]"
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              size="sm"
              className="bg-[#0F8B6C] hover:bg-[#0a7558] rounded-xl">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}