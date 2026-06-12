import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Package, TrendingUp, Clock, DollarSign, Loader2 } from 'lucide-react';
import ClienteHero from '@/components/cliente/ClienteHero';
import ClienteInsights from '@/components/cliente/ClienteInsights';
import ClientePedidosTimeline from '@/components/cliente/ClientePedidosTimeline';
import ClienteNotas from '@/components/cliente/ClienteNotas';
import PersonalizedProductsSummary from '@/components/cliente/PersonalizedProductsSummary';
import RecentQuotesSummary from '@/components/cliente/RecentQuotesSummary';
import B2BProposalHistory from '@/components/cliente/B2BProposalHistory';

// Ficha 360° del cliente — administración uno a uno: identidad, inteligencia,
// historial y notas editables, todo en una sola vista escaneable.
export default function Cliente360() {
  const [params] = useSearchParams();
  const email = params.get('email');
  const [cliente, setCliente] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) { setLoading(false); return; }
    (async () => {
      const [clientes, historialPedidos, propuestas, cotis] = await Promise.all([
        base44.entities.Cliente.filter({ email }),
        base44.entities.PedidoWeb.filter({ cliente_email: email }, '-fecha', 50),
        base44.entities.CorporateProposal.filter({ email }, '-created_date', 25),
        base44.entities.Cotizacion.filter({ email }, '-created_date', 25),
      ]);
      setCliente(clientes[0] || null);
      setPedidos(historialPedidos || []);
      // Unifica propuestas B2B y cotizaciones en una sola lista ordenada.
      const unificadas = [
        ...(propuestas || []).map((p) => ({
          id: p.id, origen: 'B2B', numero: p.numero, estado: p.status,
          fecha: p.fecha_envio || (p.created_date || '').slice(0, 10),
          total: p.total, detalle: p.empresa,
          _t: new Date(p.created_date || 0).getTime(),
        })),
        ...(cotis || []).map((c) => ({
          id: c.id, origen: 'Cotización', numero: c.numero, estado: c.estado,
          fecha: c.fecha_envio || (c.created_date || '').slice(0, 10),
          total: c.total, detalle: c.sku,
          _t: new Date(c.created_date || 0).getTime(),
        })),
      ].sort((a, b) => b._t - a._t);
      setCotizaciones(unificadas);
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <Link to="/admin/clientes" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-teal-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver a clientes
        </Link>

        <div className="space-y-5">
          {/* Identidad + acciones rápidas */}
          <ClienteHero cliente={cliente} onClienteUpdate={setCliente} />

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPI icon={DollarSign} label="CLV Total" value={`$${totalCompras.toLocaleString('es-CL')}`} color="green" />
            <KPI icon={Package} label="Pedidos" value={numPedidos} color="teal" />
            <KPI icon={TrendingUp} label="Ticket prom." value={`$${ticketProm.toLocaleString('es-CL')}`} color="blue" />
            <KPI icon={Clock} label="Última compra" value={diasDesdeUltima !== null ? `${diasDesdeUltima}d` : '—'} color={diasDesdeUltima > 90 ? 'red' : 'purple'} />
          </div>

          {/* Inteligencia del cliente */}
          <ClienteInsights cliente={cliente} pedidos={pedidos} cotizaciones={cotizaciones} />

          {/* Histórico + notas lado a lado en desktop */}
          <div className="grid lg:grid-cols-3 gap-5 items-start">
            <div className="lg:col-span-2">
              <ClientePedidosTimeline pedidos={pedidos} />
            </div>
            <ClienteNotas cliente={cliente} onClienteUpdate={setCliente} />
          </div>

          {/* Historial B2B propuestas */}
          <B2BProposalHistory empresa={cliente.empresa || cliente.contacto} />

          {/* Resumen: productos personalizados (con archivos) + cotizaciones */}
          <div className="grid lg:grid-cols-2 gap-5">
            <PersonalizedProductsSummary pedidos={pedidos} />
            <RecentQuotesSummary cotizaciones={cotizaciones} />
          </div>
        </div>
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
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[color]} text-white flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}