import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Sparkles, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
    <div className="bg-gradient-to-br from-slate-950 via-violet-950/30 to-indigo-950/30 backdrop-blur-md rounded-2xl border border-violet-400/30 shadow-xl flex flex-col h-[420px] lg:h-[520px] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/5 border-b border-violet-400/10 flex-shrink-0">
        <Terminal className="w-3.5 h-3.5 text-violet-300" />
        <h3 className="text-[11px] font-bold tracking-[0.2em] text-white">BRAIN TERMINAL</h3>
        <span className="text-[9px] text-violet-300/60 font-mono">· peyu_brain_v2</span>
        <span className="ml-auto flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
          <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
          ONLINE
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto peyu-scrollbar-light px-3 py-3 space-y-2 overscroll-contain font-mono">
        {messages.length === 0 && (
          <div className="space-y-3">
            {/* Boot log */}
            <div className="text-[10px] text-violet-300/40 leading-relaxed border-l border-violet-400/20 pl-2 space-y-0.5">
              <p>&gt; <span className="text-emerald-400">●</span> connected · pinecone_rag</p>
              <p>&gt; <span className="text-emerald-400">●</span> connected · live_data (PedidoWeb, B2BLead, Envío…)</p>
              <p>&gt; <span className="text-emerald-400">●</span> agent_router · ops|rag|cmd</p>
              <p className="text-violet-300/70 mt-1">&gt; ready_</p>
            </div>

            <div className="pt-2">
              <p className="text-[10px] text-violet-300/70 font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                <Sparkles className="w-3 h-3" /> Quick queries
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => ask(s)}
                    className="text-[10px] bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-400/40 text-white/80 rounded-md px-2 py-1 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[92%] rounded-lg px-3 py-2 text-xs ${
              m.role === 'user'
                ? 'bg-violet-500/25 text-white border border-violet-400/30'
                : 'bg-white/5 text-white/95 border border-white/10'
            }`}>
              {m.role === 'assistant'
                ? <div className="prose prose-invert prose-xs max-w-none [&>*]:my-1 font-sans"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                : <p className="font-sans">{m.content}</p>}
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
              <Loader2 className="w-3 h-3 animate-spin text-violet-400" /> <span className="font-mono">processing...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 px-3 py-2 border-t border-violet-400/20 bg-slate-950/60">
        <div className="flex gap-2 items-center">
          <span className="text-violet-400 font-mono text-xs">$</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="pregunta o comando..."
            disabled={loading}
            className="flex-1 bg-transparent border-0 px-1 text-xs text-white placeholder:text-white/25 focus:outline-none font-mono"
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