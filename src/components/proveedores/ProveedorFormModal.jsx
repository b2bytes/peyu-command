import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { computeGlobalScore } from '@/lib/supplier-scorecard';

const CATEGORIAS = ['Material Reciclado','Packaging','Tintes / Pigmentos','Maquinaria','Servicios Externos','Logística','Marketing','Tecnología','Dropshipping','Otro'];
const ESTADOS = ['Activo','Inactivo','En Evaluación','En Onboarding','Bloqueado'];
const TIERS = ['Tier 1 - Estratégico','Tier 2 - Preferente','Tier 3 - Transaccional','Tier 4 - Backup'];
const RIESGOS = ['Bajo','Medio','Alto','Crítico'];
const MONEDAS = ['CLP','USD','EUR','CNY','BRL','ARS','PEN','MXN','GBP'];
const INCOTERMS = ['EXW','FCA','FOB','CIF','CFR','DAP','DDP','DPU','N/A'];
const DROP_PLATFORMS = ['Spocket','Syncee','CJdropshipping','AliExpress','Printful','Printify','Modalyst','Doba','Directo','N/A'];
const CERT_OPTIONS = ['ISO 9001','ISO 14001','ISO 45001','B Corp','FSC','GRS (Reciclado Global)','OEKO-TEX','Fair Trade','RoHS','REACH','CE','Otro'];

const TABS = [
  { id: 'general',    label: '📋 General' },
  { id: 'ubicacion',  label: '🌍 Ubicación' },
  { id: 'comercial',  label: '💼 Comercial' },
  { id: 'scorecard',  label: '📊 Scorecard' },
  { id: 'esg',        label: '♻️ ESG' },
  { id: 'dropship',   label: '📦 Dropshipping' },
];

const DEFAULTS = {
  nombre: '', categoria: 'Material Reciclado', estado: 'En Onboarding',
  tier: 'Tier 3 - Transaccional', riesgo_nivel: 'Medio', moneda: 'CLP',
  certificacion_reciclado: false, es_internacional: false, es_dropshipping: false,
  score_calidad: 70, score_entrega_otif: 70, score_precio: 70,
  score_servicio: 70, score_esg: 50, score_riesgo: 70,
};

