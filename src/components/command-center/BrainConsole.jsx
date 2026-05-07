import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, Send, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/**
 * Consola de chat directo con Peyu Brain (RAG vectorial sobre la base de
 * conocimiento PEYU). Pensada para que los fundadores pregunten cosas tipo:
 *   "¿qué SKU se vendió más esta semana?"
 *   "¿cuáles son las políticas de envío a regiones extremas?"
 *   "¿qué dice el FAQ sobre garantías?"
 *
 * Llama directamente a la función `askPeyuBrain` (RAG) y muestra la respuesta
 * con sus fuentes. NO usa LLM completo — es búsqueda semántica + síntesis ligera.
 */
const SUGGESTIONS = [
  '¿Cuántos leads llegaron hoy?',
  '¿Cuántas consultas hoy?',
  'Resumen del día',
  '¿Cuántos pedidos entregados hoy?',
  '¿Conversaciones con Peyu?',
  '¿Cuál es nuestro top SKU?',
];

// Palabras clave que indican consulta operacional (data viva, no RAG)
const OPS_KEYWORDS = [
  'lead', 'leads', 'consulta', 'consultas', 'pedido', 'pedidos',
  'conversaci', 'agente', 'peyu chat', 'venta', 'ventas',
  'entreg', 'entregad', 'envío', 'envio', 'despach', 'tracking',
  'propuesta', 'propuestas', 'cotizaci',
  'stock', 'inventario',
  'hoy', 'cuántos', 'cuantos', 'resumen', 'estado', 'kpi',
  'b2b', 'b2c', 'compra'
];

const isOpsQuery = (q) => {
  const lower = q.toLowerCase();
  return OPS_KEYWORDS.some(k => lower.includes(k));
};

export default function BrainConsole() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Scroll SOLO dentro del contenedor del chat (no afecta a la página)
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const ask = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      // Router: si es consulta operacional → peyuBrainOps (data viva)
      // sino → askPeyuBrain (RAG vectorial sobre knowledge base)
      if (isOpsQuery(q)) {
        const res = await base44.functions.invoke('peyuBrainOps', { query: q });
        const data = res?.data || {};
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer || '_Sin respuesta._',
          sources: (data.sources || []).map(s => ({ ns: 'ops', id: s, preview: `Data viva · ${s}` })),
          mode: 'ops',
        }]);
      } else {
        const res = await base44.functions.invoke('askPeyuBrain', {
          query: q,
          top_k: 5,
          format: 'json',
        });
        const hits = res?.data?.hits || [];
        if (hits.length === 0) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '_Sin resultados en la base de conocimiento. Intenta preguntar sobre data operacional ("leads hoy", "pedidos entregados", "conversaciones") o reformular._',
            sources: [],
            mode: 'rag',
          }]);
        } else {
          const topHit = hits[0];
          const synthesis = topHit.chunk_text || '_(sin contenido)_';
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: synthesis,
            sources: hits.slice(0, 4).map(h => ({
              ns: h.namespace,
              id: h.id,
              sku: h.sku,
              score: h.score,
              preview: (h.chunk_text || '').slice(0, 120),
            })),
            mode: 'rag',
          }]);
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message || 'no se pudo consultar el Brain'}`,
        sources: [],
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-violet-900/40 to-indigo-900/40 backdrop-blur-md rounded-2xl border border-violet-400/30 p-5 shadow-xl flex flex-col h-[420px] max-h-[420px] min-h-0 overflow-hidden">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-poppins font-semibold text-white text-sm">Peyu Brain · Consola</h3>
          <p className="text-[10px] text-violet-200/70">Data viva (leads, pedidos, chats) + knowledge (FAQs, ESG)</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 peyu-scrollbar-light overscroll-contain">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-violet-200/70 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Sugerencias:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => ask(s)}
                  className="text-[11px] bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 rounded-full px-2.5 py-1 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-xl px-3 py-2 text-xs ${
              m.role === 'user'
                ? 'bg-violet-500/40 text-white border border-violet-400/30'
                : 'bg-white/10 text-white border border-white/10'
            }`}>
              {m.role === 'assistant'
                ? <div className="prose prose-invert prose-xs max-w-none [&>*]:my-1"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                : <p>{m.content}</p>}
              {m.sources?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                  {m.sources.map((s, j) => (
                    <div key={j} className="flex items-start gap-1.5 text-[10px] text-white/60">
                      <span className="bg-white/10 px-1.5 py-0.5 rounded text-violet-200 font-mono shrink-0">
                        {s.ns}{s.sku ? `/${s.sku}` : ''}
                      </span>
                      <span className="line-clamp-1">{s.preview}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/10 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-white/70">
              <Loader2 className="w-3 h-3 animate-spin" />
              Consultando el Brain...
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()}
          placeholder="Pregunta al Brain..."
          disabled={loading}
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
        />
        <button
          onClick={() => ask()}
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white flex items-center justify-center disabled:opacity-50 transition"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}