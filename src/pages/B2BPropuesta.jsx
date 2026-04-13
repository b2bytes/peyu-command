import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, FileText, Clock, Package, Leaf, MessageCircle, Shield, Recycle } from 'lucide-react';

export default function B2BPropuesta() {
  const urlParams = new URLSearchParams(window.location.search);
  const proposalId = urlParams.get('id');

  const [propuesta, setPropuesta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accion, setAccion] = useState(null);
  const [done, setDone] = useState(null);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="w-10 h-10 border-4 border-[#0F8B6C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!proposalId || !propuesta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] font-inter p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔍</div>
          <h2 className="text-xl font-poppins font-bold text-gray-900">Propuesta no encontrada</h2>
          <p className="text-gray-400 text-sm">Verifica el enlace o contáctanos por WhatsApp.</p>
          <a href="https://wa.me/56935040242" target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 mt-2 rounded-xl" style={{ backgroundColor: '#25D366' }}>
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
        <div className="max-w-md w-full text-center space-y-5">
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-lg ${done === 'aceptada' ? 'bg-gradient-to-br from-[#0F8B6C] to-[#A7D9C9] shadow-[#0F8B6C]/20' : 'bg-gradient-to-br from-red-400 to-red-300 shadow-red-400/20'}`}>
            {done === 'aceptada'
              ? <CheckCircle className="w-12 h-12 text-white" />
              : <XCircle className="w-12 h-12 text-white" />
            }
          </div>
          <h2 className="text-2xl font-poppins font-bold text-gray-900">
            {done === 'aceptada' ? '¡Propuesta aceptada!' : 'Propuesta rechazada'}
          </h2>
          {done === 'aceptada' ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 text-sm text-left space-y-3 shadow-sm">
              <p className="text-gray-500 leading-relaxed">El equipo de Peyu fue notificado. Carlos te contactará en los próximos minutos para coordinar el pago del anticipo y los detalles de producción.</p>
              <div className="bg-[#0F8B6C]/8 border border-[#0F8B6C]/20 rounded-xl p-3 text-[#0F8B6C] text-xs space-y-1">
                <p className="font-bold">Próximos pasos:</p>
                <p>1. Anticipo del {propuesta.anticipo_pct || 50}% para iniciar producción</p>
                <p>2. Validación final de archivo de logo</p>
                <p>3. Producción inicia dentro de 48h hábiles</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Entendemos. Si quieres ajustar la propuesta, escríbenos por WhatsApp.</p>
          )}
          <a href="https://wa.me/56935040242" target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 w-full rounded-2xl font-semibold" style={{ backgroundColor: '#25D366' }}>
              <MessageCircle className="w-4 h-4" /> Hablar con Carlos
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const items = (() => { try { return propuesta.items_json ? JSON.parse(propuesta.items_json) : []; } catch { return []; } })();
  const yaRespondida = ['Aceptada', 'Rechazada', 'Vencida'].includes(propuesta.status);

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">

      {/* ── NAVBAR ─────────────────────────── */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center shadow">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <div>
              <p className="text-sm font-poppins font-bold text-gray-900 leading-none">PEYU</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">Propuesta Corporativa</p>
            </div>
          </div>
          {propuesta.numero && (
            <span className="text-xs text-gray-400 font-mono bg-gray-100 px-3 py-1 rounded-full">#{propuesta.numero}</span>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-5">

        {/* Estado */}
        {yaRespondida && (
          <div className={`rounded-2xl px-4 py-3 flex items-center gap-2 border ${propuesta.status === 'Aceptada' ? 'bg-green-50 text-green-700 border-green-100' : propuesta.status === 'Rechazada' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
            {propuesta.status === 'Aceptada' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <Clock className="w-5 h-5 flex-shrink-0" />}
            <span className="font-semibold text-sm">Esta propuesta está {propuesta.status.toLowerCase()}</span>
          </div>
        )}

        {/* Hero */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
          <div>
            <h1 className="text-2xl font-poppins font-bold text-gray-900">Propuesta para {propuesta.empresa}</h1>
            <p className="text-gray-400 text-sm mt-1">
              Hola {propuesta.contacto}, adjuntamos nuestra propuesta de regalos corporativos sustentables personalizados.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              propuesta.total && { label: 'Total', value: `$${propuesta.total?.toLocaleString('es-CL')}`, sub: 'CLP + IVA', accent: true },
              propuesta.lead_time_dias && { label: 'Lead Time', value: `${propuesta.lead_time_dias}`, sub: 'días hábiles' },
              propuesta.validity_days && { label: 'Validez', value: `${propuesta.validity_days}`, sub: 'días' },
            ].filter(Boolean).map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-4 text-center">
                <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                <div className={`font-poppins font-bold text-xl ${s.accent ? 'text-[#0F8B6C]' : 'text-gray-900'}`}>{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mockups */}
        {propuesta.mockup_urls?.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="font-poppins font-bold text-gray-900 flex items-center gap-2">🎨 Vista previa de personalización</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {propuesta.mockup_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`Mockup ${i + 1}`} className="w-full aspect-square object-cover rounded-2xl border border-gray-100 hover:opacity-80 transition shadow-sm" />
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-400">Los mockups son referenciales. El grabado final puede variar levemente según el ángulo del producto.</p>
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="font-poppins font-bold text-gray-900 flex items-center gap-2"><Package className="w-4 h-4" /> Detalle de productos</h3>
            <div className="divide-y divide-gray-50">
              {items.map((item, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold text-gray-900">{item.nombre || item.name || item.producto}</div>
                    {item.personalizacion && <div className="text-xs text-purple-600 font-medium mt-0.5">✨ Con personalización láser UV</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{item.cantidad || item.qty} u.</div>
                    {item.precio_unitario && <div className="text-xs text-gray-400">${(item.precio_unitario)?.toLocaleString('es-CL')} c/u</div>}
                  </div>
                </div>
              ))}
            </div>
            {propuesta.subtotal && (
              <div className="pt-3 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span><span>${propuesta.subtotal?.toLocaleString('es-CL')}</span>
                </div>
                {propuesta.descuento_pct > 0 && (
                  <div className="flex justify-between text-[#0F8B6C] font-semibold">
                    <span>Descuento ({propuesta.descuento_pct}%)</span>
                    <span>−${Math.round(propuesta.subtotal * propuesta.descuento_pct / 100)?.toLocaleString('es-CL')}</span>
                  </div>
                )}
                {propuesta.fee_personalizacion > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Personalización</span><span>${propuesta.fee_personalizacion?.toLocaleString('es-CL')}</span>
                  </div>
                )}
                {propuesta.total && (
                  <div className="flex justify-between font-poppins font-bold text-lg pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-[#0F8B6C]">${propuesta.total?.toLocaleString('es-CL')} CLP</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Condiciones */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="font-poppins font-bold text-gray-900 flex items-center gap-2"><Recycle className="w-4 h-4 text-[#0F8B6C]" /> Condiciones generales</h3>
          <ul className="text-sm text-gray-500 space-y-2">
            {[
              '✓ Personalización láser UV incluida desde 10 unidades',
              `✓ ${propuesta.anticipo_pct || 50}% anticipo para iniciar producción · saldo a despacho`,
              propuesta.lead_time_dias && `✓ Entrega en ${propuesta.lead_time_dias} días hábiles desde anticipo`,
              '✓ Garantía 10 años en productos de plástico reciclado',
              '✓ Fabricación 100% en Chile · Plástico 100% reciclado',
            ].filter(Boolean).map((l, i) => <li key={i}>{l}</li>)}
            {propuesta.terms && <li className="mt-2 text-xs text-gray-400">{propuesta.terms}</li>}
          </ul>
        </div>

        {/* PDF */}
        {propuesta.pdf_url && (
          <a href={propuesta.pdf_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full gap-2 rounded-2xl border-gray-200 text-gray-600 hover:border-gray-900">
              <FileText className="w-4 h-4" /> Descargar propuesta PDF
            </Button>
          </a>
        )}

        {/* CTAs */}
        {!yaRespondida && (
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => handleAccion('rechazar')} variant="outline" disabled={!!accion}
              className="gap-2 rounded-2xl border-red-200 text-red-500 hover:bg-red-50">
              <XCircle className="w-4 h-4" />
              {accion === 'rechazando' ? 'Rechazando...' : 'Rechazar'}
            </Button>
            <Button onClick={() => handleAccion('aceptar')} disabled={!!accion}
              className="gap-2 font-semibold rounded-2xl shadow-lg"
              style={{ backgroundColor: '#0F8B6C' }}>
              <CheckCircle className="w-4 h-4" />
              {accion === 'aceptando' ? 'Confirmando...' : '✓ Aceptar propuesta'}
            </Button>
          </div>
        )}

        {/* WhatsApp */}
        <div className="text-center pb-8">
          <p className="text-sm text-gray-400 mb-3">¿Tienes dudas o quieres ajustar algo?</p>
          <a href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola Carlos, te escribo sobre la propuesta ${propuesta.numero ? '#' + propuesta.numero + ' ' : ''}para ${propuesta.empresa}. `)}`}
            target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 rounded-2xl font-semibold" style={{ backgroundColor: '#25D366' }}>
              <MessageCircle className="w-4 h-4" /> Hablar con Carlos directamente
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}