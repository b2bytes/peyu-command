import { CANAL_AVATAR_BG, CANAL_AVATAR_FG, CANAL_STYLES } from './styles';

export default function ConvRow({ item, isSelected, onClick }) {
  const canalStyle = CANAL_STYLES[item.channel] || CANAL_STYLES.web;
  const badge = item.channel === 'gmail' && item.asunto ? item.asunto : item.channelLabel;

  const tipoBadge = item.tipo === 'B2B'
    ? 'bg-blue-500/15 text-blue-400'
    : item.tipo === 'B2C'
      ? 'bg-amber-500/15 text-amber-400'
      : 'bg-slate-500/15 text-slate-400';

  const dateStr = item.ultimoAt
    ? new Date(item.ultimoAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl p-3 transition-all duration-150 ${
        isSelected
          ? 'bg-slate-800/80 ring-1 ring-emerald-500/40'
          : 'hover:bg-slate-800/40'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0"
          style={{ background: CANAL_AVATAR_BG[item.channel] || '#0F8B6C20', color: CANAL_AVATAR_FG[item.channel] || '#3dd9b0' }}
        >
          {(item.nombre || '?')[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-semibold text-slate-100 truncate">
              {item.nombre || 'Sin nombre'}
            </span>
            {item.empresa && (
              <span className="text-[10px] text-slate-400 truncate">· {item.empresa}</span>
            )}
            {item.score > 0 && (
              <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                {item.score}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate leading-relaxed">
            {item.ultimoMensaje || 'Sin mensajes'}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${canalStyle}`}>
              {badge}
            </span>
            {item.tipo !== 'Sin clasificar' && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${tipoBadge}`}>
                {item.tipo}
              </span>
            )}
            <span className="text-[9px] text-slate-500 ml-auto flex-shrink-0">{dateStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}