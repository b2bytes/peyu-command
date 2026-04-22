import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, MapPin, Phone, Mail, Globe, Truck, FileText, TrendingUp, Award, AlertTriangle, Calendar } from 'lucide-react';
import ScorecardRadar from './ScorecardRadar';
import { RiskPill, TierPill } from './ProveedorRiskBadge';
import ProveedorDocuments from './ProveedorDocuments';
import EvaluationHistory from './EvaluationHistory';
import { countryFlag, fmtClp, computeGlobalScore, scoreTier, SCORECARD_DIMENSIONS } from '@/lib/supplier-scorecard';

/**
 * Perfil 360° del proveedor. Drawer lateral con tabs:
 *  - Overview (scorecard radar + metrics)
 *  - Evaluaciones (historial)
 *  - Documentos (contratos, certificados)
 *  - Riesgo / ESG
 */
export default function ProveedorProfileDrawer({ proveedor, open, onClose, onEdit }) {
  const [tab, setTab] = useState('overview');
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!proveedor?.id || !open) return;
    setLoading(true);
    Promise.all([
      base44.entities.ProveedorEvaluacion.filter({ proveedor_id: proveedor.id }, '-fecha_evaluacion', 20),
      base44.entities.ProveedorDocumento.filter({ proveedor_id: proveedor.id }, '-created_date', 50),
    ]).then(([ev, docs]) => {
      setEvaluaciones(ev);
      setDocumentos(docs);
    }).finally(() => setLoading(false));
  }, [proveedor?.id, open]);

  if (!proveedor) return null;
  const globalScore = proveedor.score_global ?? computeGlobalScore(proveedor);
  const tier = scoreTier(globalScore);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden p-0 gap-0">
        {/* HERO — liquid-glass con gradient por score */}
        <div
          className="relative p-5 text-white"
          style={{
            background: `linear-gradient(135deg, ${tier.color} 0%, ${tier.color}dd 50%, #0F8B6C 100%)`,
          }}
        >
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center backdrop-blur-sm">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            {proveedor.logo_url ? (
              <img src={proveedor.logo_url} alt={proveedor.nombre} className="w-16 h-16 rounded-xl object-cover border-2 border-white/40" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-3xl">
                {countryFlag(proveedor.pais_codigo)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-poppins font-black text-2xl leading-tight">{proveedor.nombre}</h2>
              {proveedor.nombre_comercial && <p className="text-white/80 text-sm">{proveedor.nombre_comercial}</p>}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <TierPill tier={proveedor.tier} />
                <RiskPill nivel={proveedor.riesgo_nivel} />
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white/25 backdrop-blur-sm text-white">{proveedor.estado}</span>
                {proveedor.es_dropshipping && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-violet-500/40 text-white flex items-center gap-1">
                    <Truck className="w-2.5 h-2.5" />{proveedor.dropship_plataforma}
                  </span>
                )}
              </div>
            </div>
            {globalScore != null && (
              <div className="flex flex-col items-center bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 border border-white/40 flex-shrink-0">
                <span className="text-[9px] uppercase tracking-wide font-semibold opacity-80">Score 360°</span>
                <span className="font-poppins font-black text-3xl leading-none">{globalScore}</span>
                <span className="text-[10px] font-bold mt-0.5">{tier.label}</span>
              </div>
            )}
          </div>

          {/* Contactos rápidos */}
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            {proveedor.email && (
              <a href={`mailto:${proveedor.email}`} className="flex items-center gap-1 text-white/90 hover:text-white">
                <Mail className="w-3 h-3" />{proveedor.email}
              </a>
            )}
            {proveedor.telefono && (
              <a href={`https://wa.me/${proveedor.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-white/90 hover:text-white">
                <Phone className="w-3 h-3" />{proveedor.telefono}
              </a>
            )}
            {proveedor.sitio_web && (
              <a href={proveedor.sitio_web} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-white/90 hover:text-white">
                <Globe className="w-3 h-3" />{proveedor.sitio_web.replace(/^https?:\/\//, '')}
              </a>
            )}
            {(proveedor.ciudad || proveedor.pais) && (
              <span className="flex items-center gap-1 text-white/90">
                <MapPin className="w-3 h-3" />{[proveedor.ciudad, proveedor.pais].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="border-b border-border px-4 flex gap-1 bg-white flex-shrink-0">
          {[
            { id: 'overview',     label: 'Perfil 360°', icon: TrendingUp },
            { id: 'evaluaciones', label: 'Evaluaciones', icon: Award },
            { id: 'documentos',   label: 'Documentos',   icon: FileText },
            { id: 'riesgo',       label: 'Riesgo / ESG', icon: AlertTriangle },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />{t.label}
              </button>
            );
          })}
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto flex-1 p-5 bg-muted/20" style={{ maxHeight: 'calc(92vh - 230px)' }}>
          {tab === 'overview' && <OverviewTab proveedor={proveedor} evaluaciones={evaluaciones} />}
          {tab === 'evaluaciones' && <EvaluationHistory proveedor={proveedor} evaluaciones={evaluaciones} onReload={() => setTab('evaluaciones')} />}
          {tab === 'documentos' && <ProveedorDocuments proveedor={proveedor} documentos={documentos} onReload={() => setTab('documentos')} />}
          {tab === 'riesgo' && <RiesgoESGTab proveedor={proveedor} />}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5 bg-white flex justify-end gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={() => onEdit?.(proveedor)} style={{ background: '#0F8B6C' }} className="text-white">Editar perfil</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ───────── SUB-TABS ─────────

function OverviewTab({ proveedor, evaluaciones }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Radar */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
        <h3 className="font-poppins font-semibold text-sm mb-2">Scorecard 360°</h3>
        <ScorecardRadar data={proveedor} size="md" />
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
        <h3 className="font-poppins font-semibold text-sm mb-3">Desglose dimensiones</h3>
        <div className="space-y-2.5">
          {SCORECARD_DIMENSIONS.map(dim => {
            const v = Number(proveedor[dim.key]) || 0;
            return (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <span>{dim.icon}</span>{dim.label}
                    <span className="text-[9px] text-muted-foreground">({Math.round(dim.peso*100)}%)</span>
                  </span>
                  <span className="text-xs font-bold" style={{ color: dim.color }}>{v}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${v}%`, background: dim.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comerciales */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm md:col-span-2">
        <h3 className="font-poppins font-semibold text-sm mb-3">Condiciones comerciales</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <Kpi label="Lead Time" value={proveedor.lead_time_dias ? `${proveedor.lead_time_dias} días` : '—'} />
          <Kpi label="Plazo pago" value={proveedor.pago_dias ? `${proveedor.pago_dias} días` : '—'} />
          <Kpi label="MOQ" value={proveedor.pedido_minimo ? `${proveedor.pedido_minimo} u.` : '—'} />
          <Kpi label="Moneda" value={proveedor.moneda || 'CLP'} />
          <Kpi label="Incoterm" value={proveedor.incoterm || '—'} />
          <Kpi label="OTIF Q-1" value={proveedor.otif_ultimo_trimestre_pct ? `${proveedor.otif_ultimo_trimestre_pct}%` : '—'} highlight={proveedor.otif_ultimo_trimestre_pct >= 95} />
          <Kpi label="Gasto anual" value={fmtClp(proveedor.monto_anual_clp)} color="#0F8B6C" />
          <Kpi label="Evaluaciones" value={evaluaciones.length} />
        </div>
      </div>

      {proveedor.notas && (
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm md:col-span-2">
          <h3 className="font-poppins font-semibold text-sm mb-2">Notas internas</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{proveedor.notas}</p>
        </div>
      )}
    </div>
  );
}

function RiesgoESGTab({ proveedor }) {
  const certs = proveedor.certificaciones || [];
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
        <h3 className="font-poppins font-semibold text-sm mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />Matriz de riesgo
        </h3>
        <RiskRow label="Financiero"  desc={proveedor.riesgo_financiero} />
        <RiskRow label="Operacional" desc={proveedor.riesgo_operacional} />
        <RiskRow label="Geopolítico" desc={proveedor.riesgo_geopolitico} />
        <div className="mt-3 pt-3 border-t border-border">
          <RiskPill nivel={proveedor.riesgo_nivel} />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
        <h3 className="font-poppins font-semibold text-sm mb-3 flex items-center gap-2">
          <span>♻️</span>Perfil ESG
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <Kpi label="Score ESG" value={proveedor.score_esg ?? '—'} color="#10B981" />
          <Kpi label="% reciclado" value={proveedor.porcentaje_material_reciclado ? `${proveedor.porcentaje_material_reciclado}%` : '—'} />
          <Kpi label="Huella CO2" value={proveedor.huella_carbono_kg_co2_anual ? `${proveedor.huella_carbono_kg_co2_anual} kg` : '—'} />
          <Kpi label="Cert. reciclado" value={proveedor.certificacion_reciclado ? 'Sí' : 'No'} />
        </div>
        {certs.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Certificaciones</p>
            <div className="flex flex-wrap gap-1">
              {certs.map(c => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                  ✓ {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RiskRow({ label, desc }) {
  return (
    <div className="mb-2 pb-2 border-b border-border last:border-0">
      <p className="text-xs font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc || 'Sin notas'}</p>
    </div>
  );
}

function Kpi({ label, value, color, highlight }) {
  return (
    <div className={`rounded-xl p-2.5 ${highlight ? 'bg-emerald-50' : 'bg-muted/30'}`}>
      <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">{label}</p>
      <p className="font-poppins font-bold text-sm mt-0.5" style={color ? { color } : undefined}>{value}</p>
    </div>
  );
}