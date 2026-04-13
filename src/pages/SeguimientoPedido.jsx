import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package, Truck, CheckCircle2, Clock, ArrowLeft, MessageCircle, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

const PASOS = [
  { estado: 'Nuevo', label: 'Pedido recibido', icon: Clock, desc: 'Tu pedido fue registrado y está en revisión.' },
  { estado: 'Confirmado', label: 'Confirmado', icon: CheckCircle2, desc: 'Confirmado y en cola de producción.' },
  { estado: 'En Producción', label: 'En producción', icon: RefreshCw, desc: 'Fabricando y personalizando tu pedido.' },
  { estado: 'Listo para Despacho', label: 'Listo', icon: Package, desc: 'Tu pedido está listo esperando el courier.' },
  { estado: 'Despachado', label: 'Despachado', icon: Truck, desc: 'En camino a tu dirección.' },
  { estado: 'Entregado', label: 'Entregado', icon: CheckCircle2, desc: '¡Tu pedido llegó!' },
];

const ESTADO_IDX = Object.fromEntries(PASOS.map((p, i) => [p.estado, i]));

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
    const resultados = await base44.entities.PedidoWeb.filter({ numero_pedido: numero.trim() });
    if (resultados.length === 0) {
      setError('No encontramos ese pedido. Verifica el número (ej: WEB-1234567890).');
      setBuscando(false);
      return;
    }
    const p = resultados[0];
    if (email && p.cliente_email && p.cliente_email.toLowerCase() !== email.toLowerCase()) {
      setError('El email no coincide con el pedido.');
      setBuscando(false);
      return;
    }
    setPedido(p);
    setBuscando(false);
  };

  const pasoActual = pedido ? (ESTADO_IDX[pedido.estado] ?? -1) : -1;
  const esCancelado = pedido?.estado === 'Cancelado' || pedido?.estado === 'Reembolsado';

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">

      {/* ── NAVBAR ─────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
          </Link>
          <div>
            <h1 className="font-poppins font-bold text-gray-900">Seguimiento de Pedido</h1>
            <p className="text-xs text-gray-400">Rastrea tu pedido en tiempo real</p>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 py-10 space-y-5">

        {/* ── BUSCADOR ───────────────────── */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-poppins font-bold text-gray-900">¿Dónde está mi pedido?</h2>
              <p className="text-xs text-gray-400">Ingresa tu número de pedido para ver el estado</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5">Número de pedido *</label>
              <Input
                value={numero}
                onChange={e => setNumero(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Ej: WEB-1234567890"
                className="h-11 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Encuéntralo en el email de confirmación</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5">Email (opcional)</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="tu@email.com"
                className="h-11 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2.5 text-red-600 bg-red-50 border border-red-100 rounded-2xl p-3.5 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <Button
              onClick={buscar}
              disabled={buscando}
              className="w-full gap-2 rounded-2xl bg-gray-900 hover:bg-gray-800 h-11 font-semibold"
            >
              {buscando ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Buscando...</>
              ) : (
                <><Search className="w-4 h-4" /> Buscar pedido</>
              )}
            </Button>
          </div>
        </div>

        {/* ── RESULTADO ──────────────────── */}
        {pedido && (
          <div className="space-y-4">
            {/* Info del pedido */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                <div>
                  <p className="font-mono text-xs text-gray-400 mb-1">{pedido.numero_pedido}</p>
                  <h3 className="font-poppins font-bold text-xl text-gray-900">{pedido.cliente_nombre}</h3>
                  <p className="text-sm text-gray-400">{pedido.fecha}</p>
                </div>
                <div className="text-right">
                  <p className="font-poppins font-bold text-3xl text-gray-900">${(pedido.total || 0).toLocaleString('es-CL')}</p>
                  <p className="text-xs text-gray-400">{pedido.medio_pago}</p>
                </div>
              </div>

              {pedido.descripcion_items && (
                <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Productos</p>
                  <p>{pedido.descripcion_items}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {pedido.ciudad && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 mb-0.5">Ciudad</p>
                    <p className="font-semibold text-gray-900">{pedido.ciudad}</p>
                  </div>
                )}
                {pedido.courier && pedido.courier !== 'Pendiente' && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 mb-0.5">Courier</p>
                    <p className="font-semibold text-gray-900">{pedido.courier}</p>
                  </div>
                )}
                {pedido.costo_envio === 0 ? (
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-green-600 font-bold">✓ Envío gratis</p>
                  </div>
                ) : pedido.costo_envio > 0 ? (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 mb-0.5">Envío</p>
                    <p className="font-semibold text-gray-900">${pedido.costo_envio?.toLocaleString('es-CL')}</p>
                  </div>
                ) : null}
              </div>

              {pedido.tracking && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                  <Truck className="w-4 h-4 text-[#0F8B6C]" />
                  <div>
                    <p className="text-xs text-gray-400">N° Tracking</p>
                    <p className="font-mono font-bold text-sm text-gray-900">{pedido.tracking}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            {!esCancelado ? (
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <h3 className="font-poppins font-bold text-gray-900 mb-6">Estado del pedido</h3>
                <div className="space-y-0">
                  {PASOS.map((paso, i) => {
                    const completado = i <= pasoActual;
                    const activo = i === pasoActual;
                    const Icon = paso.icon;
                    return (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                            activo ? 'bg-gray-900 text-white shadow-lg' :
                            completado ? 'bg-[#0F8B6C]/10 text-[#0F8B6C]' :
                            'bg-gray-100 text-gray-300'
                          }`}>
                            <Icon className={`w-4 h-4 ${activo ? 'animate-pulse' : ''}`} />
                          </div>
                          {i < PASOS.length - 1 && (
                            <div className={`w-0.5 h-8 mt-1 mb-1 rounded-full transition-colors ${i < pasoActual ? 'bg-[#0F8B6C]' : 'bg-gray-100'}`} />
                          )}
                        </div>
                        <div className="pb-5 pt-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-semibold text-sm ${activo ? 'text-gray-900' : completado ? 'text-gray-600' : 'text-gray-300'}`}>
                              {paso.label}
                            </p>
                            {activo && (
                              <span className="text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded-full font-bold">EN CURSO</span>
                            )}
                          </div>
                          {(activo || completado) && (
                            <p className="text-xs text-gray-400 mt-0.5">{paso.desc}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-center">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="font-poppins font-bold text-red-700 text-lg">{pedido.estado}</p>
                <p className="text-sm text-red-500 mt-1">¿Tienes preguntas? Escríbenos por WhatsApp.</p>
              </div>
            )}

            {/* Personalización */}
            {pedido.requiere_personalizacion && (
              <div className="bg-purple-50 border border-purple-100 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <p className="font-semibold text-purple-700">Pedido con personalización láser</p>
                </div>
                {pedido.texto_personalizacion && (
                  <p className="text-sm text-purple-600">Grabado: "{pedido.texto_personalizacion}"</p>
                )}
                <p className="text-xs text-purple-400 mt-2">
                  {pedido.logo_recibido ? '✓ Logo recibido y en proceso' : '⏳ Esperando logo — revisa tu email'}
                </p>
              </div>
            )}

            {/* Ayuda */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div>
                <p className="font-semibold text-sm text-gray-900">¿Tienes alguna pregunta?</p>
                <p className="text-xs text-gray-400 mt-0.5">Respondemos en &lt;2h por WhatsApp</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a href={`https://wa.me/56935040242?text=Hola, consulto por mi pedido ${pedido.numero_pedido}`} target="_blank" rel="noreferrer">
                  <Button className="gap-2 text-sm rounded-xl" style={{ backgroundColor: '#25D366' }}>
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                </a>
                <Link to="/soporte">
                  <Button variant="outline" size="sm" className="rounded-xl">Centro de ayuda</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Sin resultado */}
        {!pedido && !error && (
          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">¿Perdiste el número de pedido?</p>
              <p className="text-sm text-gray-400 mt-1">Escríbenos con tu nombre y email y te ayudamos de inmediato.</p>
            </div>
            <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2 rounded-xl">
                <MessageCircle className="w-4 h-4" /> Contactar soporte
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}