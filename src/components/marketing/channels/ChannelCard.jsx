import { Check, ExternalLink, Lock, Sparkles, AlertCircle, BookOpen, Zap, ShieldCheck } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const cfg = {
    ready: { bg: 'bg-green-100', text: 'text-green-700', label: '● Nativo Base44' },
    custom: { bg: 'bg-amber-100', text: 'text-amber-700', label: '⚙ OAuth custom' },
    soon: { bg: 'bg-gray-100', text: 'text-gray-600', label: '○ Próximamente' },
    connected: { bg: 'bg-emerald-500', text: 'text-white', label: '✓ Conectado' },
  }[status];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

export default function ChannelCard({ ch, status, isConnected, onAction }) {
  const effectiveStatus = isConnected ? 'connected' : status;

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all flex flex-col ${
        isConnected
          ? 'border-emerald-300 bg-emerald-50/50'
          : status === 'ready'
          ? 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-md'
          : status === 'custom'
          ? 'border-amber-100 bg-amber-50/30 hover:border-amber-300'
          : 'border-dashed border-gray-200 bg-gray-50/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ch.color || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-xl shadow-sm flex-shrink-0`}
        >
          {ch.icon}
        </div>
        <StatusBadge status={effectiveStatus} />
      </div>

      {/* Title */}
      <div className="font-poppins font-bold text-sm text-gray-900 leading-tight">{ch.name}</div>
      {ch.subtitle && <div className="text-[11px] text-gray-500 mb-2">{ch.subtitle}</div>}

      {/* Capabilities */}
      {ch.caps && (
        <div className="flex flex-wrap gap-1 mb-3 mt-1">
          {ch.caps.slice(0, 4).map((c, i) => (
            <span key={i} className="text-[9px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full leading-relaxed">
              {c}
            </span>
          ))}
          {ch.caps.length > 4 && (
            <span className="text-[9px] text-gray-400 leading-relaxed">+{ch.caps.length - 4}</span>
          )}
        </div>
      )}

      {/* Scopes / info técnica */}
      {ch.scopesLabel && (
        <div className="flex items-start gap-1 text-[10px] text-gray-500 mb-2 font-mono bg-gray-50 rounded px-1.5 py-1">
          <ShieldCheck className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
          <span className="truncate">{ch.scopesLabel}</span>
        </div>
      )}

      {/* Webhook badge */}
      {ch.webhooks && (
        <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 rounded-md px-2 py-1 mb-2 border border-emerald-100">
          <Zap className="w-3 h-3" />
          <span>Webhooks en tiempo real</span>
        </div>
      )}

      {/* Warning */}
      {ch.warning && (
        <div className="flex items-start gap-1 text-[10px] text-amber-700 mb-2 bg-amber-50 rounded-md px-2 py-1 border border-amber-100">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span className="leading-snug">{ch.warning}</span>
        </div>
      )}

      {/* Note (roadmap) */}
      {ch.note && (
        <div className="flex items-start gap-1 text-[10px] text-gray-500 mb-2">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{ch.note}</span>
        </div>
      )}

      {/* Setup time */}
      {ch.setupTime && (
        <div className="text-[10px] text-amber-800 bg-amber-100/60 rounded-md px-2 py-1 mb-2">
          ⏱ Setup estimado: <strong>{ch.setupTime}</strong>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-1.5 pt-2">
        {status === 'ready' && (
          <button
            onClick={() => onAction('authorize', ch)}
            disabled={isConnected}
            className={`w-full text-xs font-semibold rounded-lg px-3 py-2 flex items-center justify-center gap-1.5 transition-colors ${
              isConnected
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-gray-900 text-white hover:bg-gray-700'
            }`}
          >
            {isConnected ? (
              <>
                <Check className="w-3.5 h-3.5" /> Conectado · gestionar
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Autorizar con Base44
              </>
            )}
          </button>
        )}
        {status === 'custom' && (
          <button
            onClick={() => onAction('setup', ch)}
            className="w-full text-xs font-semibold rounded-lg px-3 py-2 flex items-center justify-center gap-1.5 bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" /> Guía paso a paso
          </button>
        )}
        {status === 'soon' && (
          <div className="w-full text-xs font-semibold rounded-lg px-3 py-2 flex items-center justify-center gap-1.5 bg-gray-200 text-gray-500 cursor-not-allowed">
            En roadmap
          </div>
        )}

        {ch.docs && (
          <a
            href={ch.docs}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1 transition-colors"
          >
            <BookOpen className="w-3 h-3" /> API oficial <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}