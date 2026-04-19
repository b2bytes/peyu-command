import { Check, Plus, Zap } from 'lucide-react';

const CHANNELS = [
  {
    id: 'meta',
    name: 'Meta (Instagram + Facebook)',
    icon: '📸',
    color: 'from-pink-500 to-purple-600',
    docs: 'https://developers.facebook.com/docs/instagram-api',
    capabilities: ['Publicar posts', 'Reels', 'Stories', 'Insights', 'Ads Manager'],
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Company Page',
    icon: '💼',
    color: 'from-blue-600 to-blue-800',
    docs: 'https://learn.microsoft.com/linkedin/marketing/',
    capabilities: ['Posts B2B', 'Sponsored Content', 'Lead Gen Forms', 'Analytics'],
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  },
  {
    id: 'tiktok',
    name: 'TikTok Business',
    icon: '🎵',
    color: 'from-gray-900 to-pink-500',
    docs: 'https://business-api.tiktok.com/portal/docs',
    capabilities: ['Publicar videos', 'Spark Ads', 'Analytics', 'Catalog'],
    authUrl: 'https://business-api.tiktok.com/portal/auth',
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    icon: '🎯',
    color: 'from-blue-500 to-green-500',
    docs: 'https://developers.google.com/google-ads/api/docs/start',
    capabilities: ['Search Ads', 'Performance Max', 'Shopping', 'YouTube Ads'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    icon: '📊',
    color: 'from-orange-500 to-yellow-500',
    docs: 'https://developers.google.com/analytics/devguides/reporting/data/v1',
    capabilities: ['Tráfico web', 'Conversiones', 'Atribución', 'Audiencias'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  {
    id: 'youtube',
    name: 'YouTube Channel',
    icon: '▶️',
    color: 'from-red-500 to-red-700',
    docs: 'https://developers.google.com/youtube/v3',
    capabilities: ['Upload videos', 'Shorts', 'Analytics', 'Comentarios'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  {
    id: 'pinterest',
    name: 'Pinterest Business',
    icon: '📌',
    color: 'from-red-500 to-pink-600',
    docs: 'https://developers.pinterest.com/docs/api/v5/',
    capabilities: ['Pins', 'Boards', 'Ads', 'Shopping'],
    authUrl: 'https://www.pinterest.com/oauth/',
  },
  {
    id: 'threads',
    name: 'Threads (Meta)',
    icon: '🧵',
    color: 'from-gray-900 to-gray-700',
    docs: 'https://developers.facebook.com/docs/threads',
    capabilities: ['Posts texto', 'Respuestas', 'Insights'],
    authUrl: 'https://threads.net/oauth/authorize',
  },
];

export default function ChannelConnections({ connections = {}, onConnect }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-poppins font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Conexiones de Canales
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Conecta tus cuentas reales para publicar y medir automáticamente
          </p>
        </div>
        <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
          FASE 2 · Disponible mañana
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CHANNELS.map((ch) => {
          const isConnected = connections[ch.id];
          return (
            <div key={ch.id}
              className={`relative rounded-xl border-2 p-3 transition-all ${
                isConnected
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${ch.color} flex items-center justify-center text-white text-lg shadow mb-2`}>
                {ch.icon}
              </div>
              <div className="font-semibold text-sm text-gray-900 leading-tight mb-1">
                {ch.name}
              </div>
              <div className="text-[10px] text-gray-500 mb-2 leading-snug">
                {ch.capabilities.slice(0, 2).join(' · ')}
              </div>
              <button
                onClick={() => onConnect?.(ch)}
                disabled={isConnected}
                className={`w-full text-xs font-semibold rounded-lg px-2 py-1.5 flex items-center justify-center gap-1 transition-colors ${
                  isConnected
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}>
                {isConnected ? (
                  <><Check className="w-3 h-3" /> Conectado</>
                ) : (
                  <><Plus className="w-3 h-3" /> Conectar</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
        <strong>📌 ¿Cómo funcionará?</strong>
        <p className="mt-1 text-blue-800">
          Al hacer clic en "Conectar" se abrirá la autenticación OAuth oficial de cada plataforma. Los tokens quedan encriptados y los agentes IA podrán publicar, leer métricas y lanzar campañas en tu nombre.
        </p>
      </div>
    </div>
  );
}