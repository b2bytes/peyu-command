import { useState, useMemo } from 'react';
import { Search, Filter, Truck, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function BluexDashboardPanel({ envios = [] }) {
  const [searchOT, setSearchOT] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterServicio, setFilterServicio] = useState('todos');

  const ESTADOS = {
    'Pendiente Emision': { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Pendiente' },
    'Etiqueta Generada': { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Etiqueta OK' },
    'En Bodega': { icon: Truck, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Bodega' },
    'Retirado por Courier': { icon: Truck, color: 'text-cyan-500', bg: 'bg-cyan-50', label: 'Retirado' },
    'En Tránsito': { icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Tránsito' },
    'En Reparto': { icon: Truck, color: 'text-green-500', bg: 'bg-green-50', label: 'Reparto' },
    'Entregado': { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Entregado' },
    'No Entregado': { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'No Entregado' },
    'Excepción': { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Excepción' },
  };

  const filtered = useMemo(() => {
    let list = envios;

    // Filtro por búsqueda OT
    if (searchOT) {
      const q = searchOT.toLowerCase();
      list = list.filter(e => 
        e.tracking_number?.toLowerCase().includes(q) ||
        e.numero_pedido?.toLowerCase().includes(q)
      );
    }

    // Filtro por búsqueda cliente
    if (searchCliente) {
      const q = searchCliente.toLowerCase();
      list = list.filter(e => e.cliente_nombre?.toLowerCase().includes(q));
    }

    // Filtro por estado
    if (filterEstado !== 'todos') {
      list = list.filter(e => e.estado === filterEstado);
    }

    // Filtro por servicio
    if (filterServicio !== 'todos') {
      list = list.filter(e => e.servicio === filterServicio);
    }

    return list;
  }, [envios, searchOT, searchCliente, filterEstado, filterServicio]);

  // Estadísticas rápidas
  const stats = useMemo(() => ({
    pendientes_emision: envios.filter(e => e.estado === 'Pendiente Emision').length,
    sin_entregar: envios.filter(e => !['Entregado', 'Anulado'].includes(e.estado)).length,
    con_excepciones: envios.filter(e => e.tiene_excepcion).length,
    atrasados: envios.filter(e => e.atrasado && e.estado !== 'Entregado').length,
  }), [envios]);

  return (
    <div className="space-y-4">
      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pendientes emisión', value: stats.pendientes_emision, color: 'text-gray-600', icon: Clock },
          { label: 'Sin entregar', value: stats.sin_entregar, color: 'text-blue-600', icon: Truck },
          { label: 'Con excepciones', value: stats.con_excepciones, color: 'text-red-600', icon: AlertCircle },
          { label: 'Atrasados', value: stats.atrasados, color: 'text-orange-600', icon: AlertCircle },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-3">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Filtros avanzados</h3>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          {/* Buscar OT */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar OT o pedido..."
              value={searchOT}
              onChange={e => setSearchOT(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Buscar cliente */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchCliente}
              onChange={e => setSearchCliente(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Estado */}
          <select
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
            className="text-sm border border-input rounded-md px-3 h-9 bg-white"
          >
            <option value="todos">Todos los estados</option>
            {Object.keys(ESTADOS).map(est => (
              <option key={est} value={est}>{ESTADOS[est].label}</option>
            ))}
          </select>

          {/* Servicio */}
          <select
            value={filterServicio}
            onChange={e => setFilterServicio(e.target.value)}
            className="text-sm border border-input rounded-md px-3 h-9 bg-white"
          >
            <option value="todos">Todos los servicios</option>
            <option value="EXPRESS">Express</option>
            <option value="PRIORITY">Priority</option>
          </select>
        </div>

        {/* Tags de filtros activos */}
        {(searchOT || searchCliente || filterEstado !== 'todos' || filterServicio !== 'todos') && (
          <div className="flex flex-wrap gap-2 pt-2">
            {searchOT && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                OT: {searchOT}
                <button onClick={() => setSearchOT('')} className="ml-1 hover:text-blue-900">✕</button>
              </span>
            )}
            {searchCliente && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                Cliente: {searchCliente}
                <button onClick={() => setSearchCliente('')} className="ml-1 hover:text-green-900">✕</button>
              </span>
            )}
            {filterEstado !== 'todos' && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                {ESTADOS[filterEstado].label}
                <button onClick={() => setFilterEstado('todos')} className="ml-1 hover:text-purple-900">✕</button>
              </span>
            )}
            {filterServicio !== 'todos' && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                {filterServicio}
                <button onClick={() => setFilterServicio('todos')} className="ml-1 hover:text-amber-900">✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Resultados */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-muted/40 flex items-center justify-between">
          <p className="text-sm font-semibold">
            {filtered.length} envío{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/20 border-t border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-bold">OT / Pedido</th>
                <th className="text-left px-3 py-3 font-bold">Cliente</th>
                <th className="text-left px-3 py-3 font-bold">Destino</th>
                <th className="text-left px-3 py-3 font-bold">Estado</th>
                <th className="text-left px-3 py-3 font-bold">Última novedad</th>
                <th className="text-right px-3 py-3 font-bold">Servicio</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Sin envíos que coincidan con los filtros</p>
                  </td>
                </tr>
              ) : (
                filtered.map(env => {
                  const estadoInfo = ESTADOS[env.estado] || ESTADOS['En Tránsito'];
                  const IconEstado = estadoInfo.icon;
                  return (
                    <tr key={env.id} className="border-t border-border hover:bg-muted/30 transition">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-foreground">{env.tracking_number}</div>
                        {env.numero_pedido && <div className="text-xs text-muted-foreground mt-0.5">Ped: {env.numero_pedido}</div>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-foreground">{env.cliente_nombre}</div>
                        {env.cliente_email && <div className="text-xs text-muted-foreground">{env.cliente_email}</div>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm">{env.comuna_destino}</div>
                        <div className="text-xs text-muted-foreground">{env.region_destino}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.bg}`}>
                          <IconEstado className={`w-3 h-3 ${estadoInfo.color}`} />
                          <span className={estadoInfo.color}>{estadoInfo.label}</span>
                        </div>
                        {env.tiene_excepcion && <div className="text-xs text-red-600 font-bold mt-1">⚠️ Excepción</div>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs text-foreground">{env.ultimo_evento_descripcion || '-'}</div>
                        {env.ultimo_evento_at && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(env.ultimo_evento_at).toLocaleDateString('es-CL')}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {env.servicio || 'EXPRESS'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}