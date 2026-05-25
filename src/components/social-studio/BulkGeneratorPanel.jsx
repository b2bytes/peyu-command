// ============================================================================
// BulkGeneratorPanel · v3 — selección de estilo visual + aspect ratio
// Paleta PEYU coherente (verde · arena · terracota) en lugar de pink/violet.
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, Loader2, Check, AlertCircle, Image as ImageIcon, Instagram, Linkedin, Facebook, Music2, Zap, Camera, Sun, Layers as LayersIcon, Building2, Leaf, Aperture } from 'lucide-react';

const REDES = [
  { id: 'Instagram', icon: Instagram, color: 'from-pink-500 to-rose-500' },
  { id: 'LinkedIn',  icon: Linkedin,  color: 'from-sky-600 to-blue-700' },
  { id: 'Facebook',  icon: Facebook,  color: 'from-blue-500 to-indigo-600' },
  { id: 'TikTok',    icon: Music2,    color: 'from-fuchsia-500 to-purple-600' },
];

const PILARES = ['Producto', 'Sostenibilidad/ESG', 'Educativo', 'Detrás de escena', 'Testimonios', 'Promoción', 'Branding', 'Comunidad'];

// Estilos visuales — coherentes con el backend (ESTILOS en functions)
const ESTILOS = [
  { id: 'lifestyle',   label: 'Lifestyle',    desc: 'Escena cotidiana cálida, luz natural', icon: Sun,        accent: 'from-amber-300 to-orange-400' },
  { id: 'editorial',   label: 'Editorial',    desc: 'Magazine premium, sombras esculturales', icon: Aperture,   accent: 'from-stone-300 to-stone-500' },
  { id: 'flat_lay',    label: 'Flat Lay',     desc: 'Vista cenital curada, Pinterest-ready', icon: LayersIcon, accent: 'from-rose-300 to-pink-400' },
  { id: 'studio',      label: 'Studio',       desc: 'Fondo limpio verde PEYU, premium', icon: Camera,     accent: 'from-emerald-400 to-teal-500' },
  { id: 'eco_natural', label: 'Eco Natural',  desc: 'Bosque, musgo, luz dorada Patagonia', icon: Leaf,       accent: 'from-green-400 to-emerald-600' },
  { id: 'corporate',   label: 'Corporativo',  desc: 'Escritorio ejecutivo, B2B premium', icon: Building2,  accent: 'from-slate-400 to-slate-600' },
];

const RATIOS = [
  { id: '1:1',  label: 'Cuadrado',  desc: 'IG · LI · FB', w: 32, h: 32 },
  { id: '4:5',  label: 'Vertical',  desc: 'IG feed optimizado', w: 26, h: 32 },
  { id: '9:16', label: 'Stories',   desc: 'Reels · TikTok', w: 18, h: 32 },
];

