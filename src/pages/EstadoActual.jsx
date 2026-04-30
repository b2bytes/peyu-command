import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Database, Globe, Cpu, Bot, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ROADMAP, STATUS_META, getRoadmapStats, getModuleProgress } from '@/lib/peyu-roadmap';
import RoadmapModule from '@/components/roadmap/RoadmapModule';

/**
 * EstadoActual — Roadmap oficial del ecosistema digital PEYU.
 * Mezcla métricas en vivo desde la BD + estructura editable del roadmap (lib/peyu-roadmap.js).
 */
export default function EstadoActual() {
  const [live, setLive] = useState({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos'); // todos | done | building | planned | optimizing | testing

  useEffect(() => {
    Promise.all([
      base44.entities.Producto.list('-created_date', 1).catch(() => []),
      base44.entities.B2BLead.list('-created_date', 1).catch(() => []),
      base44.entities.CorporateProposal.list('-created_date', 1).catch(() => []),
      base44.entities.PedidoWeb.list('-created_date', 1).catch(() => []),
      base44.entities.GiftCard.list('-created_date', 1).catch(() => []),
      base44.entities.Cliente.list('-created_date', 1).catch(() => []),
    ]).then(async () => {
      // Counts más precisos vía list completo (limitado a 500)
      const [productos, leads, propuestas, pedidos, gcs, clientes] = await Promise.all([
        base44.entities.Producto.list(null, 500).catch(() => []),
        base44.entities.B2BLead.list(null, 500).catch(() => []),
        base44.entities.CorporateProposal.list(null, 500).catch(() => []),
        base44.entities.PedidoWeb.list(null, 500).catch(() => []),
        base44.entities.GiftCard.list(null, 500).catch(() => []),
        base44.entities.Cliente.list(null, 500).catch(() => []),
      ]);
      setLive({
        productos: productos.length,
        leads: leads.length,
        propuestas: propuestas.length,
        pedidos: pedidos.length,
        giftcards: gcs.length,
        clientes: clientes.length,
      });
    });
  }, []);

  const stats = useMemo(() => getRoadmapStats(), []);
  const overallProgress = useMemo(() => {
    const completados = stats.done + stats.optimizing;
    return stats.total > 0 ? Math.round((completados / stats.total) * 100) : 0;
  }, [stats]);

  const filteredModules = useMemo(() => {
    return ROADMAP
      .map(mod => {
        const items = mod.items.filter(it => {
          if (filter !== 'todos' && it.status !== filter) return false;
          if (search) {
            const q = search.toLowerCase();
            return it.name.toLowerCase().includes(q) ||
                   it.fn?.toLowerCase().includes(q) ||
                   it.page?.toLowerCase().includes(q) ||
                   mod.title.toLowerCase().includes(q);
          }
          return true;
        });
        return { ...mod, items };
      })
      .filter(mod => mod.items.length > 0);
  }, [search, filter]);

  return (
    <div className="min-h-screen p-4 lg:p-6 space-y-5"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(15,78,137,0.78) 50%, rgba(15,23,42,0.85) 100%)`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-poppins font-black text-white">Roadmap PEYU · Ecosistema Digital</h1>
          <p className="text-teal-300/80 text-sm mt-1">
            Fuente única de verdad del avance — actualizado al {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
          <RefreshCw className="w-4 h-4 text-teal-300" />
          <span className="text-xs text-teal-200 font-medium">Métricas en vivo desde la BD</span>
        </div>
      </div>

      {/* Hero progreso global */}
      <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/15 backdrop-blur-md border border-emerald-400/30 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1">Avance global del ecosistema</p>
            <p className="text-4xl lg:text-5xl font-poppins font-black text-white">{overallProgress}%</p>
            <p className="text-sm text-white/70 mt-1">{stats.done + stats.optimizing} de {stats.total} soluciones operativas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <div key={key} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-[100px]">
                <div className="text-[10px] uppercase tracking-wider text-white/50 flex items-center gap-1">
                  <span>{meta.emoji}</span>
                  {meta.label}
                </div>
                <div className="text-xl font-poppins font-bold text-white mt-0.5">{stats[key] || 0}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-500" style={{ width: `${(stats.done / stats.total) * 100}%` }} />
          <div className="h-full bg-teal-500" style={{ width: `${(stats.optimizing / stats.total) * 100}%` }} />
          <div className="h-full bg-sky-500" style={{ width: `${(stats.testing / stats.total) * 100}%` }} />
          <div className="h-full bg-amber-500" style={{ width: `${(stats.building / stats.total) * 100}%` }} />
          <div className="h-full bg-slate-500" style={{ width: `${(stats.planned / stats.total) * 100}%` }} />
        </div>
      </div>

      {/* Métricas en vivo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <LiveMetric label="Productos" value={live.productos} icon={Database} />
        <LiveMetric label="Leads B2B" value={live.leads} icon={Bot} />
        <LiveMetric label="Propuestas" value={live.propuestas} icon={Globe} />
        <LiveMetric label="Pedidos Web" value={live.pedidos} icon={Cpu} />
        <LiveMetric label="Gift Cards" value={live.giftcards} icon={Bot} />
        <LiveMetric label="Clientes" value={live.clientes} icon={Database} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar solución, función o ruta…"
            className="pl-9 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {[
            { id: 'todos', label: `Todos · ${stats.total}` },
            { id: 'done', label: `✅ Desplegados · ${stats.done}` },
            { id: 'optimizing', label: `🔧 Optimizando · ${stats.optimizing}` },
            { id: 'testing', label: `🧪 Pruebas · ${stats.testing}` },
            { id: 'building', label: `🚧 Desarrollo · ${stats.building}` },
            { id: 'planned', label: `📋 Planificados · ${stats.planned}` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                filter === f.id ? 'bg-teal-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Módulos */}
      <div className="space-y-2">
        {filteredModules.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-white/50">
            Sin resultados para los filtros aplicados
          </div>
        ) : (
          filteredModules.map(mod => (
            <RoadmapModule
              key={mod.id}
              module={mod}
              progress={getModuleProgress(mod)}
              defaultOpen={!!search || filter !== 'todos'}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-white/30 pb-4">
        Roadmap PEYU · Ecosistema B2B Digital · Fuente: <code className="text-white/50">lib/peyu-roadmap.js</code>
      </div>
    </div>
  );
}

function LiveMetric({ label, value, icon: Icon }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
      <div className="flex items-center gap-1.5 text-white/50 text-[11px] mb-0.5">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-xl font-poppins font-bold text-white">
        {value === undefined ? <span className="text-white/30">…</span> : value}
      </div>
    </div>
  );
}