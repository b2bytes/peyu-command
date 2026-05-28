// ============================================================================
// CreatorGallery · Galería de assets IA generados (ContentAsset)
// ============================================================================
import { useState } from 'react';
import { Copy, Check, Download, Trash2, Image as ImageIcon, Video, ExternalLink } from 'lucide-react';

export default function CreatorGallery({ assets, onDelete }) {
  const [copiedId, setCopiedId] = useState(null);
  const [filter, setFilter] = useState('all'); // all | image | video

  const filtered = assets.filter(a => {
    if (filter === 'image') return a.tipo === 'Imagen';
    if (filter === 'video') return a.tipo === 'Video';
    return true;
  });

  const copyUrl = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (assets.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-white/20" />
        </div>
        <p className="text-sm text-white/40 font-medium">Sin assets generados aún</p>
        <p className="text-[11px] text-white/25 mt-1">Las imágenes y videos que generes aparecerán aquí</p>
      </div>
    );
  }

  const imgCount = assets.filter(a => a.tipo === 'Imagen').length;
  const vidCount = assets.filter(a => a.tipo === 'Video').length;

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex items-center gap-1.5">
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')} label={`Todo (${assets.length})`} />
        <FilterPill active={filter === 'image'} onClick={() => setFilter('image')} label={`Imágenes (${imgCount})`} icon={ImageIcon} />
        <FilterPill active={filter === 'video'} onClick={() => setFilter('video')} label={`Videos (${vidCount})`} icon={Video} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {filtered.map(asset => (
          <div key={asset.id} className="group relative rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-white/20 transition-all">
            {/* Thumbnail */}
            <div className="aspect-square relative bg-black/30">
              {asset.tipo === 'Video' ? (
                <video src={asset.url} className="w-full h-full object-cover" muted preload="metadata" />
              ) : (
                <img src={asset.url} alt={asset.nombre} className="w-full h-full object-cover" loading="lazy" />
              )}
              {/* Type badge */}
              <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                asset.tipo === 'Video' ? 'bg-cyan-500/80 text-white' : 'bg-pink-500/80 text-white'
              }`}>
                {asset.tipo === 'Video' ? '▶ Video' : '📷 Img'}
              </span>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <button
                  onClick={() => copyUrl(asset.id, asset.url)}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  title="Copiar URL"
                >
                  {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                </button>
                <a
                  href={asset.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  title="Descargar"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                </a>
                <button
                  onClick={() => onDelete?.(asset.id)}
                  className="w-8 h-8 rounded-lg bg-red-500/30 hover:bg-red-500/50 flex items-center justify-center transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-300" />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="px-2 py-1.5">
              <p className="text-[10px] text-white/70 font-medium truncate">{asset.nombre}</p>
              <p className="text-[9px] text-white/30 truncate">{asset.categoria || 'Sin categoría'} · {new Date(asset.created_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, label, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
        active ? 'bg-white/10 text-white border border-white/20' : 'text-white/40 hover:text-white/60 border border-transparent'
      }`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </button>
  );
}