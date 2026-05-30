// ============================================================================
// PEYU OS · Panel de Memoria (cerebro Pinecone)
// ─────────────────────────────────────────────────────────────────────────────
// Drawer deslizable que deja "ver lo que el agente recuerda". Busca semántica-
// mente en el índice peyu-brain (productos, clientes, conversaciones, propuestas)
// vía la función existente pineconeSearch, con reranking para mayor precisión.
// Mobile-first: ocupa toda la pantalla en celular, panel lateral en desktop.
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, X, Search, Loader2, Sparkles } from 'lucide-react';

const NAMESPACES = [
  { id: 'products', label: 'Productos', emoji: '📦' },
  { id: 'clientes', label: 'Clientes', emoji: '🤝' },
  { id: 'conversations', label: 'Conversaciones', emoji: '💬' },
  { id: 'proposals', label: 'Propuestas', emoji: '📄' },
];

export default function MemoryPanel({ open, onClose }) {
  const [namespace, setNamespace] = useState('products');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  // Reset al cerrar para no arrastrar resultados de una búsqueda anterior.
  useEffect(() => {
    if (!open) {
      setHits([]);
      setQuery('');
      setSearched(false);
      setError(null);
    }
  }, [open]);

  const buscar = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await base44.functions.invoke('pineconeSearch', {
        namespace,
        query: query.trim(),
        top_k: 8,
        rerank: true,
        rerank_top_n: 6,
      });
      setHits(res?.data?.hits || []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'No se pudo consultar la memoria');
      setHits([]);
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#22302c]/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-[#fbfaf7] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#ece4d8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#0F8B6C]/10 flex items-center justify-center">
              <Brain className="w-4.5 h-4.5 text-[#0F8B6C]" />
            </div>
            <div>
              <h3 className="font-poppins font-bold text-[#22302c] leading-none">Memoria de Peyu</h3>
              <p className="text-[11px] text-[#6f7d77] mt-0.5">Lo que el agente recuerda del negocio</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-[#f6f1ea] flex items-center justify-center text-[#6f7d77]" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Namespaces */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide border-b border-[#ece4d8]">
          {NAMESPACES.map((ns) => (
            <button
              key={ns.id}
              onClick={() => { setNamespace(ns.id); setHits([]); setSearched(false); }}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition ${
                namespace === ns.id
                  ? 'bg-[#0F8B6C] text-white'
                  : 'bg-white border border-[#e7d8c6] text-[#6f7d77] hover:border-[#0F8B6C]/40'
              }`}
            >
              <span>{ns.emoji}</span> {ns.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="flex-shrink-0 px-4 py-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white border border-[#e7d8c6] px-3 focus-within:border-[#0F8B6C]/50 transition">
            <Search className="w-4 h-4 text-[#9aa6a0] flex-shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              placeholder="Ej: regalos corporativos sustentables"
              className="flex-1 bg-transparent border-0 outline-none text-sm text-[#22302c] placeholder:text-[#9aa6a0] py-2.5 min-w-0"
            />
            <button
              onClick={buscar}
              disabled={loading || !query.trim()}
              className="w-8 h-8 rounded-xl bg-[#0F8B6C] hover:bg-[#0b6e55] flex items-center justify-center text-white transition disabled:opacity-40 flex-shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-y-auto peyu-scrollbar px-4 pb-6 space-y-2">
          {error && (
            <div className="text-sm text-[#b91c1c] bg-[#fbe9e1] border border-[#f0c9bd] rounded-2xl px-4 py-3">
              {error}
            </div>
          )}

          {!searched && !error && (
            <div className="text-center py-12 text-[#9aa6a0]">
              <Brain className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Pregúntale a la memoria del negocio.<br />Busca productos, clientes, conversaciones o propuestas.</p>
            </div>
          )}

          {searched && !loading && !error && hits.length === 0 && (
            <div className="text-center py-12 text-[#9aa6a0]">
              <p className="text-sm">Sin recuerdos para esa búsqueda.</p>
            </div>
          )}

          {hits.map((h) => (
            <div key={h.id} className="rounded-2xl bg-white border border-[#ece4d8] p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-[#22302c] leading-relaxed flex-1 line-clamp-4">
                  {h.chunk_text || h.text || h.nombre || h.descripcion || h.id}
                </p>
                {typeof h.score === 'number' && (
                  <span className="flex-shrink-0 text-[10px] font-semibold text-[#0F8B6C] bg-[#0F8B6C]/10 px-2 py-0.5 rounded-full">
                    {Math.round(h.score * 100)}%
                  </span>
                )}
              </div>
              {(h.sku || h.empresa || h.categoria) && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {h.sku && <span className="text-[10px] text-[#6f7d77] bg-[#f6f1ea] px-2 py-0.5 rounded-full">{h.sku}</span>}
                  {h.categoria && <span className="text-[10px] text-[#6f7d77] bg-[#f6f1ea] px-2 py-0.5 rounded-full">{h.categoria}</span>}
                  {h.empresa && <span className="text-[10px] text-[#6f7d77] bg-[#f6f1ea] px-2 py-0.5 rounded-full">{h.empresa}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}