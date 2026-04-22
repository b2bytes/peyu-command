import { Edit2, Trash2, ExternalLink, MapPin, Truck, ShieldCheck } from 'lucide-react';
import { countryFlag, fmtClp, computeGlobalScore, scoreTier } from '@/lib/supplier-scorecard';
import { RiskPill, TierPill } from './ProveedorRiskBadge';

/**
 * Card de proveedor — diseño 2027, liquid-glass light, densidad alta.
 * Muestra score global, riesgo, tier, país y ratio CSR/ESG en un vistazo.
 */
export default function ProveedorCard2027({ prov, onEdit, onDelete, onOpen }) {
  const globalScore = prov.score_global ?? computeGlobalScore(prov);
  const tier = scoreTier(globalScore);

  return (
    <div
      className={`group relative bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-sm border transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer ${
        prov.estado === 'Bloqueado' ? 'border-red-200 opacity-70' :
        prov.riesgo_nivel === 'Crítico' ? 'border-red-300' :
        'border-border hover:border-primary/30'
      }`}
      onClick={() => onOpen?.(prov)}
    >
      {/* Score ring en la esquina */}
      {globalScore != null && (
        <div
          className="absolute -top-2 -right-2 w-12 h-12 rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg border-2 border-white"
          style={{ background: `linear-gradient(135deg, ${tier.color} 0%, ${tier.color}cc 100%)` }}
        >
          <span className="text-[10px] leading-none opacity-80">Score</span>
          <span className="text-base font-black leading-none mt-0.5">{globalScore}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3 pr-10">
        {prov.logo_url ? (
          <img src={prov.logo_url} alt={prov.nombre} className="w-10 h-10 rounded-lg object-cover border border-border" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-50 to-cyan-50 border border-border flex items-center justify-center text-lg">
            {countryFlag(prov.pais_codigo)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-poppins font-semibold text-sm truncate">{prov.nombre}</p>
            {prov.es_dropshipping && <Truck className="w-3 h-3 text-violet-500" title="Dropshipping" />}
            {prov.certificacion_reciclado && <ShieldCheck className="w-3 h-3 text-emerald-500" title="Cert. reciclado" />}
          </div>
          {(prov.ciudad || prov.pais) && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />
              {[prov.ciudad, prov.pais].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-1 mb-3">
        <TierPill tier={prov.tier} />
        <RiskPill nivel={prov.riesgo_nivel} />
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
          prov.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' :
          prov.estado === 'Bloqueado' ? 'bg-red-100 text-red-600' :
          prov.estado === 'En Onboarding' ? 'bg-amber-100 text-amber-700' :
          'bg-gray-100 text-gray-500'
        }`}>{prov.estado}</span>
      </div>

      {/* Métricas compactas */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <Metric label="Lead" value={prov.lead_time_dias ? `${prov.lead_time_dias}d` : '—'} />
        <Metric label="OTIF" value={prov.otif_ultimo_trimestre_pct ? `${prov.otif_ultimo_trimestre_pct}%` : '—'} highlight={prov.otif_ultimo_trimestre_pct >= 95} />
        <Metric label="Pago" value={prov.pago_dias ? `${prov.pago_dias}d` : '—'} />
        <Metric label="Gasto" value={fmtClp(prov.monto_anual_clp)} color="#0F8B6C" />
      </div>

      {/* Producto/servicio */}
      {prov.producto_servicio && (
        <p className="text-[11px] text-muted-foreground mt-2.5 italic line-clamp-1">"{prov.producto_servicio}"</p>
      )}

      {/* Actions */}
      <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
        <div className="flex gap-1">
          <button onClick={(e)=>{e.stopPropagation(); onEdit?.(prov);}} className="p-1.5 hover:bg-muted rounded-lg">
            <Edit2 className="w-3 h-3 text-muted-foreground" />
          </button>
          <button onClick={(e)=>{e.stopPropagation(); onDelete?.(prov.id);}} className="p-1.5 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
          {prov.sitio_web && (
            <a
              href={prov.sitio_web}
              target="_blank"
              rel="noreferrer"
              onClick={(e)=>e.stopPropagation()}
              className="p-1.5 hover:bg-muted rounded-lg"
              title="Sitio web"
            >
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          )}
        </div>
        <span className="text-[10px] font-semibold text-primary group-hover:underline">
          Ver perfil 360° →
        </span>
      </div>
    </div>
  );
}

function Metric({ label, value, color, highlight }) {
  return (
    <div className={`rounded-lg p-1.5 ${highlight ? 'bg-emerald-50' : 'bg-muted/30'}`}>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-semibold">{label}</p>
      <p className="font-bold text-xs mt-0.5" style={color ? { color } : undefined}>{value}</p>
    </div>
  );
}