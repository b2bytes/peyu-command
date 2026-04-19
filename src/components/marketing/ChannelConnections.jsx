import { Check, ExternalLink, Lock, Sparkles, AlertCircle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Catálogo de canales estructurado por disponibilidad real en Base44.
 * - READY: shared connectors nativos (OAuth 1-clic cuando el builder lo autoriza).
 * - CUSTOM: requieren credenciales propias del builder (OAuth app custom).
 * - SOON: en roadmap, aún no soportados.
 */
const CHANNELS = {
  ready: [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      subtitle: 'Company Page + Ads',
      icon: '💼',
      color: 'from-blue-600 to-blue-800',
      caps: ['Publicar posts', 'Sponsored Content', 'Lead Gen', 'Analytics', 'Campaign Manager'],
      docs: 'https://learn.microsoft.com/en-us/linkedin/marketing/',
      scopes: 'w_organization_social, r_ads, rw_ads',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      subtitle: 'Business Account',
      icon: '🎵',
      color: 'from-gray-900 via-pink-500 to-cyan-400',
      caps: ['Leer métricas', 'Stats de videos', 'Info de perfil'],
      docs: 'https://developers.tiktok.com/doc/login-kit-web',
      scopes: 'user.info.stats, video.list',
      note: 'Solo lectura. Publicación requiere TikTok Content API (no disponible aún).',
    },
    {
      id: 'google_analytics',
      name: 'Google Analytics 4',
      subtitle: 'peyuchile.cl',
      icon: '📊',
      color: 'from-orange-500 to-yellow-500',
      caps: ['Tráfico', 'Conversiones', 'Atribución', 'Audiencias', 'Revenue'],
      docs: 'https://developers.google.com/analytics/devguides/reporting/data/v1',
      scopes: 'analytics.readonly',
    },
    {
      id: 'gmail',
      name: 'Gmail',
      subtitle: 'ventas@peyuchile.cl',
      icon: '✉️',
      color: 'from-red-500 to-red-700',
      caps: ['Envío newsletters', 'Emails de campaña', 'Respuestas automáticas'],
      docs: 'https://developers.google.com/gmail/api',
      scopes: 'gmail.send, gmail.readonly',
    },
    {
      id: 'googledrive',
      name: 'Google Drive',
      subtitle: 'Creatividades',
      icon: '📁',
      color: 'from-green-500 to-blue-500',
      caps: ['Guardar assets', 'Compartir briefs', 'Plantillas'],
      docs: 'https://developers.google.com/drive/api/v3/reference',
      scopes: 'drive.file',
    },
  ],
  custom: [
    {
      id: 'meta',
      name: 'Meta Business',
      subtitle: 'Instagram + Facebook + Ads',
      icon: '📸',
      color: 'from-pink-500 via-purple-500 to-blue-600',
      caps: ['IG Posts', 'Reels', 'Stories', 'FB Ads', 'Catálogo', 'Messenger'],
      docs: 'https://developers.facebook.com/docs/instagram-api',
      setup: 'Crear app en Meta for Developers → agregar producto "Instagram Graph API" + "Marketing API" → copiar App ID y App Secret',
      dashUrl: 'https://developers.facebook.com/apps/',
    },
    {
      id: 'google_ads',
      name: 'Google Ads',
      subtitle: 'Search · PMax · Shopping',
      icon: '🎯',
      color: 'from-blue-500 to-green-500',
      caps: ['Search Ads', 'Performance Max', 'Shopping', 'Display', 'Keywords'],
      docs: 'https://developers.google.com/google-ads/api/docs/start',
      setup: 'Solicitar developer token en Google Ads → crear OAuth client en Google Cloud Console → esperar aprobación (1-3 días)',
      dashUrl: 'https://ads.google.com/aw/apicenter',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      subtitle: 'Canal PEYU',
      icon: '▶️',
      color: 'from-red-500 to-red-700',
      caps: ['Upload videos', 'Shorts', 'Analytics', 'Comentarios', 'Playlists'],
      docs: 'https://developers.google.com/youtube/v3',
      setup: 'Habilitar YouTube Data API v3 en Google Cloud Console → crear OAuth credentials',
      dashUrl: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
    },
    {
      id: 'pinterest',
      name: 'Pinterest Business',
      subtitle: 'Pins + Shopping Ads',
      icon: '📌',
      color: 'from-red-500 to-pink-600',
      caps: ['Publicar Pins', 'Boards', 'Shopping Ads', 'Analytics'],
      docs: 'https://developers.pinterest.com/docs/api/v5/',
      setup: 'Crear app en Pinterest Developer Portal → activar Content API + Ads API',
      dashUrl: 'https://developers.pinterest.com/apps/',
    },
  ],
  soon: [
    { id: 'threads', name: 'Threads', icon: '🧵', note: 'API aún limitada' },
    { id: 'twitter', name: 'X / Twitter', icon: '𝕏', note: 'API v2 de pago' },
    { id: 'whatsapp_cloud', name: 'WhatsApp Business API', icon: '💬', note: 'Meta Cloud API — requiere verificación' },
  ],
};

