import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, Send, Loader2, Sparkles, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/**
 * BrainTerminal — terminal de comandos para Peyu Brain.
 * No es un widget — ocupa una columna completa del Cockpit.
 * Estilo Bloomberg / consola de operador.
 */
const SUGGESTIONS = [
  '¿Qué necesita acción urgente?',
  'Resumen del día',
  'Top SKU vendido',
  'Conversaciones con Peyu',
  'Pedidos por despachar',
  'Margen de los productos',
];

const OPS_KEYWORDS = ['lead', 'pedido', 'consulta', 'venta', 'envío', 'envio', 'stock', 'hoy', 'cuánto', 'cuanto', 'resumen', 'b2b', 'b2c', 'cliente', 'urgente', 'pendiente'];
const isOpsQuery = (q) => OPS_KEYWORDS.some(k => q.toLowerCase().includes(k));

export default function BrainTerminal() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const ask = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      if (isOpsQuery(q)) {
        const res = await base44.functions.invoke('peyuBrainOps', { query: q });
        setMessages(prev => [...prev, { role: 'assistant', content: res?.data?.answer || '_Sin respuesta._', mode: 'ops' }]);
      } else {
        const res = await base44.functions.invoke('askPeyuBrain', { query: q, top_k: 4, format: 'json' });
        const hits = res?.data?.hits || [];
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: hits[0]?.chunk_text || '_Sin resultados en knowledge base._',
          sources: hits.slice(0, 3).map(h => ({ ns: h.namespace, sku: h.sku })),
          mode: 'rag',
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 via-violet-950/40 to-indigo-950/40 backdrop-blur-md rounded-2xl border border-violet-400/30 shadow-xl flex flex-col h-[480px] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 border-b border-violet-400/20 flex-shrink-0">
        <Terminal className="w-3.5 h-3.5 text-violet-300" />
        <span className="text-xs font-bold text-violet-100 tracking-wide">BRAIN TERMINAL</span>
        <span className="text-[10px] text-violet-300/60 ml-auto font-mono">peyu_brain v2.0</span>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto peyu-scrollbar-light px-3 py-3 space-y-2 overscroll-contain">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-violet-300/70 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Sugerencias
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => ask(s)}
                  className="text-[10px] bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-400/40 text-white/80 rounded-full px-2.5 py-1 transition"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-4 text-[10px] text-violet-300/50 font-mono leading-relaxed border-l-2 border-violet-400/30 pl-2">
              <p>&gt; Conectado a data viva (PedidoWeb, B2BLead, Envío…)</p>
              <p>&gt; Conectado a knowledge base (Pinecone RAG)</p>
              <p>&gt; Listo para operar.</p>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-lg px-3 py-2 text-xs ${
              m.role === 'user'
                ? 'bg-violet-500/30 text-white border border-violet-400/40'
                : 'bg-white/5 text-white border border-white/10'
            }`}>
              {m.role === 'assistant'
                ? <div className="prose prose-invert prose-xs max-w-none [&>*]:my-1"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                : <p>{m.content}</p>}
              {m.sources?.length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-white/10 flex flex-wrap gap-1">
                  {m.sources.map((s, j) => (
                    <span key={j} className="bg-white/10 px-1.5 py-0.5 rounded text-[9px] font-mono text-violet-200">
                      {s.ns}{s.sku ? `/${s.sku}` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-white/60">
              <Loader2 className="w-3 h-3 animate-spin" /> procesando...
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 p-2.5 border-t border-violet-400/20 bg-slate-950/40">
        <div className="flex gap-2">
          <span className="text-violet-400 font-mono text-xs flex items-center">&gt;</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="Pregunta al Brain..."
            disabled={loading}
            className="flex-1 bg-transparent border-0 px-1 text-xs text-white placeholder:text-white/30 focus:outline-none font-mono"
          />
          <button
            onClick={() => ask()}
            disabled={loading || !input.trim()}
            className="w-7 h-7 rounded-md bg-violet-500/30 hover:bg-violet-500/50 text-white flex items-center justify-center disabled:opacity-30 transition"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}