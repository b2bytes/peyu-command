import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  X, Sparkles, Loader2, Image as ImageIcon, Film, Instagram, Linkedin,
  Search, CheckCircle2, AlertCircle,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// GalleryGeneratorModal — Genera imagen o video IA directo desde la Galería.
// Remezcla la ESCENA (fondo, luz, ambiente) manteniendo el producto PEYU
// EXACTO a sus fotos reales. Presets por red (Instagram / LinkedIn).
// Usa agentGenerateMedia → guarda en ContentAsset + ContentPost Borrador.
// ════════════════════════════════════════════════════════════════════════

const ESTILOS_REMIX = [
  { id: 'original', label: '✨ Original limpio', efecto: 'Fondo minimalista crema/tierra, luz de estudio suave, producto protagonista absoluto, estética premium e-commerce' },
  { id: 'lifestyle', label: '🌿 Lifestyle', efecto: 'Escena lifestyle cálida: escritorio de madera, luz natural de mañana, taza de café cerca, plantas desenfocadas de fondo' },
  { id: 'editorial', label: '📰 Editorial', efecto: 'Editorial de revista premium: fondo arquitectónico limpio, juego de sombras escultural, iluminación dramática suave' },
  { id: 'eco', label: '🍃 Eco natural', efecto: 'Escena natural exterior: musgo, piedras de río o madera envejecida, luz dorada de bosque, vibra Patagonia chilena' },
  { id: 'corporativo', label: '💼 Corporativo', efecto: 'Escritorio ejecutivo moderno: madera nogal, laptop desenfocado, libreta de cuero, contexto B2B premium' },
];

const FORMATOS_POR_RED = {
  Instagram: [
    { id: 'cuadrado', label: 'Feed 1:1' },
    { id: 'historia', label: 'Story/Reel 9:16' },
  ],
  LinkedIn: [
    { id: 'cuadrado', label: 'Post 1:1' },
    { id: 'horizontal', label: 'Banner 16:9' },
  ],
};

export default function GalleryGeneratorModal({ onClose, onGenerated }) {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [prod, setProd] = useState(null);
  const [tipo, setTipo] = useState('imagen');
  const [red, setRed] = useState('Instagram');
  const [formato, setFormato] = useState('cuadrado');
  const [estilo, setEstilo] = useState(ESTILOS_REMIX[0]);
  const [efectoLibre, setEfectoLibre] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true }, '-updated_date', 300)
      .then((rows) => setProductos((rows || []).filter((p) => p.imagen_url)))
      .catch(() => {});
  }, []);

  // Video en LinkedIn → horizontal; en Instagram → historia (reel)
  useEffect(() => {
    if (tipo === 'video') setFormato(red === 'LinkedIn' ? 'horizontal' : 'historia');
    else setFormato('cuadrado');
  }, [tipo, red]);

  const filtrados = productos.filter((p) =>
    !busqueda || p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || p.sku?.toLowerCase().includes(busqueda.toLowerCase())
  ).slice(0, 30);

  const generar = async () => {
    if (!prod) return setError('Elige un producto del catálogo');
    setGenerating(true);
    setError('');
    setResult(null);
    try {
      const res = await base44.functions.invoke('agentGenerateMedia', {
        tipo,
        sku: prod.sku,
        efecto: efectoLibre.trim() ? `${estilo.efecto}. Además: ${efectoLibre.trim()}` : estilo.efecto,
        formato,
        red_social: red,
        duracion: 6,
      });
      if (!res.data?.ok) throw new Error(res.data?.error || 'Error al generar');
      setResult(res.data);
      onGenerated?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto peyu-scrollbar-light rounded-2xl border border-white/15 bg-slate-950/95 backdrop-blur-xl shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Generar con IA</p>
              <p className="text-[10px] text-white/40 mt-0.5">El producto real es sagrado — solo se remezcla la escena</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 1 · Producto */}
          <div>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">1 · Producto (fotos reales como referencia)</p>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o SKU…"
                className="w-full bg-white/5 border border-white/15 text-white placeholder:text-white/25 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto peyu-scrollbar-light">
              {filtrados.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProd(p)}
                  title={p.nombre}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                    prod?.id === p.id ? 'border-violet-500 shadow-lg shadow-violet-500/30' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img src={p.imagen_url} alt={p.nombre} loading="lazy" className="w-full aspect-square object-cover" />
                  {prod?.id === p.id && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            {prod && <p className="text-[11px] text-violet-300 mt-1.5 font-semibold truncate">→ {prod.nombre}</p>}
          </div>

          {/* 2 · Tipo + Red */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">2 · Tipo</p>
              <div className="flex gap-1.5">
                {[{ id: 'imagen', label: 'Imagen', Icon: ImageIcon }, { id: 'video', label: 'Video', Icon: Film }].map(({ id, label, Icon }) => (
                  <button key={id} onClick={() => setTipo(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      tipo === id ? 'bg-violet-500/30 border-violet-400/50 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
                    }`}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">3 · Red social</p>
              <div className="flex gap-1.5">
                {[{ id: 'Instagram', Icon: Instagram, grad: 'from-pink-500 to-orange-500' }, { id: 'LinkedIn', Icon: Linkedin, grad: 'from-sky-500 to-blue-600' }].map(({ id, Icon, grad }) => (
                  <button key={id} onClick={() => setRed(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      red === id ? `bg-gradient-to-r ${grad} border-transparent text-white shadow-md` : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
                    }`}>
                    <Icon className="w-3.5 h-3.5" /> {id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4 · Formato */}
          <div>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">4 · Formato</p>
            <div className="flex gap-1.5 flex-wrap">
              {(tipo === 'video'
                ? [{ id: red === 'LinkedIn' ? 'horizontal' : 'historia', label: red === 'LinkedIn' ? 'Video 16:9' : 'Reel 9:16' }]
                : FORMATOS_POR_RED[red]
              ).map((f) => (
                <button key={f.id} onClick={() => setFormato(f.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                    formato === f.id ? 'bg-white/15 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5 · Estilo remix */}
          <div>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">5 · Estilo de escena (el producto nunca cambia)</p>
            <div className="flex gap-1.5 flex-wrap">
              {ESTILOS_REMIX.map((e) => (
                <button key={e.id} onClick={() => setEstilo(e)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                    estilo.id === e.id ? 'bg-violet-500/30 border-violet-400/50 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
                  }`}>
                  {e.label}
                </button>
              ))}
            </div>
            <textarea
              value={efectoLibre}
              onChange={(e) => setEfectoLibre(e.target.value)}
              placeholder="Detalle extra opcional: ej. 'atardecer dorado en la playa', 'navidad cálida'…"
              rows={2}
              className="mt-2 w-full bg-white/5 border border-white/15 text-white placeholder:text-white/25 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          {/* Errores / resultado */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-400/30 rounded-xl p-3 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {result && (
            <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-3 space-y-2">
              <p className="text-xs text-emerald-200 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> {result.message}
              </p>
              {result.tipo === 'video'
                ? <video src={result.url} controls className="w-full max-h-64 rounded-lg" />
                : <img src={result.url} alt="Resultado" className="w-full max-h-64 object-contain rounded-lg" />}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={generar}
            disabled={generating || !prod}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-600 hover:from-violet-400 hover:to-pink-500 text-white text-sm font-bold transition-all shadow-lg shadow-violet-500/25 disabled:opacity-40"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating
              ? (tipo === 'video' ? 'Generando video (~1 min)…' : 'Generando imagen…')
              : `Generar ${tipo} para ${red}`}
          </button>
        </div>
      </div>
    </div>
  );
}