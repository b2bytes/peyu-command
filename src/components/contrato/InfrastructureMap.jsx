// ============================================================================
// InfrastructureMap · Mapa de lo que PEYU construyó vs lo que IMPULSIA debía
// ============================================================================
import { Code2, Bot, Globe } from 'lucide-react';

const CATEGORY_LABELS = {
  ecommerce_b2c: 'E-commerce B2C',
  b2b: 'Panel B2B',
  logistica: 'Logística',
  ia_y_brain: 'IA & Brain',
  marketing_ads: 'Marketing & Ads',
  seo: 'SEO',
  catalogo_y_imagenes: 'Catálogo & Imágenes',
  finanzas_costos: 'Finanzas',
  analitica: 'Analítica',
  monitoreo: 'Monitoreo',
  operaciones: 'Operaciones',
};

export default function InfrastructureMap({ data }) {
  if (!data) return null;
  const f = data.funciones_backend || {};
  const agentes = data.agentes_desplegados || [];
  const google = data.conectores_google || [];
  const integraciones = data.integraciones_criticas || [];

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Funciones backend por categoría */}
      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Code2 className="w-4 h-4 text-teal-300" />
          <h3 className="font-jakarta font-bold text-white text-sm tracking-tight">
            Backend desplegado · {f.total} funciones
          </h3>
        </div>
        <div className="space-y-1.5">
          {Object.entries(f.por_categoria || {}).sort((a, b) => b[1] - a[1]).map(([key, count]) => {
            const max = Math.max(...Object.values(f.por_categoria));
            const pct = (count / max) * 100;
            return (
              <div key={key}>
                <div className="flex justify-between text-[11px] font-inter mb-0.5">
                  <span className="text-white/75 font-medium">{CATEGORY_LABELS[key] || key}</span>
                  <span className="text-white/40 font-mono">{count}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agentes IA en producción */}
      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-violet-300" />
          <h3 className="font-jakarta font-bold text-white text-sm tracking-tight">
            Agentes IA · {agentes.length} de 17 comprometidos
          </h3>
        </div>
        <div className="space-y-1.5 max-h-[280px] overflow-y-auto peyu-scrollbar-light pr-1">
          {agentes.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-white/[0.03] border border-white/8 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-white font-medium truncate font-inter">{a.role}</p>
                <p className="text-[9px] text-white/40 font-mono">{a.name}</p>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-400/20">{a.canal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conectores Google */}
      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-cyan-300" />
          <h3 className="font-jakarta font-bold text-white text-sm tracking-tight">
            Conectores Google · {google.length} autorizados
          </h3>
        </div>
        <div className="space-y-1.5">
          {google.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-white/[0.03] border border-white/8 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-white font-medium font-inter">{c.name}</p>
                <p className="text-[10px] text-white/45 font-inter truncate">{c.uso}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integraciones críticas */}
      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-emerald-300" />
          <h3 className="font-jakarta font-bold text-white text-sm tracking-tight">
            Integraciones críticas · {integraciones.length} en producción
          </h3>
        </div>
        <div className="space-y-1.5">
          {integraciones.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-white/[0.03] border border-white/8 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-white font-medium font-inter">{c.name}</p>
                <p className="text-[10px] text-white/45 font-inter truncate">{c.evidencia}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}