import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, FileText, Clock, Package, Leaf, MessageCircle } from 'lucide-react';

export default function B2BPropuesta() {
  const urlParams = new URLSearchParams(window.location.search);
  const proposalId = urlParams.get('id');

  const [propuesta, setPropuesta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accion, setAccion] = useState(null); // 'aceptando' | 'rechazando'
  const [done, setDone] = useState(null); // 'aceptada' | 'rechazada'

  useEffect(() => {
    if (!proposalId) { setLoading(false); return; }
    const cargar = async () => {
      try {
        const list = await base44.entities.CorporateProposal.filter({ id: proposalId });
        if (list && list.length > 0) setPropuesta(list[0]);
      } finally {
        setLoading(false);
      }
    };
    cargar();
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
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
        <div className="w-8 h-8 border-4 border-[#006D5B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!proposalId || !propuesta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5] p-4">
        <div className="text-center space-y-3">
          <div className="text-4xl">🔍</div>
          <h2 className="text-xl font-bold font-poppins">Propuesta no encontrada</h2>
          <p className="text-muted-foreground text-sm">Verifica el enlace o contáctanos por WhatsApp.</p>
          <a href="https://wa.me/56935040242" target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 mt-2" style={{ backgroundColor: '#25D366' }}>
              <MessageCircle className="w-4 h-4" /> WhatsApp Peyu
            </Button>
          </a>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5] p-4">
        <div className="max-w-md w-full text-center space-y-5">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${done === 'aceptada' ? 'bg-green-100' : 'bg-red-100'}`}>
            {done === 'aceptada' ? <CheckCircle className="w-10 h-10 text-green-600" /> : <XCircle className="w-10 h-10 text-red-500" />}
          </div>
          <h2 className="text-2xl font-bold font-poppins">
            {done === 'aceptada' ? '¡Propuesta aceptada!' : 'Propuesta rechazada'}
          </h2>
          {done === 'aceptada' ? (
            <div className="bg-white rounded-xl border border-border p-5 text-sm text-left space-y-3">
              <p className="text-muted-foreground">El equipo de Peyu fue notificado. Carlos te contactará en los próximos minutos para coordinar el pago del anticipo y los detalles de producción.</p>
              <div className="bg-green-50 rounded-lg p-3 text-green-700 text-xs">
                <strong>Próximos pasos:</strong><br />
                1. Anticipo del {propuesta.anticipo_pct || 50}% para iniciar producción<br />
                2. Validación final de archivo de logo<br />
                3. Producción inicia dentro de 48h hábiles
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Entendemos. Si quieres ajustar la propuesta o tienes preguntas, escríbenos por WhatsApp.</p>
          )}
          <a href="https://wa.me/56935040242" target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 w-full" style={{ backgroundColor: '#25D366' }}>
              <MessageCircle className="w-4 h-4" /> Hablar con Carlos
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const items = (() => {
    try { return propuesta.items_json ? JSON.parse(propuesta.items_json) : []; } catch { return []; }
  })();

  const yaRespondida = ['Aceptada', 'Rechazada', 'Vencida'].includes(propuesta.status);

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="font-bold text-[#006D5B] font-poppins text-lg">PEYU</span>
            <span className="text-xs text-muted-foreground ml-2">Propuesta Corporativa</span>
          </div>
          {propuesta.numero && (
            <span className="text-xs text-muted-foreground font-mono">#{propuesta.numero}</span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Estado */}
        {yaRespondida && (
          <div className={`rounded-xl px-4 py-3 flex items-center gap-2 ${
            propuesta.status === 'Aceptada' ? 'bg-green-50 text-green-700 border border-green-200' :
            propuesta.status === 'Rechazada' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-orange-50 text-orange-700 border border-orange-200'
          }`}>
            {propuesta.status === 'Aceptada' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            <span className="font-medium text-sm">Esta propuesta está {propuesta.status.toLowerCase()}</span>
          </div>
        )}

        {/* Hero */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-poppins">Propuesta para {propuesta.empresa}</h1>
            <p className="text-muted-foreground text-sm">
              Hola {propuesta.contacto}, adjuntamos nuestra propuesta de regalos corporativos sustentables personalizados.
            </p>
          </div>

          {/* Info rápida */}
          <div className="grid grid-cols-3 gap-3">
            {propuesta.total && (
              <div className="bg-[#F7F7F5] rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="font-bold text-[#006D5B] text-lg">${propuesta.total?.toLocaleString('es-CL')}</div>
                <div className="text-xs text-muted-foreground">CLP + IVA</div>
              </div>
            )}
            {propuesta.lead_time_dias && (
              <div className="bg-[#F7F7F5] rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">Lead Time</div>
                <div className="font-bold text-lg">{propuesta.lead_time_dias}</div>
                <div className="text-xs text-muted-foreground">días hábiles</div>
              </div>
            )}
            {propuesta.validity_days && (
              <div className="bg-[#F7F7F5] rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground">Validez</div>
                <div className="font-bold text-lg">{propuesta.validity_days}</div>
                <div className="text-xs text-muted-foreground">días</div>
              </div>
            )}
          </div>
        </div>

        {/* Mockups */}
        {propuesta.mockup_urls && propuesta.mockup_urls.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-5 space-y-3">
            <h3 className="font-semibold font-poppins flex items-center gap-2">
              🎨 Vista previa de personalización
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {propuesta.mockup_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`Mockup ${i + 1}`} className="w-full aspect-square object-cover rounded-lg border border-border hover:opacity-80 transition shadow-sm" />
                </a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Los mockups son referenciales. El grabado láser UV final puede variar levemente según el ángulo del producto.</p>
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-5 space-y-3">
            <h3 className="font-semibold font-poppins flex items-center gap-2">
              <Package className="w-4 h-4" /> Detalle de productos
            </h3>
            <div className="divide-y divide-border">
              {items.map((item, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{item.nombre || item.name || item.producto}</div>
                    {item.personalizacion && <div className="text-xs text-green-600">✨ Con personalización láser UV</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{item.cantidad || item.qty} u.</div>
                    {item.precio_unitario && (
                      <div className="text-xs text-muted-foreground">${(item.precio_unitario)?.toLocaleString('es-CL')} c/u</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {propuesta.subtotal && (
              <div className="pt-3 border-t border-border space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${propuesta.subtotal?.toLocaleString('es-CL')}</span>
                </div>
                {propuesta.descuento_pct > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento ({propuesta.descuento_pct}%)</span>
                    <span>-${Math.round(propuesta.subtotal * propuesta.descuento_pct / 100)?.toLocaleString('es-CL')}</span>
                  </div>
                )}
                {propuesta.fee_personalizacion > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Personalización</span>
                    <span>${propuesta.fee_personalizacion?.toLocaleString('es-CL')}</span>
                  </div>
                )}
                {propuesta.total && (
                  <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                    <span>Total</span>
                    <span className="text-[#006D5B]">${propuesta.total?.toLocaleString('es-CL')} CLP</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Términos */}
        <div className="bg-white rounded-xl border border-border p-5 space-y-3">
          <h3 className="font-semibold font-poppins flex items-center gap-2">
            <Leaf className="w-4 h-4 text-[#006D5B]" /> Condiciones generales
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>✓ Personalización láser UV incluida desde 10 unidades</li>
            <li>✓ {propuesta.anticipo_pct || 50}% anticipo para iniciar producción · saldo a despacho</li>
            {propuesta.lead_time_dias && <li>✓ Entrega en {propuesta.lead_time_dias} días hábiles desde anticipo</li>}
            <li>✓ Garantía 10 años en productos de plástico reciclado</li>
            <li>✓ Fabricación 100% en Chile · Plástico 100% reciclado</li>
            {propuesta.terms && <li className="mt-2 text-xs">{propuesta.terms}</li>}
          </ul>
        </div>

        {/* PDF */}
        {propuesta.pdf_url && (
          <a href={propuesta.pdf_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full gap-2">
              <FileText className="w-4 h-4" /> Descargar propuesta PDF
            </Button>
          </a>
        )}

        {/* CTAs */}
        {!yaRespondida && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleAccion('rechazar')}
              variant="outline"
              disabled={!!accion}
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4" />
              {accion === 'rechazando' ? 'Rechazando...' : 'Rechazar propuesta'}
            </Button>
            <Button
              onClick={() => handleAccion('aceptar')}
              disabled={!!accion}
              className="gap-2 font-semibold"
              style={{ backgroundColor: '#006D5B' }}
            >
              <CheckCircle className="w-4 h-4" />
              {accion === 'aceptando' ? 'Confirmando...' : '✓ Aceptar propuesta'}
            </Button>
          </div>
        )}

        {/* WhatsApp CTA */}
        <div className="text-center pb-8">
          <p className="text-sm text-muted-foreground mb-3">¿Tienes dudas o quieres ajustar algo?</p>
          <a
            href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola Carlos, te escribo sobre la propuesta ${propuesta.numero ? '#' + propuesta.numero + ' ' : ''}para ${propuesta.empresa}. `)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="gap-2" style={{ backgroundColor: '#25D366' }}>
              <MessageCircle className="w-4 h-4" /> Hablar con Carlos directamente
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}