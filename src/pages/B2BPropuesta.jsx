import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, FileText, Clock, Package, MessageCircle, Recycle, Download, Sparkles, Shield, Truck, Building2, Calendar, Hash } from 'lucide-react';
import SEO from '@/components/SEO';

export default function B2BPropuesta() {
  const urlParams = new URLSearchParams(window.location.search);
  const proposalId = urlParams.get('id');

  const [propuesta, setPropuesta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accion, setAccion] = useState(null);
  const [done, setDone] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!proposalId) { setLoading(false); return; }
    base44.entities.CorporateProposal.filter({ id: proposalId })
      .then(list => { if (list?.length > 0) setPropuesta(list[0]); })
      .finally(() => setLoading(false));
  }, [proposalId]);

  const handleAccion = async (tipo) => {
    setAccion(tipo === 'aceptar' ? 'aceptando' : 'rechazando');
    await base44.entities.CorporateProposal.update(proposalId, {
      status: tipo === 'aceptar' ? 'Aceptada' : 'Rechazada',
    });
    setDone(tipo === 'aceptar' ? 'aceptada' : 'rechazada');
    setAccion(null);
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await base44.functions.invoke('generateProposalPDF', { proposalId });
      const { pdf_base64, filename } = res.data;
      const byteChars = atob(pdf_base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `PEYU-Propuesta-${propuesta?.numero || ''}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('No se pudo generar el PDF. Intenta nuevamente o contáctanos por WhatsApp.');
    }
    setDownloadingPdf(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!proposalId || !propuesta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] font-inter p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-6xl">🔍</div>
          <h2 className="text-2xl font-poppins font-bold text-gray-900">Propuesta no encontrada</h2>
          <p className="text-gray-500 text-sm">Verifica el enlace o contáctanos por WhatsApp.</p>
          <a href="https://wa.me/56935040242" target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 mt-4 rounded-xl w-full font-semibold bg-green-500 hover:bg-green-600 text-white">
              <MessageCircle className="w-4 h-4" /> WhatsApp Peyu
            </Button>
          </a>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] font-inter p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-xl ${done === 'aceptada' ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-red-400 to-red-500'}`}>
            {done === 'aceptada'
              ? <CheckCircle className="w-12 h-12 text-white" />
              : <XCircle className="w-12 h-12 text-white" />
            }
          </div>
          <h2 className="text-3xl font-poppins font-bold text-gray-900">
            {done === 'aceptada' ? '¡Propuesta aceptada!' : 'Propuesta rechazada'}
          </h2>
          {done === 'aceptada' ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 text-sm text-left space-y-4 shadow-sm">
              <p className="text-gray-600 leading-relaxed font-medium">El equipo de Peyu fue notificado. Carlos te contactará en los próximos minutos para coordinar el anticipo y el brief de producción.</p>
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-teal-800 text-xs space-y-2">
                <p className="font-bold text-sm">Próximos pasos:</p>
                <ol className="space-y-1.5 ml-2">
                  <li>✓ Anticipo del {propuesta.anticipo_pct || 50}% para iniciar producción</li>
                  <li>✓ Validación final del archivo de logo</li>
                  <li>✓ Producción en {propuesta.lead_time_dias || 7} días hábiles</li>
                  <li>✓ Despacho a la dirección indicada</li>
                </ol>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Entendemos. Si quieres ajustar la propuesta, escríbenos y buscamos una solución.</p>
          )}
          <a href="https://wa.me/56935040242" target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 w-full rounded-xl font-semibold h-12 bg-green-500 hover:bg-green-600 text-white">
              <MessageCircle className="w-4 h-4" /> Hablar con Carlos
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const items = (() => { try { return propuesta.items_json ? JSON.parse(propuesta.items_json) : []; } catch { return []; } })();
  const yaRespondida = ['Aceptada', 'Rechazada', 'Vencida'].includes(propuesta.status);
  const descuento = propuesta.descuento_pct > 0 ? Math.round((propuesta.subtotal || 0) * propuesta.descuento_pct / 100) : 0;

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">
      <SEO
        title={`Propuesta Comercial${propuesta?.numero ? ' ' + propuesta.numero : ''} · ${propuesta?.empresa || 'PEYU Chile'}`}
        description="Propuesta comercial PEYU con detalle de productos, mockups, condiciones y términos."
        canonical={`https://peyuchile.cl/b2b/propuesta?id=${proposalId || ''}`}
        noindex
      />
      {/* NAVBAR */}
      <nav className="bg-white/95 backdrop-blur-xl border-b border-black/5 shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <div>
              <p className="text-sm font-poppins font-bold text-gray-900 leading-none">PEYU Chile</p>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">Propuesta Comercial</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {propuesta.numero && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-gray-500 font-mono bg-gray-100 px-2.5 py-1.5 rounded-lg">
                <Hash className="w-3 h-3" />{propuesta.numero}
              </span>
            )}
            <Button onClick={handleDownloadPdf} disabled={downloadingPdf}
              size="sm" className="gap-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold">
              <Download className="w-3.5 h-3.5" />
              {downloadingPdf ? 'Generando...' : 'PDF'}
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* STATUS BANNER */}
        {yaRespondida && (
          <div className={`rounded-2xl px-5 py-4 flex items-center gap-3 border-2 font-medium text-sm ${propuesta.status === 'Aceptada' ? 'bg-green-50 text-green-800 border-green-200' : propuesta.status === 'Rechazada' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>
            {propuesta.status === 'Aceptada' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <Clock className="w-5 h-5 flex-shrink-0" />}
            <span>Esta propuesta ya fue {propuesta.status.toLowerCase()}.</span>
          </div>
        )}

        {/* HERO CARD — Premium proposal style */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-32 h-32 bg-teal-500/20 rounded-br-full blur-2xl" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-tl-full blur-3xl" />

          <div className="relative p-7 md:p-10 text-white">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-teal-300 font-bold mb-2">Propuesta Comercial</p>
                <h1 className="text-3xl md:text-4xl font-poppins font-bold leading-tight">
                  Preparada para<br/>
                  <span className="text-cyan-300">{propuesta.empresa}</span>
                </h1>
                <p className="text-white/60 text-sm mt-3">
                  Hola {propuesta.contacto}, aquí está tu propuesta personalizada con regalos corporativos 100% reciclados.
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-teal-500/20 border border-teal-400/30 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold text-teal-200">
                <Sparkles className="w-3.5 h-3.5" /> Propuesta N° {propuesta.numero || '—'}
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total', value: `$${(propuesta.total || 0).toLocaleString('es-CL')}`, sub: 'CLP · IVA incl.', accent: true },
                { label: 'Lead Time', value: `${propuesta.lead_time_dias || 7}`, sub: 'días hábiles', icon: Clock },
                { label: 'Validez', value: `${propuesta.validity_days || 15}`, sub: 'días corridos', icon: Calendar },
                { label: 'Anticipo', value: `${propuesta.anticipo_pct || 50}%`, sub: 'para iniciar', icon: Building2 },
              ].map((m, i) => (
                <div key={i} className={`rounded-2xl p-4 backdrop-blur-sm border ${m.accent ? 'bg-gradient-to-br from-teal-400/30 to-cyan-400/20 border-teal-400/50' : 'bg-white/5 border-white/15'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {m.icon && <m.icon className="w-3 h-3 text-white/50" />}
                    <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold">{m.label}</p>
                  </div>
                  <p className={`font-poppins font-bold leading-tight ${m.accent ? 'text-2xl text-white' : 'text-xl text-white'}`}>{m.value}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{m.sub}</p>
                </div>
              ))}
            </div>

            {propuesta.fecha_vencimiento && (
              <p className="text-[11px] text-white/40 mt-5 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Esta propuesta vence el <span className="font-semibold text-white/70">{propuesta.fecha_vencimiento}</span>
              </p>
            )}
          </div>
        </div>

        {/* MOCKUPS + ESG */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-poppins font-bold text-gray-900 text-sm">Vista previa con tu logo</h3>
                <p className="text-[10px] text-gray-500">Mockup generado con grabado láser UV simulado</p>
              </div>
            </div>
            {propuesta.mockup_urls?.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {propuesta.mockup_urls.slice(0, 4).map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group">
                    <img src={url} alt={`Mockup ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-xl border border-gray-100 group-hover:border-teal-400 group-hover:shadow-lg transition-all" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="aspect-[2/1] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center border border-dashed border-gray-200">
                <div className="text-center">
                  <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Los mockups se generan al confirmar el brief</p>
                </div>
              </div>
            )}
            <p className="text-[10px] text-gray-400 italic leading-relaxed">Los mockups son referenciales. El grabado final puede variar levemente según ángulo y acabado del material.</p>
          </div>

          <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg space-y-3 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Recycle className="w-5 h-5" />
                <h3 className="font-poppins font-bold text-sm">Impacto ESG</h3>
              </div>
              <p className="text-white/80 text-xs leading-relaxed mb-4">
                Cada unidad de este pedido rescata plástico post-consumo del circuito de residuos y lo transforma en un producto de alta durabilidad.
              </p>
              <ul className="space-y-2 text-xs">
                {[
                  ['♻️', 'Plástico 100% reciclado post-consumo'],
                  ['🏭', 'Fabricación local en Santiago, Chile'],
                  ['🔋', 'Proceso con energía renovable'],
                  ['🛡️', 'Garantía de 10 años'],
                ].map(([e, l], i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span>{e}</span>
                    <span className="text-white/90">{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* DETALLE TÉCNICO-ECONÓMICO */}
        {items.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-poppins font-bold text-gray-900 flex items-center gap-2 text-base">
                  <Package className="w-4 h-4 text-teal-600" /> Detalle técnico y económico
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{items.length} ítem{items.length !== 1 ? 's' : ''} cotizado{items.length !== 1 ? 's' : ''}</p>
              </div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">Precios por volumen aplicados</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-center font-bold text-[10px] uppercase tracking-wider">Cant.</th>
                    <th className="px-4 py-3 text-right font-bold text-[10px] uppercase tracking-wider">P. Unit.</th>
                    <th className="px-4 py-3 text-center font-bold text-[10px] uppercase tracking-wider">Desc.</th>
                    <th className="px-6 py-3 text-right font-bold text-[10px] uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 text-sm">{item.nombre || item.name || item.producto}</p>
                        {item.personalizacion && (
                          <p className="text-[11px] text-purple-600 font-medium mt-0.5 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Personalización láser UV incluida
                          </p>
                        )}
                        {item.sku && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.sku}</p>}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-gray-900">{item.cantidad || item.qty || 0}</td>
                      <td className="px-4 py-4 text-right text-gray-700">${(item.precio_unitario || 0).toLocaleString('es-CL')}</td>
                      <td className="px-4 py-4 text-center">
                        {item.descuento_pct > 0 ? (
                          <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">−{item.descuento_pct}%</span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        ${(item.line_total || (item.precio_unitario * (item.cantidad || item.qty)) || 0).toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="bg-gradient-to-br from-gray-50 to-teal-50/30 border-t border-gray-100 px-6 py-5">
              <div className="max-w-sm ml-auto space-y-2 text-sm">
                {propuesta.subtotal && (
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">${propuesta.subtotal.toLocaleString('es-CL')}</span>
                  </div>
                )}
                {descuento > 0 && (
                  <div className="flex justify-between text-teal-700 font-semibold">
                    <span>Descuento por volumen ({propuesta.descuento_pct}%)</span>
                    <span>−${descuento.toLocaleString('es-CL')}</span>
                  </div>
                )}
                {propuesta.fee_personalizacion > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Personalización</span>
                    <span className="font-medium">${propuesta.fee_personalizacion.toLocaleString('es-CL')}</span>
                  </div>
                )}
                {propuesta.fee_packaging > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Packaging</span>
                    <span className="font-medium">${propuesta.fee_packaging.toLocaleString('es-CL')}</span>
                  </div>
                )}
                <div className="pt-3 border-t-2 border-teal-600 flex justify-between font-poppins font-bold text-lg text-teal-700">
                  <span>Total</span>
                  <span>${(propuesta.total || 0).toLocaleString('es-CL')} CLP</span>
                </div>
                <p className="text-[10px] text-gray-400 text-right">IVA incluido</p>
              </div>
            </div>
          </div>
        )}

        {/* CONDICIONES GRID */}
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { icon: Shield, title: 'Garantía 10 años', desc: 'Cobertura total contra defectos de fabricación en plástico reciclado.', color: 'teal' },
            { icon: Truck, title: 'Despacho a todo Chile', desc: 'Vía Starken, Chilexpress o BlueExpress. Costo calculado según destino.', color: 'blue' },
            { icon: Building2, title: `Anticipo ${propuesta.anticipo_pct || 50}%`, desc: `El saldo se paga contra despacho o 30 días con factura.`, color: 'purple' },
          ].map((c, i) => {
            const colors = {
              teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100' },
              blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
              purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
            }[c.color];
            return (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className={`w-9 h-9 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-3`}>
                  <c.icon className={`w-4 h-4 ${colors.text}`} />
                </div>
                <p className="font-bold text-sm text-gray-900">{c.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{c.desc}</p>
              </div>
            );
          })}
        </div>

        {/* TÉRMINOS COMPLETOS */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-poppins font-bold text-gray-900 flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-gray-700" /> Términos y condiciones
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            {[
              `Anticipo ${propuesta.anticipo_pct || 50}% para iniciar producción. Saldo contra despacho o 30 días con factura.`,
              `Entrega en ${propuesta.lead_time_dias || 7} días hábiles desde pago de anticipo y aprobación de mockup.`,
              'Grabado láser UV incluido gratis desde 10 unidades (área estándar 40×25mm).',
              'Garantía de 10 años contra defectos de fabricación en plástico 100% reciclado.',
              'Fabricación 100% local en Santiago, Chile.',
              `Propuesta válida por ${propuesta.validity_days || 15} días corridos desde la emisión.`,
            ].map((l, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
          {propuesta.terms && (
            <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-3 leading-relaxed">{propuesta.terms}</p>
          )}
        </div>

        {/* DOWNLOAD PDF BIG */}
        <button onClick={handleDownloadPdf} disabled={downloadingPdf}
          className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-2xl p-5 flex items-center justify-between shadow-lg transition-all hover:scale-[1.01] disabled:opacity-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="font-poppins font-bold">Descargar propuesta en PDF</p>
              <p className="text-xs text-white/60">Formato oficial listo para compartir internamente</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2 transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm font-semibold">{downloadingPdf ? 'Generando...' : 'Descargar'}</span>
          </div>
        </button>

        {/* CTAs aceptar / rechazar */}
        {!yaRespondida && (
          <div className="sticky bottom-4 bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-2xl grid grid-cols-[1fr_2fr] gap-3">
            <Button onClick={() => handleAccion('rechazar')} variant="outline" disabled={!!accion}
              className="gap-2 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-semibold h-12">
              <XCircle className="w-4 h-4" />
              {accion === 'rechazando' ? 'Rechazando...' : 'Rechazar'}
            </Button>
            <Button onClick={() => handleAccion('aceptar')} disabled={!!accion}
              className="gap-2 font-bold rounded-xl shadow-lg text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 h-12 text-base">
              <CheckCircle className="w-5 h-5" />
              {accion === 'aceptando' ? 'Confirmando...' : `Aceptar propuesta · $${(propuesta.total || 0).toLocaleString('es-CL')}`}
            </Button>
          </div>
        )}

        {/* WhatsApp */}
        <div className="text-center pb-8 pt-4">
          <p className="text-sm text-gray-500 mb-3 font-medium">¿Necesitas ajustar algo o tienes dudas?</p>
          <a href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola Carlos, tengo dudas sobre la propuesta ${propuesta.numero ? '#' + propuesta.numero + ' ' : ''}para ${propuesta.empresa}. `)}`}
            target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 rounded-xl font-bold h-12 px-6 bg-green-500 hover:bg-green-600 text-white shadow-md">
              <MessageCircle className="w-4 h-4" /> Hablar con Carlos por WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}