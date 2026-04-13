import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PersonalizacionFlow from "./PersonalizacionFlow";
import {
  ShoppingCart, Package, TrendingUp, Star, Search, Plus,
  Loader2, Edit2, Truck, CheckCircle2, Clock, AlertCircle,
  XCircle, RefreshCw, BarChart3, Globe, ExternalLink
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const ESTADOS = ["Nuevo", "Confirmado", "En Producción", "Listo para Despacho", "Despachado", "Entregado", "Cancelado", "Reembolsado"];
const CANALES = ["Web Propia", "Shopify", "Instagram", "WhatsApp", "MercadoLibre", "Tienda Física Web"];
const MEDIOS_PAGO = ["WebPay", "Transferencia", "Débito", "Crédito", "MercadoPago", "Efectivo"];
const COURIERS = ["Starken", "Chilexpress", "BlueExpress", "Correos Chile", "Retiro en Tienda", "Pendiente"];
const TIPOS = ["B2C Individual", "B2B Corporativo", "B2B Pyme"];

const STATUS_CONFIG = {
  "Nuevo": { color: '#3b82f6', bg: '#eff6ff', icon: Clock },
  "Confirmado": { color: '#8b5cf6', bg: '#f5f3ff', icon: CheckCircle2 },
  "En Producción": { color: '#f59e0b', bg: '#fffbeb', icon: RefreshCw },
  "Listo para Despacho": { color: '#0F8B6C', bg: '#f0faf7', icon: Package },
  "Despachado": { color: '#0ea5e9', bg: '#f0f9ff', icon: Truck },
  "Entregado": { color: '#22c55e', bg: '#f0fdf4', icon: CheckCircle2 },
  "Cancelado": { color: '#D96B4D', bg: '#fdf3f0', icon: XCircle },
  "Reembolsado": { color: '#9ca3af', bg: '#f9fafb', icon: AlertCircle },
};

const CANAL_COLORS = {
  "Web Propia": '#0F8B6C', "Shopify": '#96bf48', "Instagram": '#e1306c',
  "WhatsApp": '#25D366', "MercadoLibre": '#ffe600', "Tienda Física Web": '#4B4F54'
};

const fmtCLP = (v) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;
const fmtCLPFull = (v) => `$${(v || 0).toLocaleString('es-CL')}`;

const defaultForm = {
  numero_pedido: '', fecha: new Date().toISOString().split('T')[0], canal: 'Web Propia',
  cliente_nombre: '', cliente_email: '', cliente_telefono: '', tipo_cliente: 'B2C Individual',
  sku: '', descripcion_items: '', cantidad: 1, subtotal: 0, costo_envio: 3990,
  descuento: 0, total: 0, medio_pago: 'WebPay', estado: 'Nuevo',
  requiere_personalizacion: false, texto_personalizacion: '', logo_recibido: false,
  ciudad: '', direccion_envio: '', courier: 'Pendiente', tracking: '', notas: ''
};

export default function Ecommerce() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterCanal, setFilterCanal] = useState('todos');
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [showPersonalizacion, setShowPersonalizacion] = useState(false);
  const [personalizandoId, setPersonalizandoId] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.PedidoWeb.list('-fecha', 200);
    setPedidos(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    if (editingId) {
      await base44.entities.PedidoWeb.update(editingId, form);
    } else {
      const num = `PW-${Date.now().toString().slice(-6)}`;
      await base44.entities.PedidoWeb.create({ ...form, numero_pedido: num });
    }
    setSaving(false);
    setShowDialog(false);
    setEditingId(null);
    setForm(defaultForm);
    load();
  };

  const handleEdit = (p) => {
    setForm({ ...defaultForm, ...p });
    setEditingId(p.id);
    setShowDialog(true);
  };

  const handleStatusChange = async (id, newEstado) => {
    await base44.entities.PedidoWeb.update(id, { estado: newEstado });
    // Notificar al cliente si tiene email
    const pedido = pedidos.find(p => p.id === id);
    if (pedido?.cliente_email) {
      const msgs = {
        'Confirmado': 'Tu pedido fue confirmado y está en cola de producción.',
        'Despachado': `Tu pedido fue despachado. ${pedido.tracking ? 'N° tracking: ' + pedido.tracking : 'Pronto recibirás el tracking.'}`,
        'Entregado': '¡Tu pedido fue entregado! Gracias por comprar en Peyu Chile.',
        'Listo para Despacho': 'Tu pedido está listo y pronto será despachado.',
      };
      const msg = msgs[newEstado];
      if (msg) {
        base44.integrations.Core.SendEmail({
          to: pedido.cliente_email,
          subject: `Peyu Chile · Estado de tu pedido: ${newEstado}`,
          body: `<div style="font-family:Inter,sans-serif;padding:24px;max-width:500px"><h2 style="color:#0F8B6C">Actualización de tu pedido 🌿</h2><p>Hola <strong>${pedido.cliente_nombre}</strong>,</p><p>${msg}</p><p style="color:#9ca3af;font-size:12px">Pedido: ${pedido.numero_pedido} · Peyu Chile · +56 9 3504 0242</p></div>`,
          from_name: 'Peyu Chile',
        }).catch(() => {});
      }
    }
    load();
  };

  const handleOpenPersonalizacion = (pedido) => {
    setPersonalizandoId(pedido.id);
    setShowPersonalizacion(true);
  };

  const handleSavePersonalizacion = async (data) => {
    await base44.entities.PedidoWeb.update(personalizandoId, data);
    load();
  };

  // Métricas
  const totalVentas = pedidos.filter(p => p.estado !== 'Cancelado' && p.estado !== 'Reembolsado')
    .reduce((s, p) => s + (p.total || 0), 0);
  const pedidosActivos = pedidos.filter(p => !['Entregado', 'Cancelado', 'Reembolsado'].includes(p.estado)).length;
  const entregados = pedidos.filter(p => p.estado === 'Entregado');
  const ticketPromedio = entregados.length > 0
    ? entregados.reduce((s, p) => s + (p.total || 0), 0) / entregados.length : 0;
  const calificaciones = pedidos.filter(p => p.calificacion_cliente > 0);
  const npsPromedio = calificaciones.length > 0
    ? calificaciones.reduce((s, p) => s + (p.calificacion_cliente || 0), 0) / calificaciones.length : 0;

  // Por canal
  const byCanal = CANALES.map(c => ({
    canal: c,
    count: pedidos.filter(p => p.canal === c).length,
    total: pedidos.filter(p => p.canal === c).reduce((s, p) => s + (p.total || 0), 0),
  })).filter(c => c.count > 0);

  // Métricas de conversión
  const totalConversión = {
    nuevos: pedidos.filter(p => p.estado === 'Nuevo').length,
    confirmados: pedidos.filter(p => !['Nuevo', 'Cancelado'].includes(p.estado)).length,
    despachados: pedidos.filter(p => ['Despachado', 'Entregado'].includes(p.estado)).length,
    entregados: pedidos.filter(p => p.estado === 'Entregado').length,
  };
  const convRate = totalConversión.confirmados > 0 ? Math.round((totalConversión.despachados / totalConversión.confirmados) * 100) : 0;

  // Timeline últimos 14 días
  const hoy = new Date();
  const timeline = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().split('T')[0];
    const dayPedidos = pedidos.filter(p => p.fecha?.startsWith(key) && p.estado !== 'Cancelado');
    return {
      dia: d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }),
      pedidos: dayPedidos.length,
      ventas: dayPedidos.reduce((s, p) => s + (p.total || 0), 0) / 1000,
    };
  });

  // Filtrado
  const filtered = pedidos.filter(p => {
    const matchSearch = !search || p.cliente_nombre?.toLowerCase().includes(search.toLowerCase())
      || p.numero_pedido?.toLowerCase().includes(search.toLowerCase())
      || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === 'todos' || p.estado === filterEstado;
    const matchCanal = filterCanal === 'todos' || p.canal === filterCanal;
    return matchSearch && matchEstado && matchCanal;
  });

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0F8B6C' }} />
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">E-commerce & Tienda Online</h1>
          <p className="text-muted-foreground text-sm mt-1">Pedidos web · Métricas · Despacho · Postventa</p>
        </div>
        <Button onClick={() => { setForm(defaultForm); setEditingId(null); setShowDialog(true); }}
          style={{ background: '#0F8B6C' }} className="text-white gap-2">
          <Plus className="w-4 h-4" /> Nuevo Pedido
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Ventas Web Total', value: fmtCLP(totalVentas), icon: TrendingUp, color: '#0F8B6C', sub: `${pedidos.length} pedidos registrados` },
          { label: 'Pedidos Activos', value: pedidosActivos, icon: ShoppingCart, color: '#f59e0b', sub: 'en proceso' },
          { label: 'Ticket Promedio', value: fmtCLP(ticketPromedio), icon: BarChart3, color: '#0F8B6C', sub: 'pedidos entregados' },
          { label: 'Rating Promedio', value: npsPromedio > 0 ? `${npsPromedio.toFixed(1)} ★` : 'N/A', icon: Star, color: '#f59e0b', sub: `${calificaciones.length} reseñas` },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</p>
                <Icon className="w-4 h-4" style={{ color: k.color }} />
              </div>
              <p className="font-poppins font-bold text-2xl" style={{ color: k.color }}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Alertas pendientes */}
      {pedidos.filter(p => p.estado === 'Nuevo').length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{pedidos.filter(p => p.estado === 'Nuevo').length} pedido(s) nuevo(s) sin confirmar — ¡revisar ahora!</span>
        </div>
      )}
      {pedidos.filter(p => p.estado === 'Listo para Despacho').length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
          <Package className="w-4 h-4 flex-shrink-0" />
          <span>{pedidos.filter(p => p.estado === 'Listo para Despacho').length} pedido(s) listo(s) para despachar</span>
        </div>
      )}

      <Tabs defaultValue="pedidos">
        <TabsList className="bg-muted">
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="canales">Por Canal</TabsTrigger>
        </TabsList>

        {/* PEDIDOS */}
        <TabsContent value="pedidos" className="mt-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pedido, cliente, SKU..." className="pl-9 h-9" />
            </div>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCanal} onValueChange={setFilterCanal}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los canales</SelectItem>
                {CANALES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground bg-white rounded-2xl border border-border">
                <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Sin pedidos. ¡Registra el primero!</p>
              </div>
            )}
            {filtered.map(p => {
              const cfg = STATUS_CONFIG[p.estado] || STATUS_CONFIG['Nuevo'];
              const Icon = cfg.icon;
              return (
                <div key={p.id} className="bg-white rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">{p.numero_pedido}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.color }}>
                          <Icon className="w-3 h-3 inline mr-1" />{p.estado}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{p.canal}</span>
                        {p.requiere_personalizacion && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">✨ Personalización</span>
                        )}
                      </div>
                      <p className="font-semibold text-foreground mt-1">{p.cliente_nombre}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span>{p.fecha}</span>
                        {p.sku && <span>SKU: {p.sku}</span>}
                        {p.cantidad && <span>{p.cantidad} u</span>}
                        {p.ciudad && <span>📍 {p.ciudad}</span>}
                        {p.courier !== 'Pendiente' && p.courier && <span>🚚 {p.courier}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-poppins font-bold text-lg" style={{ color: '#0F8B6C' }}>{fmtCLPFull(p.total)}</p>
                        <p className="text-xs text-muted-foreground">{p.medio_pago}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Select value={p.estado} onValueChange={v => handleStatusChange(p.id, v)}>
                          <SelectTrigger className="h-7 text-xs w-36 border-dashed">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <button onClick={() => handleEdit(p)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 justify-center">
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                        {p.requiere_personalizacion && !p.logo_recibido && (
                          <button onClick={() => handleOpenPersonalizacion(p)} className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 justify-center font-medium">
                            ✨ Logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {p.tracking && (
                    <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                      🔗 Tracking: <span className="font-mono text-foreground">{p.tracking}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-1">Ventas Últimos 14 Días</h3>
              <p className="text-xs text-muted-foreground mb-4">CLP miles · N° pedidos</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dia" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v, n) => [n === 'ventas' ? `$${v}K` : v, n === 'ventas' ? 'Ventas' : 'Pedidos']} />
                  <Area type="monotone" dataKey="ventas" stroke="#0F8B6C" fill="#A7D9C9" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-1">Estado de Pedidos</h3>
              <p className="text-xs text-muted-foreground mb-4">Distribución actual</p>
              <div className="space-y-2">
                {ESTADOS.map(estado => {
                  const count = pedidos.filter(p => p.estado === estado).length;
                  const pct = pedidos.length > 0 ? Math.round(count / pedidos.length * 100) : 0;
                  const cfg = STATUS_CONFIG[estado];
                  if (count === 0) return null;
                  return (
                    <div key={estado} className="flex items-center gap-3">
                      <div className="w-28 text-xs text-muted-foreground truncate">{estado}</div>
                      <div className="flex-1 h-2 bg-muted rounded-full">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                      <div className="text-xs font-semibold w-8 text-right" style={{ color: cfg.color }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Embudo rápido */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
            <h3 className="font-poppins font-semibold mb-4">Embudo de Conversión</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Pedidos', value: pedidos.length, color: '#3b82f6' },
                { label: 'Confirmados', value: pedidos.filter(p => !['Nuevo', 'Cancelado', 'Reembolsado'].includes(p.estado)).length, color: '#8b5cf6' },
                { label: 'Despachados', value: pedidos.filter(p => ['Despachado', 'Entregado'].includes(p.estado)).length, color: '#0ea5e9' },
                { label: 'Entregados', value: pedidos.filter(p => p.estado === 'Entregado').length, color: '#22c55e' },
              ].map((item, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-muted/30">
                  <p className="font-poppins font-bold text-3xl" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                  {i > 0 && pedidos.length > 0 && (
                    <p className="text-xs font-semibold mt-1" style={{ color: item.color }}>
                      {Math.round(item.value / pedidos.length * 100)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* POR CANAL */}
        <TabsContent value="canales" className="mt-4 space-y-4">
          {byCanal.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-white rounded-2xl border border-border">
              <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Sin datos de canales aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
                <h3 className="font-poppins font-semibold mb-4">Ventas por Canal</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byCanal} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="canal" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v) => [`$${(v / 1000).toFixed(0)}K`, 'Ventas']} />
                    <Bar dataKey="total" name="Ventas" radius={[4, 4, 0, 0]}>
                      {byCanal.map((c, i) => <Cell key={i} fill={CANAL_COLORS[c.canal] || '#0F8B6C'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {byCanal.map((c, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CANAL_COLORS[c.canal] || '#0F8B6C' }} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{c.canal}</p>
                      <p className="text-xs text-muted-foreground">{c.count} pedido(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-poppins font-bold" style={{ color: '#0F8B6C' }}>{fmtCLP(c.total)}</p>
                      {pedidos.length > 0 && (
                        <p className="text-xs text-muted-foreground">{Math.round(c.count / pedidos.length * 100)}% del total</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* DIALOG */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Pedido' : 'Nuevo Pedido Web'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2 grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Fecha</label>
                <Input type="date" value={form.fecha} onChange={e => f('fecha', e.target.value)} className="h-8 mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Canal</label>
                <Select value={form.canal} onValueChange={v => f('canal', v)}>
                  <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CANALES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Estado</label>
                <Select value={form.estado} onValueChange={v => f('estado', v)}>
                  <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Cliente</label>
              <Input value={form.cliente_nombre} onChange={e => f('cliente_nombre', e.target.value)} placeholder="Nombre completo" className="h-8 mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input value={form.cliente_email} onChange={e => f('cliente_email', e.target.value)} placeholder="email@..." className="h-8 mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
              <Input value={form.cliente_telefono} onChange={e => f('cliente_telefono', e.target.value)} placeholder="+56 9..." className="h-8 mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <Select value={form.tipo_cliente} onValueChange={v => f('tipo_cliente', v)}>
                <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">SKU Principal</label>
              <Input value={form.sku} onChange={e => f('sku', e.target.value)} placeholder="ej. SOPC-001" className="h-8 mt-1" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Detalle Items</label>
              <Input value={form.descripcion_items} onChange={e => f('descripcion_items', e.target.value)} placeholder="ej. 2x Soporte Celular + 1x Llavero" className="h-8 mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cantidad (u)</label>
              <Input type="number" value={form.cantidad} onChange={e => f('cantidad', Number(e.target.value))} className="h-8 mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Medio de Pago</label>
              <Select value={form.medio_pago} onValueChange={v => f('medio_pago', v)}>
                <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{MEDIOS_PAGO.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Subtotal (CLP)</label>
              <Input type="number" value={form.subtotal} onChange={e => f('subtotal', Number(e.target.value))} className="h-8 mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Envío (CLP)</label>
              <Input type="number" value={form.costo_envio} onChange={e => f('costo_envio', Number(e.target.value))} className="h-8 mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Descuento (CLP)</label>
              <Input type="number" value={form.descuento} onChange={e => f('descuento', Number(e.target.value))} className="h-8 mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Total (CLP)</label>
              <Input type="number" value={form.total} onChange={e => f('total', Number(e.target.value))} className="h-8 mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Ciudad</label>
              <Input value={form.ciudad} onChange={e => f('ciudad', e.target.value)} placeholder="Santiago, Valparaíso..." className="h-8 mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Courier</label>
              <Select value={form.courier} onValueChange={v => f('courier', v)}>
                <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{COURIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground">N° Tracking</label>
              <Input value={form.tracking} onChange={e => f('tracking', e.target.value)} placeholder="Número de seguimiento courier" className="h-8 mt-1" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Dirección Envío</label>
              <Input value={form.direccion_envio} onChange={e => f('direccion_envio', e.target.value)} className="h-8 mt-1" />
            </div>
            <div className="col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.requiere_personalizacion} onChange={e => f('requiere_personalizacion', e.target.checked)} className="w-4 h-4 rounded" />
                Requiere Personalización
              </label>
              {form.requiere_personalizacion && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.logo_recibido} onChange={e => f('logo_recibido', e.target.checked)} className="w-4 h-4 rounded" />
                  Logo Recibido
                </label>
              )}
            </div>
            {form.requiere_personalizacion && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Texto / Logo a grabar</label>
                <Input value={form.texto_personalizacion} onChange={e => f('texto_personalizacion', e.target.value)} className="h-8 mt-1" />
              </div>
            )}
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Notas</label>
              <Input value={form.notas} onChange={e => f('notas', e.target.value)} className="h-8 mt-1" />
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} style={{ background: '#0F8B6C' }} className="text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Guardar cambios' : 'Crear pedido'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Flujo de personalización */}
      {showPersonalizacion && (
        <PersonalizacionFlow
          pedidoId={personalizandoId}
          onClose={() => setShowPersonalizacion(false)}
          onSave={handleSavePersonalizacion}
        />
      )}
    </div>
  );
}