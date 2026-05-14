import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Rocket, Loader2, AlertCircle, Copy, ImageOff, DollarSign, FileWarning,
  CheckCircle2, ChevronRight, X
} from 'lucide-react';

/**
 * LaunchReadinessPanel — Pre-launch audit dashboard for the catalog.
 * Llama a auditCatalogForLaunch (modo scan) y muestra:
 *  • Duplicados obvios (con botón "desactivar duplicado")
 *  • Productos con precio en $0 / faltante
 *  • Productos con descripciones vacías/malas
 *  • Productos con imágenes rotas/faltantes
 *
 * Solo desactiva (activo=false), nunca borra. El usuario aprueba uno por uno.
 */
export default function LaunchReadinessPanel({ onProductClick, onAction }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());
  const [expanded, setExpanded] = useState(true);

  const runScan = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('auditCatalogForLaunch', { mode: 'scan' });
      if (res?.data?.error) throw new Error(res.data.error);
      setReport(res.data);
    } catch (e) {
      setError(e.message || 'Error escaneando el catálogo');
    } finally {
      setLoading(false);
    }
  };

  const deactivate = async (ids, label) => {
    if (!confirm(`¿Desactivar ${ids.length} producto${ids.length > 1 ? 's' : ''}?\n\n${label}\n\nSe pueden reactivar luego.`)) return;
    setApplying(true);
    try {
      const res = await base44.functions.invoke('auditCatalogForLaunch', {
        mode: 'apply',
        deactivateIds: ids,
      });
      if (res?.data?.error) throw new Error(res.data.error);
      setDismissed(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });
      onAction?.();
    } catch (e) {
      alert('Error: ' + (e.message || 'desconocido'));
    } finally {
      setApplying(false);
    }
  };

  const deactivateAllDuplicates = async () => {
    if (!report?.duplicates?.length) return;
    const allIds = report.duplicates.flatMap(g => g.remove.map(r => r.id))
      .filter(id => !dismissed.has(id));
    if (allIds.length === 0) return;
    await deactivate(allIds, `Desactivar ${allIds.length} duplicados (conservando el mejor de cada grupo).`);
  };

  const totalIssues = report
    ? (report.summary.duplicate_removable + report.summary.precio_issues + report.summary.descripcion_issues + report.summary.image_issues)
    : 0;

  const activeDuplicates = report?.duplicates?.filter(g => g.remove.some(r => !dismissed.has(r.id))) || [];

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-fuchsia-500/10 border border-violet-400/30 rounded-2xl p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-poppins font-bold text-white text-base flex items-center gap-2">
              Pre-Launch Audit
              {report && totalIssues === 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Tienda lista
                </span>
              )}
            </h3>
            <p className="text-xs text-white/65 mt-0.5 leading-relaxed">
              Escanea duplicados, precios faltantes, descripciones malas e imágenes rotas antes del lanzamiento.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {report && (
            <button onClick={() => setExpanded(!expanded)} className="text-white/50 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-white/5">
              {expanded ? 'Colapsar' : 'Expandir'}
            </button>
          )}
          <Button
            onClick={runScan}
            disabled={loading}
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
            {loading ? 'Escaneando...' : report ? 'Re-escanear' : 'Iniciar scan'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-rose-500/10 border border-rose-400/30 rounded-lg text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {report && expanded && (
        <div className="mt-4 space-y-3">
          {/* KPIs summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Kpi icon={Copy}        color="amber"   label="Duplicados"        value={activeDuplicates.length} subtitle={`${activeDuplicates.reduce((s,g)=>s+g.remove.filter(r=>!dismissed.has(r.id)).length,0)} a desactivar`} />
            <Kpi icon={DollarSign}  color="rose"    label="Precio $0"          value={report.precio_issues.length} />
            <Kpi icon={FileWarning} color="orange"  label="Sin descripción"    value={report.descripcion_issues.length} />
            <Kpi icon={ImageOff}    color="fuchsia" label="Imagen rota"        value={report.image_issues.length} subtitle={`de ${report.summary.images_checked} verificadas`} />
          </div>

          {/* Duplicados */}
          {activeDuplicates.length > 0 && (
            <Section
              title={`Duplicados obvios (${activeDuplicates.length} grupos)`}
              hint="Match por nombre o SKU idéntico. Se conserva el de mejor calidad (más imágenes, precios B2B, descripción completa)."
              action={
                <Button
                  size="sm"
                  onClick={deactivateAllDuplicates}
                  disabled={applying}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7"
                >
                  {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Desactivar todos'}
                </Button>
              }
            >
              {activeDuplicates.map((g, i) => {
                const removeActive = g.remove.filter(r => !dismissed.has(r.id));
                if (removeActive.length === 0) return null;
                return (
                  <DuplicateGroup
                    key={i}
                    group={g}
                    removeActive={removeActive}
                    onDeactivate={(ids) => deactivate(ids, `Match: "${g.key}"`)}
                    onProductClick={onProductClick}
                    applying={applying}
                  />
                );
              })}
            </Section>
          )}

          {/* Precios */}
          {report.precio_issues.length > 0 && (
            <Section
              title={`Productos con precio en $0 (${report.precio_issues.length})`}
              hint="Estos productos NO se pueden vender. Edítalos o desactívalos."
            >
              <ProductIssueList items={report.precio_issues} onProductClick={onProductClick} field="precio_b2c" formatValue={(v) => v ? `$${v.toLocaleString('es-CL')}` : 'Sin precio'} />
            </Section>
          )}

          {/* Descripciones */}
          {report.descripcion_issues.length > 0 && (
            <Section
              title={`Sin descripción usable (${report.descripcion_issues.length})`}
              hint="Productos sin descripción o con texto < 15 caracteres reales. Mal para SEO y conversión."
            >
              <ProductIssueList items={report.descripcion_issues} onProductClick={onProductClick} field="descripcion_length" formatValue={(v) => `${v || 0} chars`} />
            </Section>
          )}

          {/* Imágenes */}
          {report.image_issues.length > 0 && (
            <Section
              title={`Imágenes rotas o faltantes (${report.image_issues.length})`}
              hint="URL no responde, devuelve 404 o no es imagen."
            >
              <ProductIssueList items={report.image_issues} onProductClick={onProductClick} field="reason" />
            </Section>
          )}

          {totalIssues === 0 && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-400/30 rounded-xl text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
              <p className="font-bold text-emerald-200 text-sm">¡Catálogo limpio!</p>
              <p className="text-xs text-emerald-200/70 mt-1">
                {report.total_productos} productos escaneados · sin problemas críticos detectados
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, color, label, value, subtitle }) {
  const colors = {
    amber: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
    rose: 'text-rose-300 border-rose-400/30 bg-rose-500/10',
    orange: 'text-orange-300 border-orange-400/30 bg-orange-500/10',
    fuchsia: 'text-fuchsia-300 border-fuchsia-400/30 bg-fuchsia-500/10',
  };
  const inactive = value === 0;
  return (
    <div className={`px-3 py-2 rounded-xl border ${inactive ? 'border-white/10 bg-white/5' : colors[color]}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-80">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className={`text-xl font-poppins font-bold mt-0.5 ${inactive ? 'text-white/40' : ''}`}>{value}</div>
      {subtitle && <div className="text-[10px] opacity-60 mt-0.5">{subtitle}</div>}
    </div>
  );
}

function Section({ title, hint, action, children }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="font-bold text-white text-sm">{title}</p>
          {hint && <p className="text-[11px] text-white/50 mt-0.5">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-2 mt-2">{children}</div>
    </div>
  );
}

function DuplicateGroup({ group, removeActive, onDeactivate, onProductClick, applying }) {
  return (
    <div className="bg-black/20 border border-white/10 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] text-white/50 mb-2">
        <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono">{group.type === 'sku' ? 'SKU' : 'NAME'}</span>
        <span className="font-mono truncate">"{group.key}"</span>
      </div>

      {/* KEEP */}
      <ProductMiniRow
        producto={group.keep}
        badge="MANTENER"
        badgeColor="emerald"
        onProductClick={onProductClick}
      />

      {/* REMOVE */}
      {removeActive.map(r => (
        <ProductMiniRow
          key={r.id}
          producto={r}
          badge="DUPLICADO"
          badgeColor="rose"
          onProductClick={onProductClick}
          actionLabel="Desactivar"
          onAction={() => onDeactivate([r.id])}
          actionDisabled={applying}
        />
      ))}
    </div>
  );
}

function ProductMiniRow({ producto, badge, badgeColor, onProductClick, actionLabel, onAction, actionDisabled }) {
  const colors = {
    emerald: 'bg-emerald-500/20 text-emerald-300',
    rose: 'bg-rose-500/20 text-rose-300',
  };
  return (
    <div className="flex items-center gap-2 py-1.5 px-1.5 rounded-md hover:bg-white/5">
      {producto.imagen_url ? (
        <img src={producto.imagen_url} alt="" className="w-9 h-9 rounded-md object-cover flex-shrink-0 bg-white/5" />
      ) : (
        <div className="w-9 h-9 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
          <ImageOff className="w-3.5 h-3.5 text-white/30" />
        </div>
      )}
      <button
        onClick={() => onProductClick?.(producto.id)}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${colors[badgeColor]}`}>{badge}</span>
          <span className="text-xs text-white font-medium truncate">{producto.nombre}</span>
        </div>
        <div className="text-[10px] text-white/40 font-mono mt-0.5 flex items-center gap-2">
          <span>{producto.sku}</span>
          {producto.precio_b2c !== undefined && <span>${(producto.precio_b2c || 0).toLocaleString('es-CL')}</span>}
        </div>
      </button>
      {actionLabel && (
        <Button
          size="sm"
          onClick={onAction}
          disabled={actionDisabled}
          className="bg-rose-600/80 hover:bg-rose-600 text-white text-[10px] h-7 px-2.5"
        >
          {actionDisabled ? <Loader2 className="w-3 h-3 animate-spin" /> : actionLabel}
        </Button>
      )}
    </div>
  );
}

function ProductIssueList({ items, onProductClick, field, formatValue }) {
  const display = items.slice(0, 20);
  return (
    <>
      {display.map(item => (
        <div key={item.id} className="flex items-center gap-2 py-1.5 px-1.5 rounded-md hover:bg-white/5 cursor-pointer" onClick={() => onProductClick?.(item.id)}>
          {item.imagen_url ? (
            <img src={item.imagen_url} alt="" className="w-9 h-9 rounded-md object-cover flex-shrink-0 bg-white/5" />
          ) : (
            <div className="w-9 h-9 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
              <ImageOff className="w-3.5 h-3.5 text-white/30" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white font-medium truncate">{item.nombre}</p>
            <div className="text-[10px] text-white/40 font-mono mt-0.5 flex items-center gap-2">
              <span>{item.sku}</span>
              <span className="text-amber-300">{formatValue ? formatValue(item[field]) : item[field]}</span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
        </div>
      ))}
      {items.length > display.length && (
        <p className="text-[11px] text-white/40 text-center pt-1">
          + {items.length - display.length} más...
        </p>
      )}
    </>
  );
}