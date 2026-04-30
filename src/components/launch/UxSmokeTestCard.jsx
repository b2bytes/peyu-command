// ============================================================================
// UxSmokeTestCard — corre uxSmokeTest desktop+mobile y muestra resultados
// ----------------------------------------------------------------------------
// Verifica que cada URL crítica responda 200, con TTFB <2s, en ambos viewports.
// Útil antes del launch y para auditorías rápidas post-deploy.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Smartphone, Monitor, PlayCircle, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const VERDICT_STYLE = {
  pass: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', Icon: CheckCircle2, label: 'OK' },
  warn: { color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   Icon: AlertTriangle, label: 'Lento' },
  fail: { color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     Icon: XCircle, label: 'Falla' },
};

function ViewportResult({ data, label, Icon }) {
  if (!data) return null;
  const v = VERDICT_STYLE[data.verdict] || VERDICT_STYLE.fail;
  return (
    <div className={`flex items-center gap-1.5 text-[11px] ${v.color}`}>
      <Icon className="w-3 h-3" />
      <span className="font-semibold">{label}</span>
      <span className="font-mono">{data.ttfb_ms}ms</span>
      <span>· {data.status || 'err'}</span>
    </div>
  );
}

export default function UxSmokeTestCard() {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('uxSmokeTest', { base_url: 'https://peyuchile.cl' });
      setReport(res.data);
    } catch (err) {
      setError(err.message || 'Error ejecutando test');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Monitor className="w-4 h-4 text-blue-600" />
            UX Smoke Test · Desktop + Mobile
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">10 URLs críticas, 2 viewports, en paralelo</p>
        </div>
        <Button onClick={run} disabled={running} size="sm" className="gap-1.5">
          {running ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Probando...</> : <><PlayCircle className="w-3.5 h-3.5" /> Ejecutar</>}
        </Button>
      </div>

      {error && (
        <div className="mb-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg p-2">{error}</div>
      )}

      {report && (
        <>
          {/* Score y resumen */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-emerald-700 uppercase tracking-wider font-bold">Score</p>
              <p className="text-2xl font-bold text-emerald-900">{report.score}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-gray-500 uppercase tracking-wider">OK</p>
              <p className="text-lg font-bold text-emerald-600">{report.summary.pass}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-gray-500 uppercase tracking-wider">Lento</p>
              <p className="text-lg font-bold text-amber-600">{report.summary.warn}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-gray-500 uppercase tracking-wider">Falla</p>
              <p className="text-lg font-bold text-red-600">{report.summary.fail}</p>
            </div>
          </div>

          {/* Latencias promedio */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-600 flex items-center gap-1.5"><Monitor className="w-3 h-3" /> Desktop</span>
              <span className="font-bold text-sm text-gray-900">{report.summary.avg_ttfb_desktop}ms</span>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-600 flex items-center gap-1.5"><Smartphone className="w-3 h-3" /> Mobile</span>
              <span className="font-bold text-sm text-gray-900">{report.summary.avg_ttfb_mobile}ms</span>
            </div>
          </div>

          {/* Lista de resultados por URL */}
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {report.results.map((r) => {
              const v = VERDICT_STYLE[r.worst_verdict];
              return (
                <div key={r.path} className={`rounded-lg border ${v.border} ${v.bg} p-2`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">{r.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono truncate">{r.path}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${v.color} ${v.bg} border ${v.border}`}>
                      {v.label.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <ViewportResult data={r.desktop} label="Desktop" Icon={Monitor} />
                    <ViewportResult data={r.mobile} label="Mobile" Icon={Smartphone} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}