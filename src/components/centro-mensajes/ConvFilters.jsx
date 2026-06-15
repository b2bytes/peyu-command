import {
  Search, Globe, MessageSquare, Phone, Mail, Instagram, Linkedin
} from 'lucide-react';

const ICON_MAP = { Globe, MessageSquare, Phone, Mail, Instagram, Linkedin };

const CHANNELS = [
  { key: 'todos',      label: 'Todos',       icon: 'Globe' },
  { key: 'web',        label: 'Web',         icon: 'MessageSquare' },
  { key: 'whatsapp',   label: 'WhatsApp',    icon: 'Phone' },
  { key: 'gmail',      label: 'Gmail',       icon: 'Mail' },
  { key: 'instagram',  label: 'Instagram',   icon: 'Instagram' },
  { key: 'linkedin',   label: 'LinkedIn',    icon: 'Linkedin' },
];

const TIPO_FILTERS = ['Todos', 'B2B', 'B2C', 'Sin clasificar'];
const ESTADO_FILTERS = ['Todos', 'Activo', 'Calificado', 'Convertido', 'Abandonado', 'Descartado'];

export default function ConvFilters({ channel, setChannel, search, setSearch, tipo, setTipo, estado, setEstado, loadingGM }) {
  return (
    <div className="flex-shrink-0 px-3 py-3 space-y-2.5 border-b border-slate-700/50">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          placeholder="Buscar conversaciones…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
        />
      </div>

      {/* Channels */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {CHANNELS.map(ch => {
          const Icon = ICON_MAP[ch.icon];
          const active = channel === ch.key;
          return (
            <button
              key={ch.key}
              onClick={() => setChannel(ch.key)}
              className={`flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{ch.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tipo */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {TIPO_FILTERS.map(t => (
          <button
            key={t}
            onClick={() => setTipo(t)}
            className={`flex-shrink-0 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
              tipo === t ? 'bg-emerald-600 text-white' : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200'
            }`}
          >{t}</button>
        ))}
      </div>

      {/* Estado */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {ESTADO_FILTERS.map(e => (
          <button
            key={e}
            onClick={() => setEstado(e)}
            className={`flex-shrink-0 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
              estado === e ? 'bg-amber-600 text-white' : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200'
            }`}
          >{e}</button>
        ))}
      </div>

      {loadingGM && (
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <div className="w-3 h-3 border-2 border-slate-600 border-t-emerald-400 rounded-full animate-spin" />
          Sincronizando Gmail…
        </div>
      )}
    </div>
  );
}