import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Trophy } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// /admin/ab-tests — Resultado de los tests A/B de landings.
// Compara visitas vs clics en el botón de compra final de cada variante.
// ════════════════════════════════════════════════════════════════════════
function resumirVariante(eventos, variante) {
  const de = eventos.filter((e) => e.variante === variante);
  const vistas = new Set(de.filter((e) => e.evento === 'view').map((e) => e.visitor_id || e.id)).size;
  const clics = de.filter((e) => e.evento === 'click').length;
  return { variante, vistas, clics, tasa: vistas > 0 ? (clics / vistas) * 100 : 0 };
}

export default function ABTests() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ABTestEvent.list('-created_date', 2000)
      .then((r) => setEventos(r || []))
      .finally(() => setLoading(false));
  }, []);

  const tests = useMemo(() => {
    const ids = [...new Set(eventos.map((e) => e.test_id))];
    return ids.map((id) => {
      const de = eventos.filter((e) => e.test_id === id);
      const a = resumirVariante(de, 'A');
      const b = resumirVariante(de, 'B');
      const ganadora = a.tasa === b.tasa ? null : a.tasa > b.tasa ? 'A' : 'B';
      return { id, a, b, ganadora };
    });
  }, [eventos]);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-7 h-7 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="font-poppins font-bold text-2xl text-gray-900">Tests A/B de landings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cada visitante ve siempre la misma versión. Comparamos cuántos de ellos llegan a tocar el botón de compra final.
        </p>
      </div>

      {tests.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-12">Todavía no hay visitas registradas.</p>
      )}

      {tests.map((t) => (
        <div key={t.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <p className="font-bold text-gray-900">{t.id}</p>
          <div className="grid grid-cols-2 gap-3">
            {[t.a, t.b].map((v) => (
              <div
                key={v.variante}
                className={`rounded-xl p-4 text-center ${t.ganadora === v.variante ? 'bg-emerald-50 ring-2 ring-emerald-300' : 'bg-gray-50'}`}
              >
                <p className="text-xs font-bold text-gray-500 flex items-center justify-center gap-1">
                  Versión {v.variante}
                  {t.ganadora === v.variante && <Trophy className="w-3.5 h-3.5 text-emerald-600" />}
                </p>
                <p className="font-poppins font-bold text-3xl text-gray-900 mt-1">{v.tasa.toFixed(1)}%</p>
                <p className="text-[11px] text-gray-500 mt-1">{v.clics} clics de {v.vistas} visitas</p>
              </div>
            ))}
          </div>
          {t.ganadora ? (
            <p className="text-xs text-gray-600">
              Por ahora convierte mejor la <strong>versión {t.ganadora}</strong>. Con pocas visitas el resultado aún puede cambiar.
            </p>
          ) : (
            <p className="text-xs text-gray-500">Ambas versiones van iguales.</p>
          )}
        </div>
      ))}
    </div>
  );
}