export default function ProveedorFormModal({ open, onClose, proveedor, onSaved }) {
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState(DEFAULTS);

  useEffect(() => {
    if (proveedor) setForm({ ...DEFAULTS, ...proveedor });
    else setForm(DEFAULTS);
    setTab('general');
  }, [proveedor, open]);

  const up = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleCert = (c) => {
    const arr = form.certificaciones || [];
    up('certificaciones', arr.includes(c) ? arr.filter(x => x !== c) : [...arr, c]);
  };

  const handleSave = async () => {
    const score_global = computeGlobalScore(form);
    const payload = { ...form, score_global };
    if (proveedor?.id) await base44.entities.Proveedor.update(proveedor.id, payload);
    else await base44.entities.Proveedor.create(payload);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-5 pt-4 pb-2 flex-shrink-0">
          <DialogTitle className="font-poppins">
            {proveedor ? 'Editar' : 'Nuevo'} Proveedor — Perfil 360°
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="border-b border-border px-5 flex gap-1 overflow-x-auto flex-shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3" style={{ maxHeight: 'calc(92vh - 175px)' }}>
          {tab === 'general' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre *" value={form.nombre} onChange={v=>up('nombre',v)} />
                <Field label="Nombre comercial" value={form.nombre_comercial} onChange={v=>up('nombre_comercial',v)} />
                <Field label="RUT / Tax ID" value={form.rut} onChange={v=>up('rut',v)} />
                <Field label="Sitio web" value={form.sitio_web} onChange={v=>up('sitio_web',v)} placeholder="https://…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Categoría *" value={form.categoria} onChange={v=>up('categoria',v)} options={CATEGORIAS} />
                <SelectField label="Tier estratégico" value={form.tier} onChange={v=>up('tier',v)} options={TIERS} />
                <SelectField label="Estado" value={form.estado} onChange={v=>up('estado',v)} options={ESTADOS} />
                <Field label="Subcategoría" value={form.subcategoria} onChange={v=>up('subcategoria',v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contacto principal" value={form.contacto} onChange={v=>up('contacto',v)} />
                <Field label="Cargo" value={form.cargo_contacto} onChange={v=>up('cargo_contacto',v)} />
                <Field label="Email" type="email" value={form.email} onChange={v=>up('email',v)} />
                <Field label="Teléfono / WhatsApp" value={form.telefono} onChange={v=>up('telefono',v)} />
              </div>
              <Field label="Logo URL" value={form.logo_url} onChange={v=>up('logo_url',v)} placeholder="https://…/logo.png" />
              <TextArea label="Producto / Servicio" value={form.producto_servicio} onChange={v=>up('producto_servicio',v)} />
            </>
          )}

          {tab === 'ubicacion' && (
            <>
              <Checkbox label="Proveedor internacional" checked={form.es_internacional} onChange={v=>up('es_internacional',v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="País" value={form.pais} onChange={v=>up('pais',v)} placeholder="Chile, China, Alemania…" />
                <Field label="Código país (ISO 2)" value={form.pais_codigo} onChange={v=>up('pais_codigo',v.toUpperCase().slice(0,2))} placeholder="CL, CN, DE" maxLength={2} />
                <Field label="Ciudad" value={form.ciudad} onChange={v=>up('ciudad',v)} />
                <Field label="Dirección" value={form.direccion} onChange={v=>up('direccion',v)} />
                <Field label="Latitud" type="number" value={form.latitud} onChange={v=>up('latitud',+v)} placeholder="-33.45" />
                <Field label="Longitud" type="number" value={form.longitud} onChange={v=>up('longitud',+v)} placeholder="-70.66" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Moneda" value={form.moneda} onChange={v=>up('moneda',v)} options={MONEDAS} />
                <SelectField label="Incoterm" value={form.incoterm||'N/A'} onChange={v=>up('incoterm',v)} options={INCOTERMS} />
              </div>
            </>
          )}

          {tab === 'comercial' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Precio unitario (CLP)" type="number" value={form.precio_unitario_clp} onChange={v=>up('precio_unitario_clp',+v)} />
                <Field label="Unidad" value={form.unidad} onChange={v=>up('unidad',v)} placeholder="kg, u, m…" />
                <Field label="MOQ (pedido mínimo)" type="number" value={form.pedido_minimo} onChange={v=>up('pedido_minimo',+v)} />
                <Field label="Lead Time (días)" type="number" value={form.lead_time_dias} onChange={v=>up('lead_time_dias',+v)} />
                <Field label="Plazo pago (días)" type="number" value={form.pago_dias} onChange={v=>up('pago_dias',+v)} />
                <Field label="Gasto anual (CLP)" type="number" value={form.monto_anual_clp} onChange={v=>up('monto_anual_clp',+v)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="OTIF último Q (%)" type="number" value={form.otif_ultimo_trimestre_pct} onChange={v=>up('otif_ultimo_trimestre_pct',+v)} />
                <Field label="Defectos (PPM)" type="number" value={form.tasa_defectos_ppm} onChange={v=>up('tasa_defectos_ppm',+v)} />
                <Field label="NPS interno" type="number" value={form.nps_proveedor} onChange={v=>up('nps_proveedor',+v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Responsable interno" value={form.responsable_interno} onChange={v=>up('responsable_interno',v)} />
                <Field label="Fecha onboarding" type="date" value={form.fecha_onboarding} onChange={v=>up('fecha_onboarding',v)} />
              </div>
            </>
          )}

          {tab === 'scorecard' && (
            <>
              <p className="text-xs text-muted-foreground">Ajusta los scores base del proveedor. Para evaluaciones formales, usa la pestaña "Evaluaciones" del perfil 360°.</p>
              {[
                ['score_calidad','✅ Calidad (20%)','#0F8B6C'],
                ['score_entrega_otif','📦 OTIF (20%)','#0EA5E9'],
                ['score_precio','💰 Precio (15%)','#F59E0B'],
                ['score_servicio','🤝 Servicio (15%)','#8B5CF6'],
                ['score_esg','♻️ ESG (15%)','#10B981'],
                ['score_riesgo','🛡️ Riesgo bajo (15%)','#EC4899'],
              ].map(([k, label, color]) => (
                <div key={k}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium">{label}</label>
                    <span className="text-sm font-bold" style={{ color }}>{form[k]}</span>
                  </div>
                  <input type="range" min="0" max="100" value={form[k]||0} onChange={e=>up(k, +e.target.value)} className="w-full" style={{ accentColor: color }} />
                </div>
              ))}
              <div className="mt-2 p-2.5 bg-muted/30 rounded-xl flex items-center justify-between">
                <span className="text-sm font-semibold">Score Global Ponderado</span>
                <span className="font-poppins font-black text-2xl text-primary">{computeGlobalScore(form)}</span>
              </div>
            </>
          )}

          {tab === 'esg' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="% material reciclado" type="number" value={form.porcentaje_material_reciclado} onChange={v=>up('porcentaje_material_reciclado',+v)} />
                <Field label="Huella CO2 anual (kg)" type="number" value={form.huella_carbono_kg_co2_anual} onChange={v=>up('huella_carbono_kg_co2_anual',+v)} />
              </div>
              <Checkbox label="Certifica material reciclado (trazabilidad ESG)" checked={form.certificacion_reciclado} onChange={v=>up('certificacion_reciclado',v)} />
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Certificaciones</label>
                <div className="flex flex-wrap gap-1.5">
                  {CERT_OPTIONS.map(c => {
                    const active = (form.certificaciones || []).includes(c);
                    return (
                      <button
                        key={c} type="button" onClick={() => toggleCert(c)}
                        className={`text-[10px] px-2 py-1 rounded-full font-medium border transition-colors ${
                          active ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/40'
                        }`}
                      >{active ? '✓ ' : ''}{c}</button>
                    );
                  })}
                </div>
              </div>
              <SelectField label="Nivel de riesgo global" value={form.riesgo_nivel} onChange={v=>up('riesgo_nivel',v)} options={RIESGOS} />
              <TextArea label="Riesgo financiero" value={form.riesgo_financiero} onChange={v=>up('riesgo_financiero',v)} />
              <TextArea label="Riesgo operacional" value={form.riesgo_operacional} onChange={v=>up('riesgo_operacional',v)} />
              <TextArea label="Riesgo geopolítico" value={form.riesgo_geopolitico} onChange={v=>up('riesgo_geopolitico',v)} />
            </>
          )}

          {tab === 'dropship' && (
            <>
              <Checkbox label="Es proveedor dropshipping" checked={form.es_dropshipping} onChange={v=>up('es_dropshipping',v)} />
              {form.es_dropshipping && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField label="Plataforma" value={form.dropship_plataforma||'N/A'} onChange={v=>up('dropship_plataforma',v)} options={DROP_PLATFORMS} />
                    <Field label="Supplier ID (en plataforma)" value={form.dropship_supplier_id} onChange={v=>up('dropship_supplier_id',v)} />
                  </div>
                  <Field label="Margen objetivo (%)" type="number" value={form.dropship_margen_objetivo_pct} onChange={v=>up('dropship_margen_objetivo_pct',+v)} />
                </>
              )}
            </>
          )}

          <TextArea label="Notas internas" value={form.notas} onChange={v=>up('notas',v)} rows={2} />
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 bg-white flex gap-2 flex-shrink-0">
          <Button onClick={handleSave} disabled={!form.nombre} className="flex-1 text-white" style={{ background: '#0F8B6C' }}>Guardar proveedor</Button>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Inputs reusables ───
function Field({ label, value, onChange, type='text', placeholder, maxLength }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} className="mt-1" />
    </div>
  );
}
function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value||''} onValueChange={onChange}>
        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
function TextArea({ label, value, onChange, rows=2 }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <textarea value={value ?? ''} onChange={e=>onChange(e.target.value)} rows={rows} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none" />
    </div>
  );
}
function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)} className="w-4 h-4 accent-primary" />
      {label}
    </label>
  );
}