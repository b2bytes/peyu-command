import { Megaphone, FileText, Download, Upload, CheckCircle2, Sparkles } from 'lucide-react';
import { CAMPANAS_PEYU } from '@/lib/campanas-fiestas-2026';
import CampanaCard from '@/components/ads/CampanaCard';

// ════════════════════════════════════════════════════════════════════════
// /admin/crear-campanas — Generador de las 4 campañas Google Ads PEYU.
// Cada tarjeta genera una campaña profesional completa con IA (vía
// adsGenerateCampaign2026) y la exporta a CSV de Google Ads Editor (vía
// adsExportEditor) para subida masiva 1-click. Estrategia 2026/2027.
// ════════════════════════════════════════════════════════════════════════

const PASOS = [
  { icon: Sparkles, t: 'Genera con IA', d: 'Cada campaña se crea completa: copy, keywords, assets, audiencias y forecast.' },
  { icon: Download, t: 'Descarga el CSV', d: 'Archivo compatible con Google Ads Editor (formato oficial de subida masiva).' },
  { icon: Upload, t: 'Importa en Ads Editor', d: 'Google Ads Editor → File → Import → selecciona el CSV. La campaña queda en Paused.' },
  { icon: CheckCircle2, t: 'Revisa y publica', d: 'Ajustas presupuesto final, le das play y la campaña sale en vivo.' },
];

export default function CrearCampanas() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Megaphone className="w-3.5 h-3.5" /> Google Ads · 2026/2027
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-poppins font-bold text-slate-900">Crear campañas Google Ads</h1>
        <p className="text-slate-600 text-sm mt-1 max-w-3xl">
          Genera las 4 campañas profesionales de PEYU con IA y descárgalas como archivo CSV listo para
          <strong> Google Ads Editor</strong>. Cada campaña usa la mejor estrategia 2026/2027 (Performance Max,
          Demand Gen, AI Max para Search) optimizada para convertir.
        </p>
      </div>

      {/* pasos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {PASOS.map(({ icon: Icon, t, d }, i) => (
          <div key={t} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Icon className="w-4 h-4 text-emerald-700" />
              </div>
              <span className="text-xs font-bold text-slate-400">Paso {i + 1}</span>
            </div>
            <p className="text-sm font-bold text-slate-900">{t}</p>
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{d}</p>
          </div>
        ))}
      </div>

      {/* las 4 campañas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {CAMPANAS_PEYU.map((campana) => (
          <CampanaCard key={campana.key} campana={campana} />
        ))}
      </div>

      {/* nota sobre publicación automática */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-bold mb-1">¿Por qué CSV y no publicación 100% automática?</p>
          <p className="leading-relaxed text-amber-800 text-[13px]">
            El método CSV de Google Ads Editor es el estándar profesional que usan las agencias: te da control
            total para revisar la campaña antes de gastar presupuesto. Subir el CSV crea la campaña completa
            en segundos — solo le das play cuando estés conforme. (La publicación directa vía Google Ads API
            requiere conectar la cuenta con OAuth; si la quieres activar más adelante, lo conversamos.)
          </p>
        </div>
      </div>
    </div>
  );
}