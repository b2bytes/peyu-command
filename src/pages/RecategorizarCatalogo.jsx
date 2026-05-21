// pages/RecategorizarCatalogo.jsx
// ─────────────────────────────────────────────────────────────────────────
// Panel admin para ejecutar la recategorización masiva de productos.
// Flujo: Preview (dry-run) → revisar cambios → Apply.
// Solo admins pueden acceder.
// ─────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Check, AlertTriangle, ArrowRight, RefreshCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CATEGORIA_COLORS = {
  'Escritorio':      'bg-blue-100 text-blue-800 border-blue-200',
  'Hogar':           'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Entretenimiento': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'Corporativo':     'bg-amber-100 text-amber-800 border-amber-200',
  'Carcasas B2C':    'bg-teal-100 text-teal-800 border-teal-200',
};

export default function RecategorizarCatalogo() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState(null);

  const runPreview = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('recategorizarCatalogo', { dry_run: true });
      setPreview(res.data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const runApply = async () => {
    if (!confirm(`¿Aplicar ${preview.stats.a_recategorizar} cambios al catálogo? Esta acción modifica la base de datos.`)) return;
    setApplying(true);
    try {
      const res = await base44.functions.invoke('recategorizarCatalogo', { dry_run: false });
      toast({
        title: `${res.data.stats.aplicados} productos recategorizados`,
        description: res.data.stats.errores > 0 ? `${res.data.stats.errores} errores` : 'Sin errores',
      });
      setPreview(res.data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 font-jakarta">Recategorizar catálogo</h1>
        <p className="text-sm text-slate-600 mt-1">
          Reasigna automáticamente la categoría correcta a cada producto activo usando reglas sobre el nombre/SKU/descripción. <strong>Siempre revisa el preview antes de aplicar.</strong>
        </p>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <Button onClick={runPreview} disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {preview ? 'Re-generar preview' : 'Generar preview'}
        </Button>
        {preview?.dry_run && preview.stats.a_recategorizar > 0 && (
          <Button onClick={runApply} disabled={applying} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {applying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Aplicar {preview.stats.a_recategorizar} cambios
          </Button>
        )}
      </div>

      {preview && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <KPI label="Productos analizados" value={preview.stats.total} tone="slate" />
            <KPI label="Sin cambios" value={preview.stats.sin_cambio} tone="slate" />
            <KPI label={preview.dry_run ? 'A recategorizar' : 'Aplicados'} value={preview.dry_run ? preview.stats.a_recategorizar : preview.stats.aplicados} tone="emerald" />
            <KPI label="Errores" value={preview.stats.errores || 0} tone={preview.stats.errores > 0 ? 'rose' : 'slate'} />
          </div>

          {/* Resumen por categoría destino */}
          {Object.keys(preview.stats.por_categoria_destino).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-3">
                Distribución por categoría destino
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(preview.stats.por_categoria_destino).map(([cat, count]) => (
                  <span key={cat} className={`text-xs font-bold px-3 py-1.5 rounded-full border ${CATEGORIA_COLORS[cat] || 'bg-slate-100'}`}>
                    {cat} · {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tabla de cambios */}
          {preview.cambios?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <p className="font-bold text-slate-900 text-sm">
                  {preview.cambios.length} cambios {preview.dry_run ? 'propuestos' : 'aplicados'}
                </p>
              </div>
              <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
                {preview.cambios.map((c) => (
                  <div key={c.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.nombre}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">SKU {c.sku}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${CATEGORIA_COLORS[c.categoria_actual] || 'bg-slate-100'} opacity-60`}>
                        {c.categoria_actual || '—'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${CATEGORIA_COLORS[c.categoria_nueva] || 'bg-slate-100'}`}>
                        {c.categoria_nueva}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview.cambios?.length === 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
              <Check className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-emerald-900">Catálogo coherente</p>
              <p className="text-sm text-emerald-700 mt-1">Ningún producto necesita recategorización.</p>
            </div>
          )}
        </>
      )}

      {!preview && !loading && (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-10 text-center">
          <RefreshCcw className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Genera un preview para empezar</p>
          <p className="text-sm text-slate-500 mt-1">El sistema analizará los 190+ productos activos y te mostrará qué reasignaría.</p>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, tone }) {
  const TONE = {
    slate:   'border-slate-200 text-slate-900',
    emerald: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    rose:    'border-rose-200 text-rose-700 bg-rose-50',
  };
  return (
    <div className={`bg-white border-2 rounded-2xl p-4 ${TONE[tone]}`}>
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold font-jakarta">{value}</p>
    </div>
  );
}