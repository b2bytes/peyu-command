import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Gift, Plus, Search, Loader2, X, Ban, RefreshCw, Mail } from 'lucide-react';
import ActionButton from '../ActionButton';

const MONTOS_PRESET = [10000, 20000, 50000, 100000];

// Gestor de Gift Cards embebido en el chat del Agente OS.
// El founder ve todas las GC emitidas, crea manuales, anula y reenvía email.
export default function GiftCardsManagerCard() {
  const [giftcards, setGiftcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    monto_clp: 20000,
    destinatario_nombre: '',
    destinatario_email: '',
    comprador_nombre: '',
    comprador_email: '',
    mensaje: '',
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.GiftCard.list('-created_date', 100);
      setGiftcards(list || []);
    } catch {
      setGiftcards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const visibles = giftcards.filter((g) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (g.codigo || '').toLowerCase().includes(q)
      || (g.destinatario_nombre || '').toLowerCase().includes(q)
      || (g.destinatario_email || '').toLowerCase().includes(q);
  });

  const fmtMonto = (n) => '$' + (n || 0).toLocaleString('es-CL');

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-highlight-soft flex items-center justify-center">
            <Gift className="w-4 h-4 text-ld-highlight" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Gift Cards</span>
          <span className="text-[11px] text-ld-fg-muted">({visibles.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cargar} className="text-ld-fg-muted hover:text-ld-fg" title="Refrescar">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs font-medium text-ld-action hover:underline flex items-center gap-1"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cancelar' : 'Crear GC'}
          </button>
        </div>
      </div>

      {/* Formulario de creación manual */}
      {showForm && (
        <div className="mb-4 space-y-2.5 p-3.5 rounded-xl bg-ld-bg-soft/60 border border-ld-border">
          <div className="flex gap-1.5">
            {MONTOS_PRESET.map((m) => (
              <button
                key={m}
                onClick={() => setForm({ ...form, monto_clp: m })}
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${
                  form.monto_clp === m
                    ? 'bg-ld-action text-white border-ld-action'
                    : 'bg-ld-bg border-ld-border text-ld-fg-soft hover:border-ld-action/50'
                }`}
              >
                {fmtMonto(m)}
              </button>
            ))}
          </div>
          <input
            value={form.destinatario_nombre}
            onChange={(e) => setForm({ ...form, destinatario_nombre: e.target.value })}
            placeholder="Nombre del destinatario *"
            className="w-full h-9 px-3 text-sm rounded-lg bg-ld-bg border border-ld-border text-ld-fg outline-none focus:border-ld-action"
          />
          <input
            value={form.destinatario_email}
            onChange={(e) => setForm({ ...form, destinatario_email: e.target.value })}
            placeholder="Email del destinatario *"
            type="email"
            className="w-full h-9 px-3 text-sm rounded-lg bg-ld-bg border border-ld-border text-ld-fg outline-none focus:border-ld-action"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.comprador_nombre}
              onChange={(e) => setForm({ ...form, comprador_nombre: e.target.value })}
              placeholder="Comprador (opcional)"
              className="h-9 px-3 text-sm rounded-lg bg-ld-bg border border-ld-border text-ld-fg outline-none focus:border-ld-action"
            />
            <input
              value={form.comprador_email}
              onChange={(e) => setForm({ ...form, comprador_email: e.target.value })}
              placeholder="Email comprador"
              className="h-9 px-3 text-sm rounded-lg bg-ld-bg border border-ld-border text-ld-fg outline-none focus:border-ld-action"
            />
          </div>
          <textarea
            value={form.mensaje}
            onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
            placeholder="Mensaje personal (opcional)"
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-lg bg-ld-bg border border-ld-border text-ld-fg outline-none focus:border-ld-action resize-none"
          />
          <ActionButton
            action="crearGiftCard"
            payload={form}
            label="Crear y enviar"
            icon={Gift}
            variant="primary"
            confirm={false}
            onDone={() => { setShowForm(false); setForm({ monto_clp: 20000, destinatario_nombre: '', destinatario_email: '', comprador_nombre: '', comprador_email: '', mensaje: '' }); cargar(); }}
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
            placeholder="Buscar por código, nombre o email..."
            className="w-full h-9 pl-8 pr-3 text-sm rounded-lg bg-ld-bg-soft border border-ld-border text-ld-fg outline-none focus:border-ld-action"
          />
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-ld-action" /></div>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-ld-fg-muted text-center py-4">No hay gift cards. Crea una ↑</p>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto peyu-scrollbar">
          {visibles.map((g) => (
            <div key={g.id} className="rounded-xl px-3 py-2.5 bg-ld-bg-soft/60 border border-ld-border">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="min-w-0">
                  <span className="font-mono font-bold text-sm text-ld-fg">{g.codigo}</span>
                  <span className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    g.estado === 'Activa' ? 'bg-emerald-100 text-emerald-700'
                    : g.estado === 'Canjeada' ? 'bg-gray-100 text-gray-600'
                    : g.estado === 'Anulada' ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}>{g.estado}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {g.estado === 'Activa' && (
                    <ActionButton
                      action="anularGiftCard"
                      payload={{ id: g.id }}
                      label="Anular"
                      icon={Ban}
                      onDone={cargar}
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ld-fg-muted">
                <span className="font-semibold text-ld-fg">{fmtMonto(g.monto_clp)}</span>
                <span>Saldo: <span className="font-semibold text-ld-action">{fmtMonto(g.saldo_clp)}</span></span>
                {g.destinatario_nombre && <span>→ {g.destinatario_nombre}</span>}
                {g.destinatario_email && <span className="truncate max-w-[140px]">{g.destinatario_email}</span>}
              </div>
              {g.email_enviado === false && g.estado === 'Activa' && (
                <button
                  onClick={() => base44.functions.invoke('enviarGiftCard', { giftcard_id: g.id }).then(() => cargar())}
                  className="mt-1 text-[10px] font-medium text-ld-action hover:underline flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" /> Reenviar email
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}