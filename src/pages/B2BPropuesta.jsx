import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-6xl">🔍</div>
          <h2 className="text-2xl font-poppins font-bold text-gray-900">Propuesta no encontrada</h2>
          <p className="text-gray-500 text-sm">Verifica el enlace o contáctanos por WhatsApp.</p>
          <a href="https://wa.me/56935040242" target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 mt-4 rounded-lg w-full font-semibold" style={{ backgroundColor: '#25D366' }}>
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
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-lg ${done === 'aceptada' ? 'bg-gradient-to-br from-[#0F8B6C] to-[#A7D9C9]' : 'bg-gradient-to-br from-red-400 to-red-500'}`}>
            {done === 'aceptada'
              ? <CheckCircle className="w-12 h-12 text-white" />
              : <XCircle className="w-12 h-12 text-white" />
            }
          </div>
          <h2 className="text-3xl font-poppins font-bold text-gray-900">
            {done === 'aceptada' ? '¡Propuesta aceptada!' : 'Propuesta rechazada'}
          </h2>
          {done === 'aceptada' ? (
            <div className="bg-white border border-gray-100 rounded-xl p-5 text-sm text-left space-y-4 shadow-sm">
              <p className="text-gray-600 leading-relaxed font-medium">El equipo de Peyu fue notificado. Carlos te contactará en los próximos minutos.</p>
              <div className="bg-[#0F8B6C]/8 border border-[#0F8B6C]/30 rounded-lg p-4 text-[#0F8B6C] text-xs space-y-2">
                <p className="font-bold text-sm">Próximos pasos:</p>
                <ol className="space-y-1.5 ml-2">
                  <li>✓ Anticipo del {propuesta.anticipo_pct || 50}% para iniciar</li>
                  <li>✓ Validación del archivo de logo</li>
                  <li>✓ Producción en 48h hábiles</li>
                </ol>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Entendemos. Si quieres ajustar la propuesta, escríbenos.</p>
          )}
          <a href="https://wa.me/56935040242" target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 w-full rounded-lg font-semibold h-11" style={{ backgroundColor: '#25D366' }}>
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
      {/* NAVBAR */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center shadow">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <div>
              <p className="text-sm font-poppins font-bold text-gray-900 leading-none">PEYU</p>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">Propuesta Corporativa</p>
            </div>
          </Link>
          {propuesta.numero && (
            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-3 py-1.5 rounded-lg">#{propuesta.numero}</span>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 py-8 space-y-5">

        {/* Estado */}
        {yaRespondida && (
          <div className={`rounded-lg px-4 py-3 flex items-center gap-3 border font-medium text-sm ${propuesta.status === 'Aceptada' ? 'bg-green-50 text-green-700 border-green-200' : propuesta.status === 'Rechazada' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
            {propuesta.status === 'Aceptada' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <Clock className="w-5 h-5 flex-shrink-0" />}
            <span>Propuesta {propuesta.status.toLowerCase()}</span>
          </div>
        )}

        {/* Hero */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h1 className="text-2xl font-poppins font-bold text-gray-900">Propuesta para {propuesta.empresa}</h1>
            <p className="text-gray-500 text-sm mt-2">
              Hola {propuesta.contacto}, aquí está tu propuesta de regalos corporativos personalizados 100% reciclados.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              propuesta.total && { label: 'Total', value: `$${propuesta.total?.toLocaleString('es-CL')}`, sub: 'CLP', accent: true },
              propuesta.lead_time_dias && { label: 'Lead Time', value: `${propuesta.lead_time_dias}`, sub: 'días hábiles' },
              propuesta.validity_days && { label: 'Validez', value: `${propuesta.validity_days}`, sub: 'días' },
            ].filter(Boolean).map((s, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1 font-medium">{s.label}</div>
                <div className={`font-poppins font-bold text-lg ${s.accent ? 'text-[#0F8B6C]' : 'text-gray-900'}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mockups */}
        {propuesta.mockup_urls?.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="font-poppins font-bold text-gray-900 flex items-center gap-2 text-base">🎨 Vista previa personalización</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {propuesta.mockup_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group">
                  <img src={url} alt={`Mockup ${i + 1}`} className="w-full aspect-square object-cover rounded-lg border border-gray-100 hover:border-[#0F8B6C]/30 hover:shadow-md transition-all" />
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-500 italic">Los mockups son referenciales. El grabado final puede variar levemente según ángulo.</p>
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="font-poppins font-bold text-gray-900 flex items-center gap-2 text-base"><Package className="w-4 h-4" /> Detalle de productos</h3>
            <div className="divide-y divide-gray-100">
              {items.map((item, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold text-gray-900">{item.nombre || item.name || item.producto}</div>
                    {item.personalizacion && <div className="text-xs text-[#0F8B6C] font-medium mt-1">✨ Personalización láser UV</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{item.cantidad || item.qty} u.</div>
                    {item.precio_unitario && <div className="text-xs text-gray-500">${(item.precio_unitario)?.toLocaleString('es-CL')} c/u</div>}
                  </div>
                </div>
              ))}
            </div>
            {propuesta.subtotal && (
              <div className="pt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span className="font-medium">${propuesta.subtotal?.toLocaleString('es-CL')}</span>
                </div>
                {propuesta.descuento_pct > 0 && (
                  <div className="flex justify-between text-[#0F8B6C] font-semibold">
                    <span>Descuento ({propuesta.descuento_pct}%)</span>
                    <span>−${Math.round(propuesta.subtotal * propuesta.descuento_pct / 100)?.toLocaleString('es-CL')}</span>
                  </div>
                )}
                {propuesta.fee_personalizacion > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Personalización</span><span className="font-medium">${propuesta.fee_personalizacion?.toLocaleString('es-CL')}</span>
                  </div>
                )}
                {propuesta.total && (
                  <div className="flex justify-between font-poppins font-bold text-base pt-3 border-t border-gray-100 text-[#0F8B6C]">
                    <span>Total</span>
                    <span>${propuesta.total?.toLocaleString('es-CL')} CLP</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Condiciones */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-poppins font-bold text-gray-900 flex items-center gap-2 text-base"><Recycle className="w-4 h-4 text-[#0F8B6C]" /> Términos y condiciones</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            {[
              '✓ Personalización láser UV incluida desde 10 unidades',
              `✓ ${propuesta.anticipo_pct || 50}% anticipo para iniciar · saldo a despacho`,
              propuesta.lead_time_dias && `✓ Entrega ${propuesta.lead_time_dias} días hábiles desde anticipo`,
              '✓ Garantía 10 años en plástico 100% reciclado',
              '✓ Fabricación 100% en Chile',
            ].filter(Boolean).map((l, i) => <li key={i}>{l}</li>)}
            {propuesta.terms && <li className="mt-3 text-xs text-gray-500 italic border-t border-gray-100 pt-2">{propuesta.terms}</li>}
          </ul>
        </div>

        {/* PDF */}
        {propuesta.pdf_url && (
          <a href={propuesta.pdf_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full gap-2 rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold">
              <FileText className="w-4 h-4" /> Descargar propuesta en PDF
            </Button>
          </a>
        )}

        {/* CTAs */}
        {!yaRespondida && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button onClick={() => handleAccion('rechazar')} variant="outline" disabled={!!accion}
              className="gap-2 rounded-lg border-red-200 text-red-600 hover:bg-red-50 font-semibold">
              <XCircle className="w-4 h-4" />
              {accion === 'rechazando' ? 'Rechazando...' : 'Rechazar'}
            </Button>
            <Button onClick={() => handleAccion('aceptar')} disabled={!!accion}
              className="gap-2 font-bold rounded-lg shadow-md text-white"
              style={{ backgroundColor: '#0F8B6C' }}>
              <CheckCircle className="w-4 h-4" />
              {accion === 'aceptando' ? 'Confirmando...' : 'Aceptar'}
            </Button>
          </div>
        )}

        {/* WhatsApp */}
        <div className="text-center pb-8 pt-2">
          <p className="text-sm text-gray-500 mb-3 font-medium">¿Dudas o ajustes?</p>
          <a href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola Carlos, tengo dudas sobre la propuesta ${propuesta.numero ? '#' + propuesta.numero + ' ' : ''}para ${propuesta.empresa}. `)}`}
            target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 rounded-lg font-bold w-full" style={{ backgroundColor: '#25D366' }}>
              <MessageCircle className="w-4 h-4" /> Hablar con Carlos
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}