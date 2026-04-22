import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Mail, Phone, MapPin, Package, TrendingUp, Award, Clock, Sparkles, DollarSign, Loader2 } from 'lucide-react';

export default function Cliente360() {
  const [params] = useSearchParams();
  const email = params.get('email');
  const [cliente, setCliente] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) { setLoading(false); return; }
    (async () => {
      const [clientes, historialPedidos] = await Promise.all([
        base44.entities.Cliente.filter({ email }),
        base44.entities.PedidoWeb.filter({ cliente_email: email }, '-fecha', 50),
      ]);
      setCliente(clientes[0] || null);
      setPedidos(historialPedidos || []);
      setLoading(false);
    })();
  }, [email]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>;
  }

  if (!email || !cliente) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <p className="text-gray-700 mb-4">Cliente no encontrado {email ? `(${email})` : ''}.</p>
        <Link to="/admin/clientes" className="text-teal-700 hover:underline text-sm">← Volver a Clientes</Link>
      </div>
    );
  }

  const totalCompras = cliente.total_compras_clp || 0;
  const ticketProm = cliente.ticket_promedio || 0;
  const numPedidos = cliente.num_pedidos || pedidos.length;
  const ultimaCompra = cliente.fecha_ultima_compra;
  const diasDesdeUltima = ultimaCompra ? Math.floor((Date.now() - new Date(ultimaCompra).getTime()) / 86400000) : null;
  const segmentColor = {
    'VIP': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Activo': 'bg-green-100 text-green-800 border-green-300',
    'En Riesgo': 'bg-red-100 text-red-800 border-red-300',
    'Inactivo': 'bg-gray-100 text-gray-700 border-gray-300',
  }[cliente.estado] || 'bg-gray-100 text-gray-700 border-gray-300';

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <Link to="/admin/clientes" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-teal-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver a clientes
        </Link>

        {/* Hero */}
        <div className="bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 rounded-2xl p-6 text-white mb-5 shadow-xl">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold">{cliente.empresa || cliente.contacto}</h1>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${segmentColor} bg-white/90`}>
                  {cliente.estado || 'Activo'}
                </span>
              </div>
              <p className="text-white/80 text-sm">{cliente.tipo} · {cliente.segmento || 'Sin segmento'}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                {cliente.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {cliente.email}</span>}
                {cliente.telefono && (
                  <a href={`https://wa.me/${cliente.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline">
                    <Phone className="w-3.5 h-3.5" /> {cliente.telefono}
                  </a>
                )}
              </div>
            </div>
            {cliente.estado === 'VIP' && <Award className="w-12 h-12 text-yellow-300 opacity-80" />}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <KPI icon={DollarSign} label="CLV Total" value={`$${totalCompras.toLocaleString('es-CL')}`} color="green" />
          <KPI icon={Package} label="Pedidos" value={numPedidos} color="teal" />
          <KPI icon={TrendingUp} label="Ticket prom." value={`$${ticketProm.toLocaleString('es-CL')}`} color="blue" />
          <KPI icon={Clock} label="Última compra" value={diasDesdeUltima !== null ? `${diasDesdeUltima}d` : '—'} color={diasDesdeUltima > 90 ? 'red' : 'purple'} />
        </div>

        {/* Histórico */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" /> Histórico de pedidos
          </h2>
          {pedidos.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Sin pedidos registrados aún</p>
          ) : (
            <div className="space-y-2">
              {pedidos.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                        {p.numero_pedido || p.id.slice(-6)}
                        {p.requiere_personalizacion && <Sparkles className="w-3.5 h-3.5 text-purple-500" />}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.fecha} · {p.cantidad || 1}u · {p.ciudad || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900">${(p.total || 0).toLocaleString('es-CL')}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      p.estado === 'Entregado' ? 'bg-green-100 text-green-700' :
                      p.estado === 'Cancelado' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{p.estado}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notas */}
        {cliente.notas && (
          <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-yellow-900 mb-1">📝 Notas internas</h3>
            <p className="text-sm text-yellow-800 whitespace-pre-line">{cliente.notas}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, color }) {
  const colors = {
    teal: 'from-teal-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-indigo-500',
    red: 'from-red-500 to-orange-500',
    purple: 'from-purple-500 to-pink-500',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[color]} text-white flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}