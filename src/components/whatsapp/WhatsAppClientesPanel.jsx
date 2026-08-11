import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, Users, CheckSquare, Square, UserPlus } from 'lucide-react';
import ClienteSelectRow from './ClienteSelectRow';
import WhatsAppComposePanel from './WhatsAppComposePanel';
import ClienteCreateModal from './ClienteCreateModal';

// Vista "Clientes": toma la base de datos de clientes con teléfono y permite
// escribirles por WhatsApp usando plantillas.
export default function WhatsAppClientesPanel() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [q, setQ] = useState('');
  const [ids, setIds] = useState([]);
  const [crear, setCrear] = useState(false);

  useEffect(() => {
    base44.entities.Cliente.list('-updated_date', 500)
      .then((l) => setClientes((l || []).filter((c) => (c.telefono || '').replace(/\D/g, '').length >= 8)))
      .catch(() => setClientes([]))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return clientes;
    return clientes.filter((c) =>
      [c.empresa, c.contacto, c.telefono, c.email].some((v) => (v || '').toLowerCase().includes(t))
    );
  }, [clientes, q]);

  const toggle = (id) => setIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const todos = filtrados.length > 0 && filtrados.every((c) => ids.includes(c.id));
  const toggleTodos = () => setIds(todos ? [] : filtrados.map((c) => c.id));

  const seleccionados = clientes.filter((c) => ids.includes(c.id));

  return (
    <div className="h-full flex min-h-0 gap-2">
      {/* Lista de clientes */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="flex-shrink-0 px-4 py-3 space-y-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white leading-none">Clientes con WhatsApp</p>
              <p className="text-[10px] text-white/40 mt-0.5">{filtrados.length} de {clientes.length} · {ids.length} seleccionados</p>
            </div>
            <button
              onClick={() => setCrear(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}
            >
              <UserPlus className="w-3.5 h-3.5" /> Nuevo
            </button>
            <button
              onClick={toggleTodos}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold text-white/70 hover:text-white"
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}
            >
              {todos ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              {todos ? 'Quitar todos' : 'Todos'}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, empresa o teléfono…"
              className="w-full h-10 pl-9 pr-3 rounded-xl text-sm text-white bg-white/[0.06] outline-none focus:bg-white/[0.10] placeholder:text-white/30"
              style={{ border: '1px solid rgba(255,255,255,.10)' }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto peyu-scrollbar-light p-3 space-y-1.5">
          {cargando ? (
            <div className="flex items-center justify-center gap-2 py-12 text-white/40 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando clientes…
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 mx-auto text-white/15" />
              <p className="text-sm text-white/60 mt-3 font-semibold">Sin clientes con teléfono</p>
              <p className="text-xs text-white/35 mt-1">Agrega el teléfono en la ficha del cliente para poder escribirle.</p>
            </div>
          ) : (
            filtrados.map((c) => (
              <ClienteSelectRow key={c.id} cliente={c} seleccionado={ids.includes(c.id)} onToggle={toggle} />
            ))
          )}
        </div>
      </div>

      {/* Redacción */}
      <div className="hidden lg:flex flex-col w-[360px] flex-shrink-0 rounded-2xl overflow-hidden"
        style={{ background: 'rgba(0,0,0,.30)', border: '1px solid rgba(255,255,255,.08)' }}>
        <WhatsAppComposePanel seleccionados={seleccionados} />
      </div>

      {/* Modal crear cliente */}
      {crear && (
        <ClienteCreateModal
          onClose={() => setCrear(false)}
          onCreated={(nuevo) => setClientes((prev) => [nuevo, ...prev])}
        />
      )}

      {/* Mobile: aparece cuando hay seleccionados */}
      {ids.length > 0 && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 max-h-[62vh] rounded-t-3xl overflow-hidden flex flex-col"
          style={{ background: '#0B1224', borderTop: '1px solid rgba(255,255,255,.12)' }}>
          <WhatsAppComposePanel seleccionados={seleccionados} />
        </div>
      )}
    </div>
  );
}