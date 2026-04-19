import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, Loader2, Bot, User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const QUICK_PROMPTS = [
  { icon: '📅', label: 'Armar calendario de mayo', prompt: 'Arma el calendario editorial completo de mayo 2026 para Instagram, Facebook, LinkedIn y TikTok con 5 posts por semana.' },
  { icon: '✍️', label: 'Post IG kit escritorio', prompt: 'Crea un post de Instagram (Reel) para promocionar el Kit Escritorio Ejecutivo con grabado láser UV.' },
  { icon: '🎯', label: 'Campaña Google Ads B2B', prompt: 'Diseña una campaña de Google Ads para captar leads B2B corporativos con presupuesto de $800.000 CLP al mes.' },
  { icon: '💬', label: 'Ad Meta retargeting', prompt: 'Escribe 3 variantes de anuncios Meta de retargeting para visitantes que abandonaron el carrito.' },
];

export default function MarketingHubChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    (async () => {
      const conv = await base44.agents.createConversation({
        agent_name: 'marketing_orchestrator',
        metadata: { name: 'Marketing Hub · Sesión', description: 'Chat con Director IA' },
      });
      setConversation(conv);
    })();
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [conversation?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || !conversation || sending) return;
    setSending(true);
    setInput('');
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: text });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-poppins font-bold text-gray-900">Director de Marketing IA</h3>
            <p className="text-xs text-gray-500">Orquesta 4 agentes: Contenido · Publicista · Calendario · Ads</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h4 className="font-poppins font-bold text-lg text-gray-900 mb-2">¿Qué necesitas hoy?</h4>
            <p className="text-sm text-gray-500 mb-6">Delegaré tu tarea al agente especialista correcto</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
              {QUICK_PROMPTS.map((q) => (
                <button key={q.label} onClick={() => sendMessage(q.prompt)}
                  className="text-left p-3 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{q.icon}</span>
                    <span className="text-xs font-semibold text-gray-700">{q.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role !== 'user' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${m.role === 'user' ? 'bg-gray-900 text-white' : 'bg-gray-50 border border-gray-100'}`}>
              {m.role === 'user' ? (
                <p className="text-sm">{m.content}</p>
              ) : (
                <ReactMarkdown className="text-sm prose prose-sm max-w-none prose-headings:font-poppins prose-p:my-1 prose-ul:my-1">
                  {m.content || '...'}
                </ReactMarkdown>
              )}
              {m.tool_calls?.length > 0 && (
                <div className="mt-2 text-[10px] text-purple-600 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {m.tool_calls.length} acción(es) ejecutada(s)
                </div>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-4 bg-gray-50">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej: Arma un post de LinkedIn sobre Ley REP..."
            className="rounded-xl bg-white"
            disabled={sending || !conversation}
          />
          <Button type="submit" disabled={sending || !input.trim() || !conversation} className="rounded-xl bg-gray-900 hover:bg-gray-800">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}