// =================== UI ===================

const StatusBadge = ({ status }) => {
  const cfg = {
    ready: { bg: 'bg-green-100', text: 'text-green-700', label: '● Nativo Base44' },
    custom: { bg: 'bg-amber-100', text: 'text-amber-700', label: '⚙ OAuth personalizado' },
    soon: { bg: 'bg-gray-100', text: 'text-gray-600', label: '○ Próximamente' },
    connected: { bg: 'bg-emerald-500', text: 'text-white', label: '✓ Conectado' },
  }[status];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

const ChannelCard = ({ ch, status, isConnected, onAction }) => {
  const effectiveStatus = isConnected ? 'connected' : status;
  return (
    <div className={`rounded-xl border-2 p-4 transition-all flex flex-col ${
      isConnected ? 'border-emerald-300 bg-emerald-50/50' :
      status === 'ready' ? 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-md' :
      status === 'custom' ? 'border-amber-100 bg-amber-50/30 hover:border-amber-300' :
      'border-dashed border-gray-200 bg-gray-50/50'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ch.color || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-xl shadow-sm`}>
          {ch.icon}
        </div>
        <StatusBadge status={effectiveStatus} />
      </div>

      <div className="font-poppins font-bold text-sm text-gray-900 leading-tight">{ch.name}</div>
      {ch.subtitle && <div className="text-[11px] text-gray-500 mb-2">{ch.subtitle}</div>}

      {ch.caps && (
        <div className="flex flex-wrap gap-1 mb-3 mt-1">
          {ch.caps.slice(0, 3).map((c, i) => (
            <span key={i} className="text-[9px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full">{c}</span>
          ))}
          {ch.caps.length > 3 && <span className="text-[9px] text-gray-400">+{ch.caps.length - 3}</span>}
        </div>
      )}

      {ch.note && (
        <div className="flex items-start gap-1 text-[10px] text-gray-500 mb-2">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{ch.note}</span>
        </div>
      )}

      {ch.setup && (
        <div className="text-[10px] text-amber-800 bg-amber-100/60 rounded-md p-2 mb-3 leading-snug">
          <strong>Setup:</strong> {ch.setup}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-1.5">
        {status === 'ready' && (
          <button
            onClick={() => onAction('authorize', ch)}
            disabled={isConnected}
            className={`w-full text-xs font-semibold rounded-lg px-3 py-2 flex items-center justify-center gap-1.5 transition-colors ${
              isConnected ? 'bg-emerald-600 text-white cursor-default' : 'bg-gray-900 text-white hover:bg-gray-700'
            }`}>
            {isConnected ? <><Check className="w-3.5 h-3.5" /> Conectado</> : <><Sparkles className="w-3.5 h-3.5" /> Autorizar con Base44</>}
          </button>
        )}
        {status === 'custom' && (
          <button
            onClick={() => onAction('setup', ch)}
            className="w-full text-xs font-semibold rounded-lg px-3 py-2 flex items-center justify-center gap-1.5 bg-amber-600 text-white hover:bg-amber-700 transition-colors">
            <Lock className="w-3.5 h-3.5" /> Guía de conexión
          </button>
        )}
        {status === 'soon' && (
          <div className="w-full text-xs font-semibold rounded-lg px-3 py-2 flex items-center justify-center gap-1.5 bg-gray-200 text-gray-500 cursor-not-allowed">
            Próximamente
          </div>
        )}

        {ch.docs && (
          <a href={ch.docs} target="_blank" rel="noreferrer"
            className="text-[10px] text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1 transition-colors">
            <BookOpen className="w-3 h-3" /> API oficial <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
};

const Section = ({ title, subtitle, children, accent }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-1 h-5 rounded-full ${accent}`} />
      <div>
        <h4 className="font-poppins font-bold text-sm text-gray-900">{title}</h4>
        <p className="text-[11px] text-gray-500">{subtitle}</p>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {children}
    </div>
  </div>
);

export default function ChannelConnections({ connections = {}, onAuthorize }) {
  const handleAction = (action, ch) => {
    if (action === 'authorize') {
      if (onAuthorize) {
        onAuthorize(ch);
      } else {
        toast.info(`Para conectar ${ch.name}`, {
          description: 'Pídeme "Conecta ' + ch.name + '" en el chat del Director IA y lanzaré la autorización OAuth oficial de Base44.',
          duration: 6000,
        });
      }
    } else if (action === 'setup') {
      toast.info(`${ch.name} requiere OAuth personalizado`, {
        description: ch.setup + ' Cuando tengas las credenciales, pídeme configurarlo.',
        duration: 8000,
        action: ch.dashUrl ? { label: 'Abrir portal', onClick: () => window.open(ch.dashUrl, '_blank') } : undefined,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-poppins font-bold text-lg text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Conexiones de Canales · PEYU
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Una vez autorizadas, los agentes IA podrán publicar, leer métricas y gestionar campañas automáticamente en tus cuentas oficiales.
          </p>
        </div>
      </div>

      {/* Sección 1: LISTO AHORA */}
      <Section
        title="✓ Listos para autorizar"
        subtitle="OAuth 1-clic nativo de Base44 · tokens encriptados"
        accent="bg-green-500">
        {CHANNELS.ready.map(ch => (
          <ChannelCard key={ch.id} ch={ch} status="ready" isConnected={!!connections[ch.id]} onAction={handleAction} />
        ))}
      </Section>

      {/* Sección 2: OAUTH CUSTOM */}
      <Section
        title="⚙ Requieren OAuth personalizado"
        subtitle="Necesitamos crear una app en el portal del proveedor · setup único de 10-30 min"
        accent="bg-amber-500">
        {CHANNELS.custom.map(ch => (
          <ChannelCard key={ch.id} ch={ch} status="custom" isConnected={!!connections[ch.id]} onAction={handleAction} />
        ))}
      </Section>

      {/* Sección 3: SOON */}
      <Section
        title="○ En roadmap"
        subtitle="APIs limitadas o en evaluación"
        accent="bg-gray-400">
        {CHANNELS.soon.map(ch => (
          <ChannelCard key={ch.id} ch={{ ...ch, color: 'from-gray-400 to-gray-500' }} status="soon" onAction={handleAction} />
        ))}
      </Section>

      {/* Footer educativo */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4 text-xs text-gray-700">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-gray-900">¿Cómo lo hago con la IA?</strong>
            <p className="mt-1 text-gray-600">
              Simplemente dile al <strong>Director IA</strong> en el chat:
              <em className="block mt-1 text-gray-800">"Conecta LinkedIn y Google Analytics"</em>
              <em className="block text-gray-800">"Configura Meta Ads con estas credenciales: [App ID] [App Secret]"</em>
              y él lanzará los flujos de autorización necesarios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}