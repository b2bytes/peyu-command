import { useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

export default function MockupGallery({ mockups }) {
  const [selected, setSelected] = useState(null);

  if (!mockups || mockups.length === 0) {
    return (
      <div className="bg-white/5 border border-white/15 rounded-2xl p-8 text-center backdrop-blur-sm">
        <Sparkles className="w-8 h-8 text-white/30 mx-auto mb-2" />
        <p className="text-white/60 text-sm">Aún no has generado mockups con tu logo.</p>
        <p className="text-white/40 text-xs mt-1">Se crean automáticamente al cotizar con personalización.</p>
      </div>
    );
  }

  // Deduplicar por URL
  const unique = Array.from(new Map(mockups.map(m => [m.url, m])).values());

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {unique.map((m, i) => (
          <button key={i} onClick={() => setSelected(m)}
            className="relative group aspect-square rounded-xl overflow-hidden border border-white/15 hover:border-teal-400/60 transition-all">
            <img src={m.url} alt={`Mockup ${m.ref}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <p className="text-[10px] text-white font-semibold truncate">{m.ref}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={e => e.stopPropagation()} className="max-w-2xl w-full">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-white font-bold text-sm">{selected.ref}</p>
                {selected.date && <p className="text-white/50 text-xs">{selected.date.slice(0, 10)}</p>}
              </div>
              <div className="flex gap-2">
                <a href={selected.url} download target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                  <Download className="w-4 h-4" />
                </a>
                <button onClick={() => setSelected(null)}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <img src={selected.url} alt="Mockup" className="w-full rounded-2xl border border-white/20" />
          </div>
        </div>
      )}
    </>
  );
}