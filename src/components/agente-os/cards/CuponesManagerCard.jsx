import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Tag, Plus, Power, Trash2, Loader2, Search, X } from 'lucide-react';
import ActionButton from '../ActionButton';

const TIPOS = [
  { v: 'porcentaje', label: 'Porcentaje (%)' },
  { v: 'monto_fijo', label: 'Monto fijo (CLP)' },
  { v: 'envio_gratis', label: 'Envío gratis' },
];

// Gestor de cupones de descuento embebido en el chat del Agente OS.
// El founder puede crear, activar/desactivar y eliminar cupones sin salir
// del chat. Muestra vigencia, usos y tipo de descuento de cada cupón.
export default function CuponesManagerCard() {
  const [cupones, setCupones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    codigo: '', tipo: 'porcentaje', valor: '', minimo: '',
    max_descuento: '', usos_max: '', fecha_expiracion: '', descripcion: '',
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Cupon.list('-created_date', 100);
      setCupones(list || []);
    } catch {
      setCupones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const visibles = cupones.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (c.codigo || '').toLowerCase().includes(q) || (c.descripcion || '').toLowerCase().includes(q);
  });

  const generarCodigo = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm({ ...form, codigo: `PEYU-${code}` });
  };

  const crear = async () => {
    if (!form.codigo.trim() || !form.valor) return;
    try {
      await base44.entities.Cupon.create({
        codigo: form.codigo.trim().toUpperCase(),
        tipo: form.tipo,
        valor: Number(form.valor) || 0,
        minimo_compra_clp: Number(form.minimo) || 0,
        max_descuento_clp: form.max_descuento ? Number(form.max_descuento) : undefined,
        usos_max: Number(form.usos_max) || 0,
        fecha_expiracion: form.fecha_expiracion || undefined,
        descripcion: form.descripcion || undefined,
        activo: true,
        usos_actuales: 0,
      });
      setShowForm(false);
      setForm({ codigo: '', tipo: 'porcentaje', valor: '', minimo: '', max_descuento: '', usos_max: '', fecha_expiracion: '', descripcion: '' });
      cargar();
    } catch (e) {
      alert(e?.message || 'Error al crear cupón');
    }
  };

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Tag className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Cupones de descuento</span>
          <span className="text-[11px] text-ld-fg-muted">({visibles.length})</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-medium text-ld-action hover:underline flex items-center gap-1"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancelar' : 'Crear cupón'}
        </button>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <div className="mb-4 space-y-2.5 p-3.5 rounded-xl bg-ld-bg-soft/60 border border-ld-border">
          <div className="flex items-center gap-2">
            <input
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              placeholder="CÓDIGO (ej: BIENVENIDA10)"
              className="flex-1 h-9 px-3 text-sm font-mono uppercase rounded-lg bg-ld-bg border border-ld-border text-ld-fg outline-none focus:border-ld-action"
            />
            <button
              onClick={generarCodigo}
              className="text-[11px] font-medium px-2.5 h-9 rounded-lg ld-glass-soft text-ld-fg-soft whitespace-nowrap"
            >
              Auto 🎲
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="h-9 px-2 text-sm rounded-lg bg-ld-bg border border-ld-border text-ld-fg outline-none focus:border-ld-action"
            >
              {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
            <input
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              placeholder={form.tipo === 'porcentaje' ? 'Valor %' : form.tipo === 'envio_gratis' ? '—' : 'Monto CLP'}
              disabled={form.tipo === 'envio_gratis'}
              type="number"
              className="h-9 px-3 text-sm rounded-lg bg-ld-bg border border-ld-border text-ld-fg outline-none focus:border-ld-action disabled:opacity-40"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.minimo}
              onChange={(e) => setForm({ ...form, minimo: e.target.value })}
              placeholder="Mín. compra CLP"
              type="number"
              className="h-9 px-3 text-sm rounded-lg bg-ld-bg border border-ld-border text-ld-fg outline-none focus:border-ld-action"
            />
            <input
              value={form.usos_max}
              onChange={(e) => setForm({ ...form, usos_max: e.target.value })}
              placeholder="Usos máx (0=∞)"
              type="number"
              className="h-9 px-3 text-sm rounded-lg bg-ld-bg border border-ld-border text-ld-fg outline-none focus:border-ld-action"
            />
          </div>
          <input
            value={form.fecha_expiracion}
            onChange={(e) => setForm({ ...form, fecha_expiracion: e.target.value })}
            type="date"
            className="h-9 px-3 text-sm rounded-lg bg-ld-bg border border-ld-border text-ld-fg outline-none focus:border-ld-action"
          />
          <input
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Descripción interna (opcional)"
            className="w-full h-9 px-3 text-sm rounded-lg bg-ld-bg border border-ld-border text-ld-fg outline-none focus:border-ld-action"
          />
          <ActionButton
            action="toggleCupon"
            payload={{ accion: 'crear', data: form }}
            label="Crear cupón"
            icon={Plus}
            variant="primary"
            confirm={false}
            onDone={cargar}
          />
        </div>
      )}

      {/* Buscador */}
      {!showForm && (
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ld-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código..."
            className="w-full h-9 pl-8 pr-3 text-sm rounded-lg bg-ld-bg-soft border border-ld-border text-ld-fg outline-none focus:border-ld-action"
          />
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-ld-action" /></div>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-ld-fg-muted text-center py-4">No hay cupones. Crea el primero ↑</p>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto peyu-scrollbar">
          {visibles.map((c) => {
            const hoy = new Date().toISOString().slice(0, 10);
            const expirado = c.fecha_expiracion && hoy > c.fecha_expiracion;
            const agotado = c.usos_max && c.usos_actuales >= c.usos_max;
            return (
              <div key={c.id} className="rounded-xl px-3 py-2.5 bg-ld-bg-soft/60 border border-ld-border">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-sm text-ld-fg truncate">{c.codigo}</span>
                    {!c.activo && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-ld-bg-elevated text-ld-fg-muted">Inactivo</span>}
                    {expirado && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">Expirado</span>}
                    {agotado && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Agotado</span>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <ActionButton
                      action="toggleCupon"
                      payload={{ accion: 'toggle', id: c.id, activo: !c.activo }}
                      label={c.activo ? 'Pausar' : 'Activar'}
                      icon={Power}
                      onDone={cargar}
                    />
                    <ActionButton
                      action="toggleCupon"
                      payload={{ accion: 'eliminar', id: c.id }}
                      label=""
                      icon={Trash2}
                      onDone={cargar}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ld-fg-muted">
                  <span className="font-semibold text-ld-action">
                    {c.tipo === 'envio_gratis' ? 'Envío gratis' : c.tipo === 'porcentaje' ? `−${c.valor}%` : `−$${(c.valor || 0).toLocaleString('es-CL')}`}
                  </span>
                  {c.minimo_compra_clp > 0 && <span>Mín ${c.minimo_compra_clp.toLocaleString('es-CL')}</span>}
                  <span>{c.usos_actuales || 0}/{c.usos_max || '∞'} usos</span>
                  {c.fecha_expiracion && <span>Vence {c.fecha_expiracion}</span>}
                </div>
                {c.descripcion && <p className="text-[11px] text-ld-fg-muted mt-0.5 truncate">{c.descripcion}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}