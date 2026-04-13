import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package, Truck, CheckCircle2, Clock, ArrowLeft, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';

const PASOS = [
  { estado: 'Nuevo', label: 'Pedido recibido', icon: Clock, desc: 'Tu pedido fue registrado y está en revisión.' },
  { estado: 'Confirmado', label: 'Confirmado', icon: CheckCircle2, desc: 'Pedido confirmado y en cola de producción.' },
  { estado: 'En Producción', label: 'En producción', icon: RefreshCw, desc: 'Estamos fabricando y personalizando tu pedido.' },
  { estado: 'Listo para Despacho', label: 'Listo', icon: Package, desc: 'Tu pedido está listo y esperando el courier.' },
  { estado: 'Despachado', label: 'Despachado', icon: Truck, desc: 'En camino a tu dirección.' },
  { estado: 'Entregado', label: 'Entregado', icon: CheckCircle2, desc: '¡Tu pedido llegó!' },
];

const ESTADO_IDX = Object.fromEntries(PASOS.map((p, i) => [p.estado, i]));

function getPasoActual(estado) {
  return ESTADO_IDX[estado] ?? -1;
}

export default function SeguimientoPedido() {
  const [numero, setNumero] = useState('');
  const [email, setEmail] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState('');

  const buscar = async () => {
    if (!numero.trim()) { setError('Ingresa tu número de pedido'); return; }
    setBuscando(true);
    setError('');
    setPedido(null);
    try {
      const resultados = await base44.entities.PedidoWeb.filter({ numero_pedido: numero.trim() });
      if (resultados.length === 0) {
        setError('No encontramos un pedido con ese número. Verifica que sea correcto (ej: WEB-1234567890).');
        return;
      }
      const p = resultados[0];
      // Validar email si se proporcionó
      if (email && p.cliente_email && p.cliente_email.toLowerCase() !== email.toLowerCase()) {
        setError('El email no coincide con el pedido. Verifica tus datos.');
        return;
      }
      setPedido(p);
    } catch (e) {
      setError('Error al buscar el pedido. Intenta de nuevo.');
    } finally {
      setBuscando(false);
    }
  };

  const pasoActual = pedido ? getPasoActual(pedido.estado) : -1;
  const esCancelado = pedido?.estado === 'Cancelado' || pedido?.estado === 'Reembolsado';

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <span className="text-muted-foreground">|</span>
          <h1 className="font-poppins font-bold">Seguimiento de Pedido</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Buscador */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="font-poppins font-bold text-lg mb-1">¿Dónde está mi pedido?</h2>
          <p className="text-sm text-muted-foreground mb-5">Ingresa tu número de pedido para ver el estado actual.</p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Número de pedido *</label>
              <Input
                value={numero}
                onChange={e => setNumero(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Ej: WEB-1234567890"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground mt-1">Lo encontrarás en el email de confirmación que recibiste.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Email (opcional, para mayor seguridad)</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="tu@email.com"
                className="h-10"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <Button onClick={buscar} disabled={buscando} className="w-full gap-2" style={{ backgroundColor: '#0F8B6C' }}>
              {buscando ? 'Buscando...' : <><Search className="w-4 h-4" /> Buscar pedido</>}
            </Button>
          </div>
        </div>

        {/* Resultado */}
        {pedido && (
          <div className="space-y-4">
            {/* Info del pedido */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <p className="font-mono text-sm text-muted-foreground">{pedido.numero_pedido}</p>
                  <h3 className="font-poppins font-bold text-lg">{pedido.cliente_nombre}</h3>
                  <p className="text-sm text-muted-foreground">{pedido.fecha}</p>
                </div>
                <div className="text-right">
                  <p className="font-poppins font-bold text-2xl" style={{ color: '#0F8B6C' }}>
                    ${(pedido.total || 0).toLocaleString('es-CL')}
                  </p>
                  <p className="text-xs text-muted-foreground">{pedido.medio_pago}</p>
                </div>
              </div>

              {pedido.descripcion_items && (
                <div className="bg-muted/30 rounded-xl p-3 text-sm text-muted-foreground mb-4">
                  <p className="font-medium text-foreground mb-1 text-xs uppercase tracking-wide">Productos</p>
                  <p>{pedido.descripcion_items}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {pedido.ciudad && <div><span className="text-muted-foreground">Ciudad:</span> <span className="font-medium">{pedido.ciudad}</span></div>}
                {pedido.courier && pedido.courier !== 'Pendiente' && <div><span className="text-muted-foreground">Courier:</span> <span className="font-medium">{pedido.courier}</span></div>}
                {pedido.costo_envio === 0 ? <div className="text-green-600 font-medium">✓ Envío gratis</div> : pedido.costo_envio > 0 ? <div><span className="text-muted-foreground">Envío:</span> <span>${pedido.costo_envio?.toLocaleString('es-CL')}</span></div> : null}
              </div>

              {pedido.tracking && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">N° Tracking</p>
                  <p className="font-mono font-semibold text-sm">{pedido.tracking}</p>
                </div>
              )}
            </div>

            {/* Timeline de estado */}
            {!esCancelado ? (
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="font-poppins font-semibold mb-5">Estado del pedido</h3>
                <div className="space-y-0">
                  {PASOS.map((paso, i) => {
                    const completado = i <= pasoActual;
                    const activo = i === pasoActual;
                    const Icon = paso.icon;
                    return (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                            activo ? 'border-[#0F8B6C] bg-[#0F8B6C] text-white shadow-md' :
                            completado ? 'border-[#0F8B6C] bg-[#f0faf7] text-[#0F8B6C]' :
                            'border-border bg-muted text-muted-foreground'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {i < PASOS.length - 1 && (
                            <div className={`w-0.5 h-8 mt-1 mb-1 rounded-full ${completado && i < pasoActual ? 'bg-[#0F8B6C]' : 'bg-muted'}`} />
                          )}
                        </div>
                        <div className="pb-6">
                          <p className={`font-semibold text-sm ${activo ? 'text-[#0F8B6C]' : completado ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {paso.label}
                            {activo && <span className="ml-2 text-xs bg-[#0F8B6C]/10 text-[#0F8B6C] px-2 py-0.5 rounded-full font-medium">Estado actual</span>}
                          </p>
                          {(activo || completado) && <p className="text-xs text-muted-foreground mt-0.5">{paso.desc}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="font-semibold text-red-700">{pedido.estado}</p>
                <p className="text-sm text-red-600 mt-1">Si tienes preguntas, contáctanos al WhatsApp.</p>
              </div>
            )}

            {/* Personalización */}
            {pedido.requiere_personalizacion && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <p className="font-semibold text-blue-700 mb-1">✨ Pedido con personalización láser</p>
                {pedido.texto_personalizacion && (
                  <p className="text-sm text-blue-600">Grabado: "{pedido.texto_personalizacion}"</p>
                )}
                <p className="text-xs text-blue-500 mt-2">
                  {pedido.logo_recibido ? '✓ Logo recibido y en proceso' : '⏳ Esperando confirmación de logo — revisa tu email'}
                </p>
              </div>
            )}

            {/* Ayuda */}
            <div className="bg-white rounded-2xl border border-border p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div>
                <p className="font-semibold text-sm">¿Tienes alguna pregunta sobre tu pedido?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Respondemos en menos de 2 horas por WhatsApp</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a href={`https://wa.me/56935040242?text=Hola, consulto por mi pedido ${pedido.numero_pedido}`} target="_blank" rel="noreferrer">
                  <Button style={{ backgroundColor: '#25D366' }} className="gap-2 text-white text-sm">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                </a>
                <Link to="/soporte">
                  <Button variant="outline" size="sm">Centro de ayuda</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Sin pedido buscado aún */}
        {!pedido && !error && (
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm text-center space-y-3">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">¿Perdiste el número de pedido? Escríbenos al WhatsApp con tu nombre y email y te ayudamos.</p>
            <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2">
                <MessageCircle className="w-4 h-4" /> Contactar soporte
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}