export default function BulkGeneratorPanel({ onGenerated }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [redes, setRedes] = useState(['Instagram', 'LinkedIn']);
  const [variantesPorRed, setVariantesPorRed] = useState(1);
  const [pilar, setPilar] = useState('Producto');
  const [temaExtra, setTemaExtra] = useState('');
  const [estilo, setEstilo] = useState('lifestyle');
  const [aspectRatio, setAspectRatio] = useState('auto'); // auto = el backend usa el ratio óptimo por red
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
  const estiloActivo = ESTILOS.find(e => e.id === estilo);

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
        estilo,
        aspect_ratio_override: aspectRatio === 'auto' ? null : aspectRatio,
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
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-4 h-full min-h-0">
      {/* ───────────────── Productos ───────────────── */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col min-h-0 overflow-hidden">
        <div className="p-3 border-b border-white/10 flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-poppins font-semibold text-white text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-300" />
              Productos disponibles
            </h3>
            <span className="text-xs text-white/50">
              <span className="text-emerald-300 font-bold">{selected.size}</span> de {filtered.length}
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
                      isSel ? 'border-emerald-400 ring-2 ring-emerald-400/30 scale-[0.97]' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="aspect-square bg-black/30">
                      <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    {isSel && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                    <div className="p-1.5 bg-black/70 backdrop-blur">
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

      {/* ───────────────── Configuración ───────────────── */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-4 overflow-y-auto peyu-scrollbar-light">
        <h3 className="font-poppins font-semibold text-white text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-300" />
          Configuración del lote
        </h3>

        {/* ─── Estilo visual — el cambio más impactante ─── */}
        <div>
          <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Camera className="w-3 h-3" /> Estilo visual de imagen
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {ESTILOS.map(e => {
              const Icon = e.icon;
              const active = estilo === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => setEstilo(e.id)}
                  className={`relative group text-left p-2 rounded-lg border transition-all overflow-hidden ${
                    active
                      ? 'border-emerald-400/60 bg-emerald-500/10 ring-1 ring-emerald-400/30'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20'
                  }`}
                >
                  {active && (
                    <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-br ${e.accent} opacity-20 blur-xl`} />
                  )}
                  <div className="relative flex items-start gap-1.5">
                    <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${e.accent} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] font-bold leading-tight ${active ? 'text-white' : 'text-white/85'}`}>{e.label}</p>
                      <p className="text-[9px] text-white/45 leading-tight mt-0.5">{e.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Aspect ratio ─── */}
        <div>
          <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-2 block">Formato</label>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => setAspectRatio('auto')}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] font-bold transition-all ${
                aspectRatio === 'auto'
                  ? 'border-emerald-400/60 bg-emerald-500/15 text-white'
                  : 'border-white/10 bg-white/[0.02] text-white/55 hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto
            </button>
            {RATIOS.map(r => {
              const active = aspectRatio === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setAspectRatio(r.id)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] font-bold transition-all ${
                    active
                      ? 'border-emerald-400/60 bg-emerald-500/15 text-white'
                      : 'border-white/10 bg-white/[0.02] text-white/55 hover:bg-white/5'
                  }`}
                  title={r.desc}
                >
                  <div
                    className={`bg-current opacity-60 rounded-sm`}
                    style={{ width: r.w / 3, height: r.h / 3 }}
                  />
                  {r.id}
                </button>
              );
            })}
          </div>
          {aspectRatio === 'auto' && (
            <p className="text-[9px] text-white/40 mt-1.5">IG → 4:5 · LI/FB → 1:1 · TikTok → 9:16</p>
          )}
        </div>

        {/* ─── Redes ─── */}
        <div>
          <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-2 block">Redes destino</label>
          <div className="grid grid-cols-2 gap-1.5">
            {REDES.map(r => {
              const Icon = r.icon;
              const active = redes.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggleRed(r.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    active
                      ? `bg-gradient-to-r ${r.color} text-white border-transparent shadow-md`
                      : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {r.id}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Variantes ─── */}
        <div>
          <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-2 block">Variantes por red</label>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                onClick={() => setVariantesPorRed(n)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  variantesPorRed === n
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-white/[0.02] border border-white/10 text-white/60 hover:bg-white/5'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Pilar + contexto ─── */}
        <div>
          <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-2 block">Pilar de contenido</label>
          <select
            value={pilar}
            onChange={e => setPilar(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            {PILARES.map(p => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-2 block">Contexto adicional (opcional)</label>
          <Input
            value={temaExtra}
            onChange={e => setTemaExtra(e.target.value)}
            placeholder="Ej: Cyber Day, Día de la Madre…"
            className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/40 text-sm"
          />
        </div>

        {/* ─── Resumen ─── */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-400/30 rounded-lg p-3 text-xs text-emerald-100 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Vista previa del lote
          </p>
          <p>Estilo: <strong className="text-white">{estiloActivo?.label}</strong></p>
          <p>Total: <strong className="text-white">{totalEstimado} posts</strong> · ≈ {Math.ceil(totalEstimado * 8)}s</p>
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
          className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? `Generando ${totalEstimado} posts…` : `Generar ${totalEstimado} variantes`}
        </Button>
      </div>
    </div>
  );
}