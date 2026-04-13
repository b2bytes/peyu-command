import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calculator, Download, Send, Plus, Trash2, Zap, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DESCUENTOS = [
  { label: '1-49 unidades', min: 1, max: 49, pct: 0 },
  { label: '50-199 unidades', min: 50, max: 199, pct: 10 },
  { label: '200-499 unidades', min: 200, max: 499, pct: 15 },
  { label: '500+ unidades', min: 500, max: Infinity, pct: 22 },
];

const FEE_PERSONALIZACION_BAJO_MOQ = 30000;
const FEE_PACKAGING_PCT = 3;
const RECARGO_EXPRESS = 12;

function getDescuento(qty) {
  const tier = DESCUENTOS.find(d => qty >= d.min && qty <= d.max);
  return tier ? tier.pct : 0;
}

function LineaItem({ index, productos, linea, onChange, onRemove }) {
  const prod = productos.find(p => p.id === linea.producto_id);
  const precio_base = prod?.precio_base_b2b || 0;
  const desc_pct = getDescuento(linea.cantidad || 0);
  const precio_con_desc = precio_base * (1 - desc_pct / 100);
  const sub_productos = precio_con_desc * (linea.cantidad || 0);
  const fee_pers = linea.personalizacion && (linea.cantidad || 0) < (prod?.moq_personalizacion || 10) ? FEE_PERSONALIZACION_BAJO_MOQ : 0;
  const lead = linea.personalizacion ? (prod?.lead_time_con_personal || 7) : (prod?.lead_time_sin_personal || 5);

  return (
    <div className="bg-white rounded-xl p-4 border border-border space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase">Línea {index + 1}</span>
        <button onClick={onRemove} className="p-1 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Producto</label>
          <Select value={linea.producto_id || ''} onValueChange={v => onChange({ ...linea, producto_id: v })}>
            <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              {productos.filter(p => p.canal !== 'B2C Exclusivo').map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nombre} ({p.sku})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Cantidad (u)</label>
          <Input type="number" value={linea.cantidad || ''} onChange={e => onChange({ ...linea, cantidad: +e.target.value })} className="mt-1" />
        </div>
      </div>

      {prod && (
        <>
          <div className="flex gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={linea.personalizacion || false} onChange={e => onChange({ ...linea, personalizacion: e.target.checked })} className="rounded" />
              <span>Personalización Láser</span>
              {linea.personalizacion && (linea.cantidad || 0) >= (prod?.personalizacion_gratis_desde || 10) && (
                <span className="text-green-600 font-medium">✓ GRATIS</span>
              )}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={linea.packaging || false} onChange={e => onChange({ ...linea, packaging: e.target.checked })} className="rounded" />
              <span>Packaging personalizado (+{FEE_PACKAGING_PCT}%)</span>
            </label>
          </div>

          <div className="p-3 rounded-xl text-xs space-y-1.5" style={{ background: '#f8f8f8' }}>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio base B2B</span>
              <span>${precio_base.toLocaleString('es-CL')}/u</span>
            </div>
            {desc_pct > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento volumen ({DESCUENTOS.find(d => (linea.cantidad||0) >= d.min && (linea.cantidad||0) <= d.max)?.label})</span>
                <span>-{desc_pct}%</span>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Precio con descuento</span>
              <span>${Math.round(precio_con_desc).toLocaleString('es-CL')}/u</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1.5 font-semibold">
              <span>Subtotal productos</span>
              <span style={{ color: '#0F8B6C' }}>${Math.round(sub_productos).toLocaleString('es-CL')}</span>
            </div>
            {fee_pers > 0 && <div className="flex justify-between text-amber-600"><span>Fee personalización (MOQ {'<'}{prod?.moq_personalizacion}u)</span><span>+${fee_pers.toLocaleString('es-CL')}</span></div>}
            {linea.packaging && <div className="flex justify-between text-muted-foreground"><span>Fee packaging ({FEE_PACKAGING_PCT}%)</span><span>+${Math.round(sub_productos * FEE_PACKAGING_PCT / 100).toLocaleString('es-CL')}</span></div>}
            <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-gray-200">
              <span>Lead time estimado</span>
              <span className="font-medium">{lead} días hábiles</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function CPQCalculator() {
  const [productos, setProductos] = useState([]);
  const [empresa, setEmpresa] = useState('');
  const [contacto, setContacto] = useState('');
  const [lineas, setLineas] = useState([{ producto_id: '', cantidad: 0, personalizacion: true, packaging: false }]);
  const [esExpress, setEsExpress] = useState(false);
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState('');
  const [generandoProp, setGenerandoProp] = useState(false);
  const [propResult, setPropResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true }, 'nombre', 200).then(setProductos).catch(() =>
      base44.entities.Producto.list('nombre', 200).then(setProductos)
    );
  }, []);

  const calcLinea = (linea) => {
    const prod = productos.find(p => p.id === linea.producto_id);
    if (!prod || !linea.cantidad) return { sub: 0, fee_pers: 0, fee_pack: 0, lead: 0 };
    const desc_pct = getDescuento(linea.cantidad);
    const precio_desc = (prod.precio_base_b2b || 0) * (1 - desc_pct / 100);
    const sub = precio_desc * linea.cantidad;
    const fee_pers = linea.personalizacion && linea.cantidad < (prod.moq_personalizacion || 10) ? FEE_PERSONALIZACION_BAJO_MOQ : 0;
    const fee_pack = linea.packaging ? sub * FEE_PACKAGING_PCT / 100 : 0;
    const lead = linea.personalizacion ? (prod.lead_time_con_personal || 7) : (prod.lead_time_sin_personal || 5);
    return { sub, fee_pers, fee_pack, lead };
  };

  const totales = lineas.reduce((acc, l) => {
    const { sub, fee_pers, fee_pack, lead } = calcLinea(l);
    return { subtotal: acc.subtotal + sub, fees: acc.fees + fee_pers + fee_pack, lead: Math.max(acc.lead, lead) };
  }, { subtotal: 0, fees: 0, lead: 0 });

  const recargo_express = esExpress ? totales.subtotal * RECARGO_EXPRESS / 100 : 0;
  const total = totales.subtotal + totales.fees + recargo_express;

  const handleGenerarPropuesta = async () => {
    if (!empresa || !contacto || !email) return;
    setGenerandoProp(true);
    // Create lead first
    const lead = await base44.entities.B2BLead.create({
      contact_name: contacto,
      company_name: empresa,
      email,
      source: 'Formulario Web',
      status: 'En revisión',
      product_interest: lineas.map(l => productos.find(p => p.id === l.producto_id)?.nombre).filter(Boolean).join(', '),
      qty_estimate: lineas.reduce((s, l) => s + (l.cantidad || 0), 0),
      personalization_needs: lineas.some(l => l.personalizacion),
    });
    const items = lineas.filter(l => l.producto_id && l.cantidad > 0).map(l => {
      const prod = productos.find(p => p.id === l.producto_id);
      return { nombre: prod?.nombre || '', qty: l.cantidad, precio_base: prod?.precio_base_b2b || 9990, personalizacion: l.personalizacion };
    });
    const res = await base44.functions.invoke('createCorporateProposal', { leadId: lead.id, items });
    setPropResult(res.data);
    setGenerandoProp(false);
  };

  const copyPropUrl = () => {
    const url = `${window.location.origin}/b2b/propuesta?id=${propResult.proposal_id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGuardar = async () => {
    const linea0 = lineas[0];
    const prod0 = productos.find(p => p.id === linea0?.producto_id);
    await base44.entities.Cotizacion.create({
      empresa,
      contacto,
      sku: prod0?.nombre || 'Múltiples productos',
      cantidad: lineas.reduce((s, l) => s + (l.cantidad || 0), 0),
      precio_unitario: prod0?.precio_base_b2b || 0,
      descuento_pct: prod0 ? getDescuento(linea0?.cantidad || 0) : 0,
      fee_personalizacion: totales.fees,
      total: Math.round(total),
      personalizacion_tipo: 'Láser UV',
      lead_time_dias: totales.lead + (esExpress ? 0 : 0),
      estado: 'Borrador',
      es_express: esExpress,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-foreground">CPQ — Calculadora de Cotización</h1>
        <p className="text-muted-foreground text-sm mt-1">Precios con descuentos automáticos por volumen • Blueprint Peyu</p>
      </div>

      {/* Tabla de descuentos */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
        <h3 className="font-poppins font-semibold text-sm text-foreground mb-3">Estructura de Descuentos por Volumen</h3>
        <div className="grid grid-cols-4 gap-2">
          {DESCUENTOS.map((d, i) => (
            <div key={i} className="text-center p-3 rounded-xl" style={{ background: i === 0 ? '#f5f5f5' : i === 1 ? '#f0faf7' : i === 2 ? '#e6f7f2' : '#d0f0e8' }}>
              <p className="text-xs text-muted-foreground">{d.label}</p>
              <p className="font-poppins font-bold text-lg mt-1" style={{ color: d.pct > 0 ? '#0F8B6C' : '#4B4F54' }}>
                {d.pct > 0 ? `-${d.pct}%` : 'Precio base'}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          ✓ Personalización láser <strong>GRATIS desde 10 unidades</strong> • Packaging personalizado +3% • Express (≤7 días) +12%
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: formulario */}
        <div className="lg:col-span-2 space-y-4">
          {/* Datos empresa */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
            <h3 className="font-poppins font-semibold text-sm text-foreground mb-3">Datos del Cliente</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Empresa</label><Input value={empresa} onChange={e => setEmpresa(e.target.value)} className="mt-1" placeholder="Nombre empresa" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Contacto</label><Input value={contacto} onChange={e => setContacto(e.target.value)} className="mt-1" placeholder="Nombre contacto" /></div>
              <div className="col-span-2"><label className="text-xs font-medium text-muted-foreground">Email cliente</label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1" placeholder="correo@empresa.cl" /></div>
            </div>
          </div>

          {/* Líneas */}
          <div className="space-y-3">
            {lineas.map((l, i) => (
              <LineaItem key={i} index={i} productos={productos} linea={l}
                onChange={updated => setLineas(lineas.map((x, j) => j === i ? updated : x))}
                onRemove={() => setLineas(lineas.filter((_, j) => j !== i))}
              />
            ))}
            <Button variant="outline" onClick={() => setLineas([...lineas, { producto_id: '', cantidad: 0, personalizacion: true, packaging: false }])}
              className="w-full gap-2 border-dashed">
              <Plus className="w-4 h-4" />Agregar línea
            </Button>
          </div>

          {/* Opciones */}
          <div className="bg-white rounded-xl p-4 border border-border">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={esExpress} onChange={e => setEsExpress(e.target.checked)} className="rounded" />
              <div>
                <span className="text-sm font-medium text-foreground">Pedido Express (+{RECARGO_EXPRESS}%)</span>
                <p className="text-xs text-muted-foreground">Prioridad máxima en producción • Entrega ≤7 días hábiles</p>
              </div>
              {esExpress && <span className="ml-auto text-xs font-medium text-amber-600">+${Math.round(recargo_express).toLocaleString('es-CL')}</span>}
            </label>
          </div>
        </div>

        {/* Right: resumen */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-border sticky top-6">
            <h3 className="font-poppins font-semibold text-foreground mb-4">Resumen Cotización</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal productos</span>
                <span className="font-medium">${Math.round(totales.subtotal).toLocaleString('es-CL')}</span>
              </div>
              {totales.fees > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Fees (pers. + packaging)</span>
                  <span>+${Math.round(totales.fees).toLocaleString('es-CL')}</span>
                </div>
              )}
              {recargo_express > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Recargo express (+{RECARGO_EXPRESS}%)</span>
                  <span>+${Math.round(recargo_express).toLocaleString('es-CL')}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between items-end">
                  <span className="font-semibold text-foreground">TOTAL</span>
                  <div className="text-right">
                    <p className="font-poppins font-bold text-2xl" style={{ color: '#0F8B6C' }}>
                      ${Math.round(total).toLocaleString('es-CL')}
                    </p>
                    <p className="text-xs text-muted-foreground">CLP (incl. IVA)</p>
                  </div>
                </div>
              </div>
            </div>

            {totales.lead > 0 && (
              <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: '#f0faf7' }}>
                <p className="font-medium" style={{ color: '#0F8B6C' }}>Lead time estimado</p>
                <p className="text-muted-foreground mt-0.5">{totales.lead} días hábiles</p>
                <p className="text-muted-foreground">+ Anticipo 50% requerido</p>
              </div>
            )}

            <div className="mt-4 space-y-2">
              {propResult ? (
                <div className="space-y-2">
                  <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                    <div className="text-green-700 font-semibold text-sm flex items-center gap-1.5 mb-1"><Check className="w-4 h-4" /> Propuesta #{propResult.numero}</div>
                    <div className="text-xs text-green-700">Total: ${propResult.total?.toLocaleString('es-CL')} · {propResult.lead_time_dias} días</div>
                  </div>
                  <Button onClick={copyPropUrl} variant="outline" size="sm" className="w-full gap-2">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Link copiado' : 'Copiar link cliente'}
                  </Button>
                  <a href={`/b2b/propuesta?id=${propResult.proposal_id}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="w-full gap-2 text-xs">
                      <ExternalLink className="w-3 h-3" /> Ver propuesta
                    </Button>
                  </a>
                </div>
              ) : (
                <Button
                  onClick={handleGenerarPropuesta}
                  disabled={!empresa || !contacto || !email || total === 0 || generandoProp}
                  className="w-full text-white gap-2"
                  style={{ background: '#006D5B' }}
                >
                  <Zap className="w-4 h-4" />
                  {generandoProp ? 'Generando con IA...' : 'Generar Propuesta B2B automática'}
                </Button>
              )}
              <Button onClick={handleGuardar} disabled={!empresa || total === 0} variant="outline"
                className="w-full gap-2">
                <Send className="w-4 h-4" />
                {saved ? '✓ Guardada en Cotizaciones' : 'Guardar como Cotización'}
              </Button>
            </div>

            {/* SLA reminder */}
            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Recordatorios SLA</p>
              <p>• Respuesta cotización: <strong>&lt;24h</strong></p>
              <p>• Follow-up sin respuesta: <strong>48h</strong></p>
              <p>• Muestra corporativa: <strong>7 días</strong></p>
              <p>• Pago: <strong>50% anticipo</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}