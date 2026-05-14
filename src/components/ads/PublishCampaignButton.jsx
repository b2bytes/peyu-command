// ============================================================================
// PublishCampaignButton — Botón híbrido "Publicar a Google Ads"
// ----------------------------------------------------------------------------
// Llama a adsPublishCampaign que automáticamente decide entre:
//   - Publicación REAL vía Google Ads API v23.1 (si hay credenciales)
//   - Fallback CSV automático (si faltan secrets o la API falla)
// Muestra feedback contextual según el modo usado.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Rocket, Loader2, CheckCircle2, AlertTriangle, Download, ExternalLink } from 'lucide-react';

export default function PublishCampaignButton({ draft, onPublished }) {
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState(null);

  const publish = async () => {
    setPublishing(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('adsPublishCampaign', { draft_id: draft.id });
      setResult(res.data);
      if (res.data?.success && onPublished) onPublished();
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={publish}
        disabled={publishing}
        size="sm"
        className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white w-full"
      >
        {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
        {publishing ? 'Publicando…' : '🚀 Publicar a Google Ads'}
      </Button>

      {/* Resultado: modo API */}
      {result?.success && result.mode === 'api' && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs space-y-1.5">
          <div className="flex items-start gap-1.5 text-emerald-900">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">¡Campaña publicada vía API {result.api_version}!</p>
              <p className="text-[11px] mt-0.5">{result.note}</p>
              {result.warning && (
                <p className="text-[11px] mt-1 text-amber-700">⚠ {result.warning}</p>
              )}
            </div>
          </div>
          {result.manage_url && (
            <a href={result.manage_url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="w-full gap-1.5 h-7 text-xs">
                <ExternalLink className="w-3 h-3" /> Abrir en Google Ads
              </Button>
            </a>
          )}
        </div>
      )}

      {/* Resultado: fallback CSV */}
      {result?.success && result.mode === 'csv_fallback' && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs space-y-1.5">
          <div className="flex items-start gap-1.5 text-amber-900">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Publicado en modo CSV</p>
              <p className="text-[11px] mt-0.5 leading-snug">{result.reason}</p>
              {result.missing_secrets?.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-[10px] font-bold text-amber-700">
                    ¿Cómo activar publicación directa? ({result.missing_secrets.length} secrets pendientes)
                  </summary>
                  <ol className="mt-1 text-[10px] list-decimal list-inside space-y-0.5 text-amber-800">
                    <li>Solicita Developer Token en ads.google.com → Tools → API Center (1-2 semanas approval)</li>
                    <li>Crea OAuth Client ID en console.cloud.google.com → Credentials</li>
                    <li>Genera Refresh Token con scope <code>https://www.googleapis.com/auth/adwords</code></li>
                    <li>Agrega los 5 secrets en el dashboard Base44 → Settings → Secrets</li>
                  </ol>
                </details>
              )}
            </div>
          </div>
          {result.file_url && (
            <a href={result.file_url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="w-full gap-1.5 h-7 text-xs">
                <Download className="w-3 h-3" /> Descargar CSV para Google Ads Editor
              </Button>
            </a>
          )}
        </div>
      )}

      {/* Error fatal */}
      {result?.error && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-800">
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> {result.error}
        </div>
      )}
    </div>
  );
}