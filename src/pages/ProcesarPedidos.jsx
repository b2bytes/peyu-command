import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Package, Search, RefreshCw, TrendingUp, AlertTriangle, DollarSign, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PedidoKanbanCard from '../components/pedidos/PedidoKanbanCard';
import PedidoDetailDrawer from '../components/pedidos/PedidoDetailDrawer';
import PaymentStatusTabs from '../components/pedidos/PaymentStatusTabs';

const COLUMNAS = [
  { key: 'Nuevo', label: 'Nuevo', color: 'bg-amber-500' },
  { key: 'Confirmado', label: 'Confirmado', color: 'bg-blue-500' },
  { key: 'En Producción', label: 'En Producción', color: 'bg-purple-500' },
  { key: 'Listo para Despacho', label: 'Listo Despacho', color: 'bg-teal-500' },
  { key: 'Despachado', label: 'Despachado', color: 'bg-cyan-500' },
  { key: 'Entregado', label: 'Entregado', color: 'bg-green-500' },
];

export default function ProcesarPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [paymentTab, setPaymentTab] = useState('todos');

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.PedidoWeb.list('-fecha', 300);
    setPedidos(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Conteos por payment_status sobre la lista completa (no afectados por search)
  const paymentCounts = useMemo(() => {
    const c = { todos: pedidos.length, paid: 0, pending_mp: 0, manual_review: 0, expired: 0, failed: 0 };
    pedidos.forEach(p => {
      const ps = p.payment_status;
      if (ps && c[ps] !== undefined) c[ps]++;
    });
    return c;
  }, [pedidos]);

  const filtered = useMemo(() => {
    let list = pedidos;
    if (paymentTab !== 'todos') {
      list = list.filter(p => p.payment_status === paymentTab);
    }
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(p =>
      p.numero_pedido?.toLowerCase().includes(q) ||
      p.cliente_nombre?.toLowerCase().includes(q) ||
      p.cliente_email?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q)
    );
  }, [pedidos, search, paymentTab]);

  const porEstado = useMemo(() => {
    const map = {};
    COLUMNAS.forEach(c => { map[c.key] = []; });
    filtered.forEach(p => {
      if (map[p.estado]) map[p.estado].push(p);
    });
    return map;
  }, [filtered]);

  const stats = useMemo(() => {
    const activos = filtered.filter(p => !['Entregado', 'Cancelado'].includes(p.estado));
    const totalActivos = activos.reduce((s, p) => s + (p.total || 0), 0);
    const urgentes = porEstado['Nuevo']?.filter(p => {
      const d = Math.floor((Date.now() - new Date(p.fecha).getTime()) / 86400000);
      return d >= 1;
    }).length || 0;
    const clientesUnicos = new Set(filtered.map(p => p.cliente_email).filter(Boolean)).size;
    return { activos: activos.length, totalActivos, urgentes, clientesUnicos };
  }, [filtered, porEstado]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-7 h-7 text-teal-600" /> Procesar Pedidos
            </h1>
            <p className="text-sm text-gray-600">Gestiona el flujo completo post-venta con notificaciones automáticas al cliente.</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard icon={Package} label="Pedidos activos" value={stats.activos} color="teal" />
          <StatCard icon={DollarSign} label="Valor en proceso" value={`$${(stats.totalActivos / 1000).toFixed(0)}k`} color="green" />
          <StatCard icon={AlertTriangle} label="Urgentes (+24h)" value={stats.urgentes} color="red" urgent={stats.urgentes > 0} />
          <StatCard icon={Users} label="Clientes únicos" value={stats.clientesUnicos} color="blue" />
        </div>

        {/* Tabs de payment_status */}
        <PaymentStatusTabs active={paymentTab} onChange={setPaymentTab} counts={paymentCounts} />

        {/* Buscador */}
        <div className="mb-5 relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por N° pedido, cliente, email o SKU..."
            className="pl-9 bg-white"
          />
        </div>

        {/* Kanban */}
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNAS.map(col => {
            const items = porEstado[col.key] || [];
            const total = items.reduce((s, p) => s + (p.total || 0), 0);
            return (
              <div key={col.key} className="flex-shrink-0 w-72">
                <div className="bg-white rounded-t-xl border border-b-0 border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${col.color}`} />
                      <h3 className="text-sm font-bold text-gray-900">{col.label}</h3>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    </div>
                    <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  {total > 0 && (
                    <p className="text-[10px] text-gray-500 mt-0.5">${(total / 1000).toFixed(0)}k CLP en esta columna</p>
                  )}
                </div>
                <div className="bg-gray-100 rounded-b-xl border border-t-0 border-gray-200 p-2 space-y-2 min-h-[500px] max-h-[70vh] overflow-y-auto">
                  {loading && items.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-400">Cargando...</div>
                  )}
                  {!loading && items.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-400">Sin pedidos</div>
                  )}
                  {items.map(p => (
                    <PedidoKanbanCard key={p.id} pedido={p} onClick={() => setSelected(p)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <PedidoDetailDrawer
          pedido={selected}
          onClose={() => setSelected(null)}
          onUpdate={load}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, urgent }) {
  const colors = {
    teal: 'from-teal-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    red: 'from-red-500 to-orange-500',
    blue: 'from-blue-500 to-indigo-500',
  };
  return (
    <div className={`bg-white border rounded-xl p-4 ${urgent ? 'border-red-200 ring-1 ring-red-200' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${colors[color]} text-white flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        {label}
      </div>
      <div className={`text-2xl font-bold ${urgent ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
    </div>
  );
}