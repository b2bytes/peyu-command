import { ExternalLink, Star, AlertTriangle, CheckCircle2 } from 'lucide-react';

const TIPO_COLORS = {
  'Prensa / Medio': 'bg-amber-100 text-amber-800 border-amber-200',
  'Sitio Propio': 'bg-teal-100 text-teal-800 border-teal-200',
  'Instagram': 'bg-pink-100 text-pink-800 border-pink-200',
  'TikTok': 'bg-slate-900 text-white border-slate-900',
  'Facebook': 'bg-blue-100 text-blue-800 border-blue-200',
  'YouTube': 'bg-red-100 text-red-800 border-red-200',
  'LinkedIn': 'bg-sky-100 text-sky-800 border-sky-200',
  'Directorio': 'bg-purple-100 text-purple-800 border-purple-200',
  'Blog': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Mención': 'bg-gray-100 text-gray-700 border-gray-200',
  'Otro': 'bg-gray-100 text-gray-700 border-gray-200',
};

const AUTORIDAD_ICON = {
  'Alta (Emol, T13, BioBio, gov)': { icon: Star, color: 'text-amber-500', label: 'Alta' },
  'Media (Blogs, Medios nicho)': { icon: Star, color: 'text-teal-500', label: 'Media' },
  'Baja (Redes, foros)': { icon: Star, color: 'text-gray-400', label: 'Baja' },
  'Sin clasificar': { icon: AlertTriangle, color: 'text-gray-300', label: '—' },
};

export default function BacklinkCard({ item }) {
  const aut = AUTORIDAD_ICON[item.autoridad] || AUTORIDAD_ICON['Sin clasificar'];
  const Icon = aut.icon;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TIPO_COLORS[item.tipo] || TIPO_COLORS['Otro']}`}>
          {item.tipo}
        </span>
        <div className="flex items-center gap-1 text-xs">
          <Icon className={`w-3.5 h-3.5 ${aut.color}`} />
          <span className="text-gray-500">{aut.label}</span>
        </div>
      </div>

      <h3 className="font-poppins font-semibold text-sm text-gray-900 leading-snug line-clamp-2 mb-1.5">
        {item.titulo || item.url}
      </h3>

      {item.extracto && (
        <p className="text-xs text-gray-500 line-clamp-3 mb-2 leading-relaxed">{item.extracto}</p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500">
        <span className="font-mono truncate max-w-[60%]">{item.dominio}</span>
        <div className="flex items-center gap-2">
          {item.dofollow && <CheckCircle2 className="w-3 h-3 text-teal-500" title="Dofollow" />}
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 flex items-center gap-1 font-semibold">
            Abrir <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}