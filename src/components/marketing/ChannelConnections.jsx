import { useMemo, useState } from 'react';
import { Sparkles, Zap, ShieldCheck, Info } from 'lucide-react';
import { toast } from 'sonner';
import { CHANNELS } from './channels/channelsCatalog';
import ChannelCard from './channels/ChannelCard';
import ChannelSetupDialog from './channels/ChannelSetupDialog';

/**
 * Panel real de gestión de conexiones de canales para el Marketing Hub.
 * - Secciones: Nativos OAuth 1-clic · OAuth custom · CRM & Tools · Roadmap.
 * - Cada card muestra scopes reales verificados con get_connectors_info de Base44.
 * - Autorización OAuth real lanzada a través del Director IA en el chat (el LLM dispara
 *   request_oauth_authorization con los scopes correctos del catálogo).
 */

const Section = ({ title, subtitle, count, accent, children }) => (
  <div>
    <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <div className={`w-1 h-5 rounded-full ${accent}`} />
        <div>
          <h4 className="font-poppins font-bold text-sm text-gray-900">{title}</h4>
          <p className="text-[11px] text-gray-500">{subtitle}</p>
        </div>
      </div>
      {count > 0 && (
        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
      )}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{children}</div>
  </div>
);

export default function ChannelConnections({ connections = {}, onAuthorize }) {
  const [setupChannel, setSetupChannel] = useState(null);

  const stats = useMemo(() => {
    const total = CHANNELS.ready.length + CHANNELS.crm.length;
    const connected = Object.values(connections).filter(Boolean).length;
    return {
      total,
      connected,
      pct: total ? Math.round((connected / total) * 100) : 0,
    };
  }, [connections]);

  const handleAction = (action, ch) => {
    if (action === 'authorize') {
      if (onAuthorize) {
        onAuthorize(ch);
      } else {
        // Prompt al Director IA con las instrucciones exactas (integration_type + scopes)
        const prompt = `Conecta ${ch.name} (integration_type: ${ch.integration_type}) con scopes: ${ch.scopes?.join(', ') || ch.scopesLabel}`;
        navigator.clipboard?.writeText(prompt).catch(() => {});
        toast.success(`Listo para conectar ${ch.name}`, {
          description: `Prompt copiado al portapapeles. Pégalo en el chat del Director IA y lanzaré la autorización OAuth oficial de Base44.`,
          duration: 7000,
        });
      }
    } else if (action === 'setup') {
      setSetupChannel(ch);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 pb-4 border-b border-gray-100">
        <div>
          <h3 className="font-poppins font-bold text-lg text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Conexiones de Canales · PEYU
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Una vez autorizadas, los agentes IA podrán publicar, leer métricas y gestionar campañas automáticamente en tus cuentas oficiales.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 font-poppins">
              {stats.connected}
              <span className="text-sm text-gray-400">/{stats.total}</span>
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Canales activos</div>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-gray-100 flex items-center justify-center relative">
            <div
              className="absolute inset-0 rounded-full border-4 border-emerald-500"
              style={{
                clipPath: `polygon(50% 50%, 50% 0%, ${stats.pct >= 50 ? '100% 0%' : `${50 + stats.pct}% 0%`}, ${stats.pct >= 50 ? `100% ${(stats.pct - 50) * 2}%` : ''} 50% 50%)`,
                display: stats.pct === 0 ? 'none' : 'block',
              }}
            />
            <span className="text-xs font-bold text-gray-700">{stats.pct}%</span>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-600 bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            <strong>Tokens encriptados</strong> en Base44 (AES-256)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>
            <strong>Webhooks</strong> para Gmail, Drive, Slack, HubSpot
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>Puedes revocar el acceso en cualquier momento</span>
        </div>
      </div>

      {/* Sección 1: NATIVOS LISTOS */}
      <Section
        title="✓ Nativos · OAuth 1-clic"
        subtitle="Listos para autorizar ahora — Base44 gestiona tokens y refresh automáticamente"
        count={CHANNELS.ready.length}
        accent="bg-green-500"
      >
        {CHANNELS.ready.map((ch) => (
          <ChannelCard
            key={ch.id}
            ch={ch}
            status="ready"
            isConnected={!!connections[ch.id]}
            onAction={handleAction}
          />
        ))}
      </Section>

      {/* Sección 2: CRM + TOOLS */}
      <Section
        title="🧰 CRM & Herramientas"
        subtitle="Integraciones nativas para sincronizar leads, alertas y contenidos"
        count={CHANNELS.crm.length}
        accent="bg-indigo-500"
      >
        {CHANNELS.crm.map((ch) => (
          <ChannelCard
            key={ch.id}
            ch={ch}
            status="ready"
            isConnected={!!connections[ch.id]}
            onAction={handleAction}
          />
        ))}
      </Section>

      {/* Sección 3: OAUTH CUSTOM */}
      <Section
        title="⚙ OAuth personalizado"
        subtitle="Crear una app en el portal del proveedor · setup único"
        count={CHANNELS.custom.length}
        accent="bg-amber-500"
      >
        {CHANNELS.custom.map((ch) => (
          <ChannelCard key={ch.id} ch={ch} status="custom" onAction={handleAction} />
        ))}
      </Section>

      {/* Sección 4: SOON */}
      <Section
        title="○ En roadmap"
        subtitle="APIs limitadas, de pago, o en evaluación"
        count={CHANNELS.soon.length}
        accent="bg-gray-400"
      >
        {CHANNELS.soon.map((ch) => (
          <ChannelCard key={ch.id} ch={{ ...ch, color: 'from-gray-400 to-gray-500' }} status="soon" onAction={handleAction} />
        ))}
      </Section>

      {/* Footer educativo */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4 text-xs text-gray-700">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="text-gray-900">¿Cómo autorizo realmente un canal?</strong>
            <p className="mt-1 text-gray-600 leading-relaxed">
              Al tocar <strong>"Autorizar con Base44"</strong>, copiamos al portapapeles un prompt listo.
              Pégalo en el chat del <strong>Director IA</strong> (abajo) y el asistente lanzará el flujo OAuth
              oficial — aparecerá un modal para que apruebes con tu cuenta de Google/LinkedIn/TikTok/etc.
            </p>
            <div className="mt-2 bg-white border border-purple-100 rounded-lg p-2 font-mono text-[11px] text-gray-700">
              💬 Ejemplo: <em>"Conecta LinkedIn y Google Analytics"</em>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Dialog (OAuth custom) */}
      <ChannelSetupDialog
        channel={setupChannel}
        open={!!setupChannel}
        onOpenChange={(v) => !v && setSetupChannel(null)}
      />
    </div>
  );
}