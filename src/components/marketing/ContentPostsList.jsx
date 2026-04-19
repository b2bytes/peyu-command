import { Calendar, Heart, MessageCircle, Share2 } from 'lucide-react';

const REDES_ICONS = {
  'Instagram': '📸', 'Facebook': '👍', 'LinkedIn': '💼', 'TikTok': '🎵',
  'Twitter/X': '🐦', 'YouTube': '▶️', 'Pinterest': '📌', 'Threads': '🧵',
};

const ESTADO_COLORS = {
  'Borrador': 'bg-gray-100 text-gray-700',
  'En revisión': 'bg-yellow-100 text-yellow-700',
  'Aprobado': 'bg-blue-100 text-blue-700',
  'Programado': 'bg-purple-100 text-purple-700',
  'Publicado': 'bg-green-100 text-green-700',
  'Pausado': 'bg-orange-100 text-orange-700',
  'Archivado': 'bg-gray-100 text-gray-500',
};

export default function ContentPostsList({ posts }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">Aún no hay posts creados.</p>
        <p className="text-xs mt-1">Pide al Director IA que genere contenido para ti.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((p) => (
        <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">{REDES_ICONS[p.red_social] || '📱'}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-gray-900 truncate">{p.titulo}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[p.estado] || 'bg-gray-100'}`}>
                  {p.estado}
                </span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-3 flex-wrap">
                <span>{p.red_social} · {p.tipo_post}</span>
                {p.fecha_publicacion && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(p.fecha_publicacion).toLocaleDateString('es-CL')}
                  </span>
                )}
                {p.pillar_contenido && <span>· {p.pillar_contenido}</span>}
              </div>
              {p.copy && (
                <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{p.copy}</p>
              )}
              {p.estado === 'Publicado' && (
                <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {p.likes || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {p.comentarios || 0}</span>
                  <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {p.shares || 0}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}