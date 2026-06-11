import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Upload, Loader2, Trash2, Copy, Check, Sparkles, Image as ImageIcon,
  Film, FolderOpen, ExternalLink,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// MediaGalleryPanel — Galería de medios de Social Studio (ContentAsset).
// Guarda y muestra fotos/videos generados por el agente IA o subidos por
// el equipo. Filtros por tipo y origen, subida múltiple, copiar URL, borrar.
// ════════════════════════════════════════════════════════════════════════

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'imagenes', label: 'Imágenes' },
  { id: 'videos', label: 'Videos' },
  { id: 'ia', label: '✨ Generados IA' },
  { id: 'subidos', label: '📁 Subidos' },
];

function AssetCard({ asset, onDelete }) {
  const [copied, setCopied] = useState(false);
  const esVideo = asset.tipo === 'Video';

  const copiar = () => {
    navigator.clipboard.writeText(asset.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] hover:border-white/25 transition-all">
      {/* Media */}
      <div className="aspect-square bg-black/30">
        {esVideo ? (
          <video src={asset.url} className="w-full h-full object-cover" muted loop playsInline
            onMouseEnter={(e) => e.target.play().catch(() => {})}
            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
          />
        ) : (
          <img src={asset.thumbnail_url || asset.url} alt={asset.nombre} loading="lazy" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Badges */}
      <div className="absolute top-2 left-2 flex gap-1">
        <span className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${
          asset.generado_por_ia
            ? 'bg-violet-500/40 text-violet-100 border border-violet-400/40'
            : 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/30'
        }`}>
          {asset.generado_por_ia ? <Sparkles className="w-2.5 h-2.5" /> : <Upload className="w-2.5 h-2.5" />}
          {asset.generado_por_ia ? 'IA' : 'Subido'}
        </span>
        {esVideo && (
          <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-md border border-white/20">
            <Film className="w-2.5 h-2.5" /> Video
          </span>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={copiar} title="Copiar URL"
          className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <a href={asset.url} target="_blank" rel="noopener noreferrer" title="Abrir"
          className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={() => onDelete(asset)} title="Eliminar"
          className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-red-400">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Footer */}
      <div className="px-2.5 py-2">
        <p className="text-[11px] font-semibold text-white/85 truncate">{asset.nombre}</p>
        <p className="text-[9px] text-white/35 truncate mt-0.5">
          {asset.producto_sku ? `SKU ${asset.producto_sku} · ` : ''}
          {new Date(asset.created_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
        </p>
      </div>
    </div>
  );
}

export default function MediaGalleryPanel() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filtro, setFiltro] = useState('todos');
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    const rows = await base44.entities.ContentAsset.list('-created_date', 300).catch(() => []);
    setAssets((rows || []).filter((a) => ['Imagen', 'Video', 'GIF'].includes(a.tipo) && a.url));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const subir = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.ContentAsset.create({
        nombre: file.name.replace(/\.[^.]+$/, ''),
        tipo: file.type.startsWith('video') ? 'Video' : 'Imagen',
        url: file_url,
        generado_por_ia: false,
        notas: 'Subido manualmente desde la Galería de Social Studio',
      });
    }
    setUploading(false);
    load();
  };

  const eliminar = async (asset) => {
    if (!confirm(`¿Eliminar "${asset.nombre}" de la galería?`)) return;
    await base44.entities.ContentAsset.delete(asset.id);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
  };

  const filtrados = assets.filter((a) => {
    if (filtro === 'imagenes') return a.tipo !== 'Video';
    if (filtro === 'videos') return a.tipo === 'Video';
    if (filtro === 'ia') return a.generado_por_ia;
    if (filtro === 'subidos') return !a.generado_por_ia;
    return true;
  });

  return (
    <div className="h-full flex flex-col min-h-0 bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-gradient-to-r from-emerald-900/20 to-cyan-900/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <FolderOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Galería de medios</p>
            <p className="text-[10px] text-white/40 mt-0.5">{assets.length} assets · generados por el agente o subidos por ti</p>
          </div>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? 'Subiendo…' : 'Subir fotos/videos'}
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden"
          onChange={(e) => { subir(e.target.files); e.target.value = ''; }} />
      </div>

      {/* Filtros */}
      <div className="flex-shrink-0 flex gap-1.5 px-4 py-2.5 border-b border-white/[0.06] overflow-x-auto scrollbar-hide">
        {FILTROS.map((f) => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
              filtro === f.id
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-white/[0.03] text-white/45 border-white/10 hover:text-white/80'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light min-h-0 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full gap-2 text-white/30">
            <Loader2 className="w-4 h-4 animate-spin" /> <span className="text-sm">Cargando galería…</span>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-white/30">
            <ImageIcon className="w-10 h-10" />
            <p className="text-sm font-semibold text-white/50">Galería vacía</p>
            <p className="text-xs max-w-xs">Sube fotos/videos con el botón de arriba, o pídele al agente que genere contenido — todo queda guardado aquí automáticamente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtrados.map((a) => <AssetCard key={a.id} asset={a} onDelete={eliminar} />)}
          </div>
        )}
      </div>
    </div>
  );
}