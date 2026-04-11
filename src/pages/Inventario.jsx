import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Package, AlertTriangle, TrendingDown, CheckCircle2,
  Plus, Edit2, Loader2, Search, BarChart3
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const STOCK_MINIMO = {
  'KIT-ESCR-001': 20,
  'SOPC-001': 100,
  'SONB-001': 50,
  'CACH-001': 20,
  'LAMP-001': 15,
  'LLAV-001': 150,
  'MACE-001': 30,
  'POSAV-001': 40,
  'CARC-001': 20,
};

const getStockStatus = (sku, stock) => {
  const min = STOCK_MINIMO[sku] || 20;
  if (stock === 0) return { label: 'Sin Stock', color: '#D96B4D', bg: '#fdf3f0', icon: AlertTriangle, barColor: '#D96B4D' };
  if (stock < min) return { label: 'Stock Bajo', color: '#f59e0b', bg: '#fffbeb', icon: TrendingDown, barColor: '#f59e0b' };
  return { label: 'OK', color: '#0F8B6C', bg: '#f0faf7', icon: CheckCircle2, barColor: '#0F8B6C' };
};

const fmtCLP = (v) => v >= 1_000_000 ? `$${(v/1_000_000).toFixed(1)}M` : `$${(v/1_000).toFixed(0)}K`;

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('todas');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [editingId, setEditingId] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.Producto.list('-stock_actual', 100);
    setProductos(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleUpdateStock = async (id) => {
    setSaving(true);
    await base44.entities.Producto.update(id, { stock_actual: Number(newStock) });
    setSaving(false);
    setEditingId(null);
    loadData();
  };

  // Computed
  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
  const totalUnidades = productos.reduce((s, p) => s + (p.stock_actual || 0), 0);
  const sinStock = productos.filter(p => (p.stock_actual || 0) === 0).length;
  const stockBajo = productos.filter(p => {
    const min = STOCK_MINIMO[p.sku] || 20;
    return (p.stock_actual || 0) > 0 && (p.stock_actual || 0) < min;
  }).length;

  // Valor estimado inventario (usando precio B2C como referencia)
  const valorInventario = productos.reduce((s, p) => s + (p.stock_actual || 0) * ((p.precio_b2c || 0) * 0.45), 0);

  const filtered = productos.filter(p => {
    const matchSearch = !search || p.nombre?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'todas' || p.categoria === filterCat;
    const status = getStockStatus(p.sku, p.stock_actual || 0);
    const matchStatus = filterStatus === 'todos' ||
      (filterStatus === 'ok' && status.label === 'OK') ||
      (filterStatus === 'bajo' && status.label === 'Stock Bajo') ||
      (filterStatus === 'sin' && status.label === 'Sin Stock');
    return matchSearch && matchCat && matchStatus;
  });

  // Chart data
  const chartData = [...productos]
    .sort((a, b) => (b.stock_actual || 0) - (a.stock_actual || 0))
    .map(p => ({
      sku: p.sku,
      nombre: p.nombre?.split(' ').slice(0, 2).join(' '),
      stock: p.stock_actual || 0,
      minimo: STOCK_MINIMO[p.sku] || 20,
    }));

  // Por categoría
  const byCat = categorias.map(cat => {
    const prods = productos.filter(p => p.categoria === cat);
    return {
      categoria: cat,
      total: prods.reduce((s, p) => s + (p.stock_actual || 0), 0),
      productos: prods.length,
    };
  });

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0F8B6C' }} />
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Inventario & Stock</h1>
          <p className="text-muted-foreground text-sm mt-1">Control de stock · Alertas · Valor inventario</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Unidades', value: totalUnidades.toLocaleString('es-CL'), color: '#0F8B6C', sub: `${productos.length} SKUs activos` },
          { label: 'Valor Inventario Est.', value: fmtCLP(valorInventario), color: '#0F8B6C', sub: 'costo ~45% precio B2C' },
          { label: 'Sin Stock', value: sinStock, color: sinStock > 0 ? '#D96B4D' : '#9ca3af', sub: 'SKUs en cero' },
          { label: 'Stock Bajo', value: stockBajo, color: stockBajo > 0 ? '#f59e0b' : '#9ca3af', sub: 'bajo mínimo operacional' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</p>
            <p className="font-poppins font-bold text-2xl mt-1" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Alertas críticas */}
      {(sinStock > 0 || stockBajo > 0) && (
        <div className="space-y-2">
          {productos.filter(p => (p.stock_actual || 0) === 0).map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span><strong>{p.nombre}</strong> ({p.sku}) — Sin stock. Reabastecer urgente.</span>
              <button onClick={() => { setEditingId(p.id); setNewStock('0'); }} className="ml-auto text-xs underline">Actualizar</button>
            </div>
          ))}
          {productos.filter(p => {
            const min = STOCK_MINIMO[p.sku] || 20;
            return (p.stock_actual || 0) > 0 && (p.stock_actual || 0) < min;
          }).map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <TrendingDown className="w-4 h-4 flex-shrink-0" />
              <span><strong>{p.nombre}</strong> — {p.stock_actual} u · mínimo {STOCK_MINIMO[p.sku] || 20} u</span>
              <button onClick={() => { setEditingId(p.id); setNewStock(String(p.stock_actual || '')); }} className="ml-auto text-xs underline">Actualizar</button>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="tabla">
        <TabsList className="bg-muted">
          <TabsTrigger value="tabla">Tabla de Stock</TabsTrigger>
          <TabsTrigger value="visual">Vista Visual</TabsTrigger>
          <TabsTrigger value="categoria">Por Categoría</TabsTrigger>
        </TabsList>

        {/* ── TABLA ── */}
        <TabsContent value="tabla" className="mt-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar SKU o nombre..." className="pl-9 h-9" />
            </div>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ok">✅ OK</SelectItem>
                <SelectItem value="bajo">⚠️ Stock Bajo</SelectItem>
                <SelectItem value="sin">🔴 Sin Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Categoría</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Stock</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Mínimo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Precio B2C</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const status = getStockStatus(p.sku, p.stock_actual || 0);
                  const Icon = status.icon;
                  const min = STOCK_MINIMO[p.sku] || 20;
                  const pct = min > 0 ? Math.min(100, Math.round((p.stock_actual || 0) / (min * 3) * 100)) : 100;
                  return (
                    <tr key={p.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${(p.stock_actual || 0) === 0 ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">{p.material}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{p.categoria}</td>
                      <td className="px-4 py-3 text-right">
                        {editingId === p.id ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Input type="number" value={newStock} onChange={e => setNewStock(e.target.value)}
                              className="h-7 w-20 text-right text-xs" />
                            <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleUpdateStock(p.id)} disabled={saving}
                              style={{ background: '#0F8B6C' }}>
                              {saving ? '...' : '✓'}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingId(null)}>✕</Button>
                          </div>
                        ) : (
                          <div>
                            <span className="font-poppins font-bold" style={{ color: status.color }}>{(p.stock_actual || 0).toLocaleString('es-CL')}</span>
                            <div className="h-1 bg-muted rounded-full mt-1 w-16 ml-auto">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: status.barColor }} />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">{min}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium`}
                          style={{ background: status.bg, color: status.color }}>
                          <Icon className="w-3 h-3" />{status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        {p.precio_b2c ? `$${p.precio_b2c.toLocaleString('es-CL')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setEditingId(p.id); setNewStock(String(p.stock_actual || '')); }}
                          className="p-1.5 hover:bg-muted rounded-lg">
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── VISUAL ── */}
        <TabsContent value="visual" className="mt-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
            <h3 className="font-poppins font-semibold mb-1">Stock por SKU</h3>
            <p className="text-xs text-muted-foreground mb-4">Unidades disponibles · Línea = stock mínimo</p>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="sku" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      const status = getStockStatus(d.sku, d.stock);
                      return (
                        <div className="bg-white border border-border rounded-xl p-3 shadow-lg text-xs">
                          <p className="font-bold text-foreground">{d.nombre}</p>
                          <p>Stock: <span className="font-bold" style={{ color: status.color }}>{d.stock} u</span></p>
                          <p className="text-muted-foreground">Mínimo: {d.minimo} u</p>
                          <p style={{ color: status.color }}>{status.label}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="stock" name="Stock" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => {
                      const s = getStockStatus(entry.sku, entry.stock);
                      return <Cell key={i} fill={s.barColor} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="text-center py-12 text-muted-foreground">Sin productos</div>}
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
            {productos.map(p => {
              const status = getStockStatus(p.sku, p.stock_actual || 0);
              const min = STOCK_MINIMO[p.sku] || 20;
              const pct = min > 0 ? Math.min(100, Math.round((p.stock_actual || 0) / (min * 3) * 100)) : 100;
              return (
                <div key={p.id} className={`bg-white rounded-xl p-4 border shadow-sm ${(p.stock_actual||0)===0?'border-red-200':(p.stock_actual||0)<min?'border-amber-200':'border-border'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium`} style={{ background: status.bg, color: status.color }}>{status.label}</span>
                  </div>
                  <p className="font-medium text-sm text-foreground line-clamp-2 mb-2">{p.nombre}</p>
                  <p className="font-poppins font-bold text-2xl" style={{ color: status.color }}>{(p.stock_actual || 0).toLocaleString('es-CL')}</p>
                  <p className="text-xs text-muted-foreground">unidades · mín {min}</p>
                  <div className="h-1.5 bg-muted rounded-full mt-2">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: status.barColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── POR CATEGORÍA ── */}
        <TabsContent value="categoria" className="mt-4 space-y-3">
          {byCat.map((cat, i) => {
            const prods = productos.filter(p => p.categoria === cat.categoria);
            const conAlerta = prods.filter(p => {
              const min = STOCK_MINIMO[p.sku] || 20;
              return (p.stock_actual || 0) < min;
            }).length;
            return (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-poppins font-semibold text-foreground">{cat.categoria}</h3>
                    <p className="text-xs text-muted-foreground">{cat.productos} SKUs · {conAlerta > 0 ? `${conAlerta} con alerta` : 'Sin alertas'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-poppins font-bold text-xl" style={{ color: '#0F8B6C' }}>{cat.total.toLocaleString('es-CL')}</p>
                    <p className="text-xs text-muted-foreground">unidades</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {prods.map(p => {
                    const status = getStockStatus(p.sku, p.stock_actual || 0);
                    return (
                      <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: status.barColor }} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{p.nombre?.split(' ').slice(0,3).join(' ')}</p>
                          <p className="text-xs" style={{ color: status.color }}>{p.stock_actual || 0} u</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}