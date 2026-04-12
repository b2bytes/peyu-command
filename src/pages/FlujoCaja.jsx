import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Trash2, Edit2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import moment from "moment";

const CATEGORIAS_INGRESO = ["Venta B2B", "Venta B2C", "Venta Tienda", "Anticipo Cliente", "Otro Ingreso"];
const CATEGORIAS_EGRESO = ["Materia Prima", "Remuneraciones", "Arriendo / Servicios", "Marketing", "Logística / Courier", "Maquinaria / Mantención", "Impuestos / Contabilidad", "Otro Egreso"];
const MEDIOS = ["Transferencia", "WebPay", "Efectivo", "Débito", "Crédito", "Cheque"];

const fmt = (n) => `$${Math.abs(n || 0).toLocaleString('es-CL')}`;

const DEFAULTS = {
  fecha: moment().format('YYYY-MM-DD'),
  tipo: 'Ingreso', categoria: '', descripcion: '', monto: 0,
  referencia: '', empresa: '', medio_pago: 'Transferencia', conciliado: false
};

function MovRow({ mov, onEdit, onDelete, onToggle }) {
  const isIngreso = mov.tipo === 'Ingreso';
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-border hover:shadow-sm transition-shadow">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isIngreso ? 'bg-green-50' : 'bg-red-50'}`}>
        {isIngreso ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{mov.descripcion || mov.categoria}</p>
          {mov.conciliado && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground">{mov.categoria} • {mov.fecha} {mov.empresa ? `• ${mov.empresa}` : ''}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`font-poppins font-semibold text-sm ${isIngreso ? 'text-green-700' : 'text-red-600'}`}>
          {isIngreso ? '+' : '-'}{fmt(mov.monto)}
        </p>
        <p className="text-xs text-muted-foreground">{mov.medio_pago}</p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => onToggle(mov)} className="p-1.5 hover:bg-muted rounded-lg" title="Marcar conciliado">
          <CheckCircle2 className={`w-3.5 h-3.5 ${mov.conciliado ? 'text-green-500' : 'text-muted-foreground'}`} />
        </button>
        <button onClick={() => onEdit(mov)} className="p-1.5 hover:bg-muted rounded-lg"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
        <button onClick={() => onDelete(mov.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
      </div>
    </div>
  );
}

export default function FlujoCaja() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULTS);
  const [filtroMes, setFiltroMes] = useState(moment().format('YYYY-MM'));
  const [tab, setTab] = useState('movimientos');

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.MovimientoCaja.list('-fecha', 500);
    setMovimientos(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setForm(DEFAULTS); setShowModal(true); };
  const openEdit = (m) => { setEditing(m); setForm(m); setShowModal(true); };

  const handleSave = async () => {
    if (editing) await base44.entities.MovimientoCaja.update(editing.id, form);
    else await base44.entities.MovimientoCaja.create(form);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar movimiento?')) return;
    await base44.entities.MovimientoCaja.delete(id);
    loadData();
  };

  const handleToggle = async (mov) => {
    await base44.entities.MovimientoCaja.update(mov.id, { conciliado: !mov.conciliado });
    loadData();
  };

  // Filtro por mes
  const delMes = movimientos.filter(m => m.fecha && m.fecha.startsWith(filtroMes));
  const ingresosMes = delMes.filter(m => m.tipo === 'Ingreso').reduce((s, m) => s + (m.monto || 0), 0);
  const egresosMes = delMes.filter(m => m.tipo === 'Egreso').reduce((s, m) => s + (m.monto || 0), 0);
  const saldoMes = ingresosMes - egresosMes;

  const totalHistorico = movimientos.reduce((s, m) => s + (m.tipo === 'Ingreso' ? m.monto : -m.monto) || 0, 0);

  // Gráfico por semana del mes seleccionado
  const semanas = {};
  delMes.forEach(m => {
    const sem = `S${Math.ceil(parseInt(m.fecha.split('-')[2]) / 7)}`;
    if (!semanas[sem]) semanas[sem] = { semana: sem, Ingresos: 0, Egresos: 0 };
    if (m.tipo === 'Ingreso') semanas[sem].Ingresos += m.monto || 0;
    else semanas[sem].Egresos += m.monto || 0;
  });
  const chartSemanas = Object.values(semanas).sort((a, b) => a.semana.localeCompare(b.semana));

  // Evolución últimos 6 meses
  const meses6 = [];
  for (let i = 5; i >= 0; i--) {
    const m = moment().subtract(i, 'months').format('YYYY-MM');
    const label = moment().subtract(i, 'months').format('MMM');
    const ing = movimientos.filter(x => x.fecha?.startsWith(m) && x.tipo === 'Ingreso').reduce((s, x) => s + (x.monto || 0), 0);
    const eg = movimientos.filter(x => x.fecha?.startsWith(m) && x.tipo === 'Egreso').reduce((s, x) => s + (x.monto || 0), 0);
    meses6.push({ mes: label, Ingresos: ing, Egresos: eg, Saldo: ing - eg });
  }

  // Gastos por categoría del mes
  const porCategoria = {};
  delMes.filter(m => m.tipo === 'Egreso').forEach(m => {
    porCategoria[m.categoria] = (porCategoria[m.categoria] || 0) + (m.monto || 0);
  });

  // Meses disponibles para selector
  const mesesDisp = [...new Set(movimientos.map(m => m.fecha?.slice(0, 7)).filter(Boolean))].sort().reverse();
  if (!mesesDisp.includes(filtroMes)) mesesDisp.unshift(filtroMes);

  const categorias = form.tipo === 'Ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Flujo de Caja</h1>
          <p className="text-muted-foreground text-sm mt-1">Control de ingresos, egresos y liquidez operacional</p>
        </div>
        <Button onClick={openNew} style={{ background: '#0F8B6C' }} className="text-white hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />Nuevo Movimiento
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Ingresos del Mes', value: fmt(ingresosMes), color: '#0F8B6C', bg: '#f0faf7', icon: TrendingUp },
          { label: 'Egresos del Mes', value: fmt(egresosMes), color: '#D96B4D', bg: '#fdf3f0', icon: TrendingDown },
          { label: 'Saldo Neto Mes', value: fmt(saldoMes), color: saldoMes >= 0 ? '#0F8B6C' : '#D96B4D', bg: saldoMes >= 0 ? '#f0faf7' : '#fdf3f0', icon: DollarSign },
          { label: 'Saldo Histórico', value: fmt(totalHistorico), color: totalHistorico >= 0 ? '#0F8B6C' : '#D96B4D', bg: '#f5f5f5', icon: totalHistorico >= 0 ? TrendingUp : AlertTriangle },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-4 border border-border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="font-poppins font-bold text-lg mt-1" style={{ color: k.color }}>{k.value}</p>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
                  <Icon className="w-4 h-4" style={{ color: k.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selector mes */}
      <div className="flex items-center gap-3">
        <Select value={filtroMes} onValueChange={setFiltroMes}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mesesDisp.map(m => <SelectItem key={m} value={m}>{moment(m).format('MMMM YYYY')}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{delMes.length} movimientos</span>
        {delMes.filter(m => !m.conciliado).length > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
            {delMes.filter(m => !m.conciliado).length} sin conciliar
          </span>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
        </TabsList>

        <TabsContent value="movimientos" className="mt-4 space-y-2">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando...</div>
          ) : delMes.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Sin movimientos en este período.</p>
            </div>
          ) : (
            <>
              {/* Ingresos */}
              {delMes.filter(m => m.tipo === 'Ingreso').length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2 px-1">Ingresos</p>
                  <div className="space-y-2">
                    {delMes.filter(m => m.tipo === 'Ingreso').map(m => (
                      <MovRow key={m.id} mov={m} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} />
                    ))}
                  </div>
                </div>
              )}
              {/* Egresos */}
              {delMes.filter(m => m.tipo === 'Egreso').length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 px-1">Egresos</p>
                  <div className="space-y-2">
                    {delMes.filter(m => m.tipo === 'Egreso').map(m => (
                      <MovRow key={m.id} mov={m} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="graficos" className="mt-4 space-y-5">
          {/* Saldo por semana */}
          <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
            <h3 className="font-poppins font-semibold text-sm mb-4">Ingresos vs Egresos — {moment(filtroMes).format('MMMM YYYY')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartSemanas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={v => fmt(v)} />
                <Legend />
                <Bar dataKey="Ingresos" fill="#0F8B6C" radius={[4,4,0,0]} />
                <Bar dataKey="Egresos" fill="#D96B4D" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Evolución 6 meses */}
          <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
            <h3 className="font-poppins font-semibold text-sm mb-4">Saldo Neto — Últimos 6 meses</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={meses6}>
                <defs>
                  <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F8B6C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0F8B6C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={v => fmt(v)} />
                <Area type="monotone" dataKey="Saldo" stroke="#0F8B6C" fill="url(#saldoGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Gastos por categoría del mes */}
          {Object.keys(porCategoria).length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
              <h3 className="font-poppins font-semibold text-sm mb-4">Egresos por Categoría — {moment(filtroMes).format('MMMM')}</h3>
              <div className="space-y-2">
                {Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, monto]) => {
                  const pct = Math.round((monto / egresosMes) * 100);
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground">{cat}</span>
                        <span className="font-medium text-red-600">{fmt(monto)} <span className="text-muted-foreground">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-peyu-terracota" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editing ? 'Editar' : 'Nuevo'} Movimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tipo *</label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v, categoria: '' })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ingreso">💚 Ingreso</SelectItem>
                    <SelectItem value="Egreso">🔴 Egreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Fecha *</label>
                <Input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Categoría *</label>
              <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Descripción</label>
              <Input value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} className="mt-1" placeholder="Detalle del movimiento" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Monto (CLP) *</label>
                <Input type="number" value={form.monto || ''} onChange={e => setForm({ ...form, monto: +e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Medio de Pago</label>
                <Select value={form.medio_pago || ''} onValueChange={v => setForm({ ...form, medio_pago: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{MEDIOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Empresa / Proveedor</label>
                <Input value={form.empresa || ''} onChange={e => setForm({ ...form, empresa: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Referencia / Doc N°</label>
                <Input value={form.referencia || ''} onChange={e => setForm({ ...form, referencia: e.target.value })} className="mt-1" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.conciliado || false} onChange={e => setForm({ ...form, conciliado: e.target.checked })} />
              Conciliado / Verificado
            </label>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1 text-white" style={{ background: '#0F8B6C' }}>Guardar</Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}