// ============================================================================
// BacklinksDiscoveryCard — descubre backlinks reales en medios chilenos
// ----------------------------------------------------------------------------
// Lanza la función `discoverBacklinks` que usa búsqueda web (LLM) para
// encontrar menciones reales de PEYU en diarios, TV, blogs y redes.
// Muestra el resumen del último blast y los nuevos hits encontrados.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ExternalLink, CheckCircle2, AlertCircle, Sparkles, Database } from 'lucide-react';

export default function BacklinksDiscoveryCard() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  const runDiscovery = async () => {
    setRunning(true); setError(null); setResult(null);
    try {
      const res = await base44.functions.invoke('discoverBacklinks', {});
      setResult(res?.data || res);
    } catch (e) {
      setError(e?.message || 'Error desconocido');
    } finally {
      setRunning(false);
    }
  };

  const runSeed = async () => {
    setSeeding(true); setSeedResult(null);
    try {
      const res = await base44.functions.invoke('seedBacklinks', {});
      setSeedResult(res?.data || res);
    } catch (e) {
      setSeedResult({ error: e?.message || 'Error' });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          Backlinks Discovery — busca menciones reales en medios CL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-700 leading-relaxed">
          PEYU lleva años en el mercado y tiene cobertura en <strong>Emol, BancoEstado, CNN Chile, País Circular, blogs sustentables, Instagram, TikTok</strong>.
          Este blast usa búsqueda web vía IA para detectar menciones reales (diarios, TV, prensa) y las guarda como backlinks. <strong>Ejecuta 1× por semana.</strong>
        </p>

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={runDiscovery}
            disabled={running}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white gap-2"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {running ? 'Buscando en internet…' : 'Descubrir backlinks reales'}
          </Button>

          <Button
            onClick={runSeed}
            disabled={seeding}
            variant="outline"
            className="gap-2"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Cargar seed inicial
          </Button>
        </div>

        {/* Resultado seed */}
        {seedResult && (
          <div className={`text-xs rounded-lg p-2.5 border ${seedResult.error ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            {seedResult.error
              ? <><AlertCircle className="w-3.5 h-3.5 inline mr-1" /> {seedResult.error}</>
              : <><CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Seed: creó {seedResult.created} · existían {seedResult.total_existing}</>
            }
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Resultado discovery */}
        {result && !error && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Nuevos" value={result.created || 0} highlight />
              <Stat label="Total BD" value={result.total_existing || 0} />
              <Stat label="Queries" value={result.per_query?.length || 0} />
            </div>

            {/* Por query */}
            {result.per_query?.length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <p className="text-[11px] font-bold text-slate-700 mb-2">Hits por canal</p>
                <div className="space-y-1">
                  {result.per_query.map((q, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">{q.label}</span>
                      <span className={`font-bold ${q.error ? 'text-red-600' : q.count > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {q.error ? 'error' : `${q.count} hits`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample */}
            {result.sample?.length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <p className="text-[11px] font-bold text-slate-700 mb-2">Muestra ({result.sample.length})</p>
                <div className="space-y-1.5">
                  {result.sample.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-2 text-xs text-slate-700 hover:text-purple-700 group"
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-50 group-hover:opacity-100" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{s.titulo}</p>
                        <p className="text-[10px] text-slate-500">{s.dominio}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {result.created === 0 && (
              <p className="text-xs text-slate-500 italic">
                No se encontraron backlinks nuevos esta vez. Reintenta en unos días — los crawlers van descubriendo más cobertura con el tiempo.
              </p>
            )}
          </div>
        )}

        <p className="text-[10px] text-slate-500 leading-relaxed">
          💡 Estrategia: combina <strong>seed inicial</strong> (cobertura ya conocida) + <strong>discovery semanal</strong> (nuevas menciones). Los backlinks se guardan en la BD y aparecen en <code>/admin/backlinks</code> para revisión manual.
        </p>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, highlight = false }) {
  return (
    <div className={`rounded-lg p-2.5 border text-center ${highlight ? 'bg-purple-100 border-purple-300' : 'bg-white border-slate-200'}`}>
      <p className={`text-xl font-bold ${highlight ? 'text-purple-700' : 'text-slate-700'}`}>{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}