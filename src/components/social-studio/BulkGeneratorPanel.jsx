// ============================================================================
// BulkGeneratorPanel — Selecciona productos y genera variantes en masa.
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, Loader2, Check, AlertCircle, Image as ImageIcon, Instagram, Linkedin, Facebook, Music2, Zap } from 'lucide-react';

const REDES = [
  { id: 'Instagram', icon: Instagram, color: 'from-pink-500 to-rose-500' },
  { id: 'LinkedIn', icon: Linkedin, color: 'from-sky-600 to-blue-700' },
  { id: 'Facebook', icon: Facebook, color: 'from-blue-500 to-indigo-600' },
  { id: 'TikTok', icon: Music2, color: 'from-fuchsia-500 to-purple-600' },
];

const PILARES = ['Producto', 'Sostenibilidad/ESG', 'Educativo', 'Detrás de escena', 'Testimonios', 'Promoción', 'Branding', 'Comunidad'];

export default function BulkGeneratorPanel({ onGenerated }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [redes, setRedes] = useState(['Instagram', 'LinkedIn']);
  const [variantesPorRed, setVariantesPorRed] = useState(1);
  const [pilar, setPilar] = useState('Producto');
  const [temaExtra, setTemaExtra] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.entities.Producto.list('nombre', 200).then(p => {
      setProductos(p.filter(x => x.activo !== false && x.imagen_url));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return productos.filter(p => !q || p.nombre?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
  }, [productos, search]);

  const toggleProducto = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleRed = (id) => {
    setRedes(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const totalEstimado = selected.size * redes.length * variantesPorRed;

  const generar = async () => {
    if (selected.size === 0) return setError('Selecciona al menos 1 producto');
    if (redes.length === 0) return setError('Selecciona al menos 1 red');
    if (selected.size > 20) return setError('Máximo 20 productos por lote');

    setGenerating(true);
    setError('');
    setResult(null);
    try {
      const res = await base44.functions.invoke('bulkGeneratePromoVariants', {
        producto_ids: [...selected],
        redes,
        variantes_por_red: variantesPorRed,
        pilar,
        tema_extra: temaExtra,
      });
      setResult(res.data);
      onGenerated?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 h-full min-h-0">
      {/* Selector de productos */}
      <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col min-h-0 overflow-hidden">
        <div className="p-3 border-b border-white/10 flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-poppins font-semibold text-white text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-violet-400" />
              Productos disponibles
            </h3>
            <span className="text-xs text-white/50">
              {selected.size} de {filtered.length} seleccionados
            </span>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar productos…"
                className="pl-9 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selected.size === filtered.length) setSelected(new Set());
                else setSelected(new Set(filtered.slice(0, 20).map(p => p.id)));
              }}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs"
            >
              {selected.size === filtered.length ? 'Limpiar' : 'Top 20'}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto peyu-scrollbar-light p-2 min-h-0">
          {loading ? (
            <div className="text-center py-8 text-white/50 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Cargando…
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filtered.map(p => {
                const isSel = selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProducto(p.id)}
                    className={`relative group text-left rounded-xl overflow-hidden border-2 transition-all ${
                      isSel ? 'border-violet-400 ring-2 ring-violet-400/30' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="aspect-square bg-black/30">
                      <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    {isSel && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                    <div className="p-1.5 bg-black/60 backdrop-blur">
                      <p className="text-[11px] font-medium text-white truncate">{p.nombre}</p>
                      <p className="text-[9px] font-mono text-white/50 truncate">{p.sku}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Configuración + acción */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 overflow-y-auto peyu-scrollbar-light">
        <div>
          <h3 className="font-poppins font-semibold text-white text-sm flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            Configuración del lote
          </h3>
        </div>

        <div>
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Redes destino</label>
          <div className="grid grid-cols-2 gap-2">
            {REDES.map(r => {
              const Icon = r.icon;
              const active = redes.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggleRed(r.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    active
                      ? `bg-gradient-to-r ${r.color} text-white border-transparent`
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {r.id}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Variantes por red</label>
          <div className="flex gap-2">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                onClick={() => setVariantesPorRed(n)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  variantesPorRed === n ? 'bg-violet-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Pilar de contenido</label>
          <select
            value={pilar}
            onChange={e => setPilar(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            {PILARES.map(p => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Contexto adicional (opcional)</label>
          <Input
            value={temaExtra}
            onChange={e => setTemaExtra(e.target.value)}
            placeholder="Ej: Cyber Day, Día de la Madre…"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 text-sm"
          />
        </div>

        <div className="bg-violet-500/10 border border-violet-400/30 rounded-lg p-3 text-xs text-violet-200 space-y-1">
          <p className="font-bold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Vista previa del lote</p>
          <p>Total a generar: <strong className="text-white">{totalEstimado} posts</strong></p>
          <p className="text-violet-300/70">≈ {Math.ceil(totalEstimado * 8)} segundos · {totalEstimado} imágenes IA</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-400/30 rounded-lg p-2.5 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {result && (
          <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-3 text-xs text-emerald-200">
            <p className="font-bold flex items-center gap-1.5 mb-1"><Check className="w-3.5 h-3.5" /> Generación completa</p>
            <p>{result.exitosos} exitosos · {result.fallidos} fallidos · Total: {result.total}</p>
            <p className="text-emerald-300/70 mt-1">Revisa la cola de aprobación →</p>
          </div>
        )}

        <Button
          onClick={generar}
          disabled={generating || selected.size === 0 || redes.length === 0}
          className="w-full gap-2 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? `Generando ${totalEstimado} posts…` : `Generar ${totalEstimado} variantes`}
        </Button>
      </div>
    </div>
  );
}