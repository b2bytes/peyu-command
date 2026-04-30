// ============================================================================
// LaunchSmokeTestCard — auditoría pre-launch desde el War Room
// ----------------------------------------------------------------------------
// Botón único que invoca launchSmokeTest y renderiza un dashboard estilo
// "checklist NASA" con score global, semáforos por chequeo y tooltips.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Rocket, CheckCircle2, AlertTriangle, XCircle, Loader2, ShieldCheck,
} from 'lucide-react';

const STATUS_META = {
  pass: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'OK' },
  warn: { icon: AlertTriangle, color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Atención' },
  fail: { icon: XCircle,        color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     label: 'Falla' },
};

export default function LaunchSmokeTestCard() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('launchSmokeTest', {});
      setReport(res.data);
    } catch (e) {
      setError(e.message || 'Error ejecutando smoke test');
    } finally {
      setLoading(false);
    }
  };

  const overallMeta = report ? STATUS_META[report.overall] : null;

  return (
    <Card className="border-slate-300 bg-gradient-to-br from-slate-50 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            Pre-launch Smoke Test
          </CardTitle>
          <Button onClick={runTest} disabled={loading} size="sm" className="gap-2 bg-slate-900 hover:bg-slate-800">
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Ejecutando…</>
              : <><Rocket className="w-3.5 h-3.5" /> Run check</>}
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Verifica productos, blog, indexación, secrets y conversiones recientes.
        </p>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800 mb-3">
            ⚠ {error}
          </div>
        )}

        {!report && !error && !loading && (
          <p className="text-xs text-slate-400 italic">Aún no se ha ejecutado el check.</p>
        )}

        {report && overallMeta && (
          <>
            {/* Resumen global */}
            <div className={`rounded-xl ${overallMeta.bg} ${overallMeta.border} border p-4 mb-3 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <overallMeta.icon className={`w-7 h-7 ${overallMeta.color}`} />
                <div>
                  <p className={`font-bold ${overallMeta.color}`}>
                    Score: {report.score}/100 · {overallMeta.label}
                  </p>
                  <p className="text-xs text-slate-600">
                    {report.summary.pass} OK · {report.summary.warn} atención · {report.summary.fail} fallas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Generado</p>
                <p className="text-xs font-mono text-slate-600">
                  {new Date(report.generated_at).toLocaleTimeString('es-CL')}
                </p>
              </div>
            </div>

            {/* Lista de checks */}
            <div className="space-y-1.5">
              {report.checks.map((c, i) => {
                const m = STATUS_META[c.status] || STATUS_META.warn;
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-lg ${m.bg} ${m.border} border px-3 py-2`}
                  >
                    <m.icon className={`w-4 h-4 ${m.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-600">{c.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}