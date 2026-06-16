import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, FileText, MessageSquare, Inbox } from 'lucide-react';
import { ladoDeEmail, LADO_INFO } from '@/lib/canal-agencia';

// ════════════════════════════════════════════════════════════════════════
// Canal Agencia — comunicación bidireccional PEYU ↔ b2bytes DENTRO de la app.
// Ambos lados (equipo PEYU y la agencia) escriben, ven el historial completo
// y pueden marcar un mensaje como "reporte". Simple y funcional: una bandeja
// de chat con filtro Todo / Reportes. El lado se deriva del dominio del email.
// ════════════════════════════════════════════════════════════════════════
export default function CanalAgencia() {
  const [user, setUser] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState('');
  const [esReporte, setEsReporte] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'reportes'
  const scrollRef = useRef(null);

  const miLado = user ? ladoDeEmail(user.email) : null;

  const cargar = useCallback(async () => {
    const data = await base44.entities.CanalAgenciaMensaje.list('created_date', 200).catch(() => []);
    setMensajes(data);
    setCargando(false);
  }, []);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    cargar();
    const unsub = base44.entities.CanalAgenciaMensaje.subscribe(() => cargar());
    return unsub;
  }, [cargar]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 80);
  }, [mensajes, filtro]);

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || enviando || !user) return;
    setEnviando(true);
    setInput('');
    const reporte = esReporte;
    setEsReporte(false);
    await base44.entities.CanalAgenciaMensaje.create({
      lado: miLado,
      autor_email: user.email,
      autor_nombre: user.full_name || user.email,
      mensaje: texto,
      es_reporte: reporte,
    }).catch(() => {});
    await cargar();
    setEnviando(false);
  };

  const visibles = filtro === 'reportes' ? mensajes.filter((m) => m.es_reporte) : mensajes;

  return (
    <div className="ld-canvas min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-ld-border">
        <div className="flex items-center gap-2 mb-1">
          <Inbox className="w-4 h-4 text-ld-action" />
          <p className="text-[11px] font-bold tracking-widest uppercase text-ld-action">Canal interno</p>
        </div>
        <h1 className="ld-display text-2xl sm:text-3xl text-ld-fg">PEYU ↔ Agencia</h1>
        <p className="text-sm text-ld-fg-muted mt-1">
          Conversación y reportes entre el equipo PEYU y la agencia b2bytes, dentro de la app.
          {miLado && <> Escribes como <strong style={{ color: LADO_INFO[miLado].color }}>{LADO_INFO[miLado].nombre}</strong>.</>}
        </p>

        {/* Filtro */}
        <div className="flex items-center gap-1.5 mt-4">
          {[
            { id: 'todos', label: 'Todo', icon: MessageSquare },
            { id: 'reportes', label: 'Reportes', icon: FileText },
          ].map((f) => {
            const activo = filtro === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full text-xs font-semibold transition-all ${
                  activo ? 'ld-btn-primary text-white' : 'ld-btn-ghost text-ld-fg'
                }`}
              >
                <f.icon className="w-3.5 h-3.5" /> {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-3">
        {cargando ? (
          <div className="flex items-center justify-center py-16 text-ld-fg-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : visibles.length === 0 ? (
          <div className="text-center py-16 text-ld-fg-muted">
            <Inbox className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">
              {filtro === 'reportes' ? 'Aún no hay reportes.' : 'Aún no hay mensajes en el canal.'}
            </p>
            <p className="text-xs mt-1">Escribe el primero abajo.</p>
          </div>
        ) : (
          visibles.map((m) => {
            const propio = m.lado === miLado;
            const info = LADO_INFO[m.lado] || LADO_INFO.agencia;
            return (
              <div key={m.id} className={`flex ${propio ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[78%] sm:max-w-[60%]">
                  <div className="flex items-center gap-1.5 mb-1 px-1" style={{ justifyContent: propio ? 'flex-end' : 'flex-start' }}>
                    <span className="text-[10px] font-bold" style={{ color: info.color }}>{info.nombre}</span>
                    <span className="text-[10px] text-ld-fg-subtle">· {m.autor_nombre || m.autor_email}</span>
                  </div>
                  <div
                    className="rounded-2xl px-3.5 py-2.5"
                    style={{
                      background: propio ? info.color : info.bg,
                      color: propio ? 'white' : 'var(--ld-fg)',
                      border: propio ? 'none' : `1px solid ${info.color}33`,
                    }}
                  >
                    {m.es_reporte && (
                      <span
                        className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider mb-1 px-1.5 py-0.5 rounded-full"
                        style={{ background: propio ? 'rgba(255,255,255,.2)' : info.color, color: 'white' }}
                      >
                        <FileText className="w-2.5 h-2.5" /> Reporte
                      </span>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.mensaje}</p>
                  </div>
                  <p className="text-[9px] text-ld-fg-subtle mt-1 px-1" style={{ textAlign: propio ? 'right' : 'left' }}>
                    {new Date(m.created_date).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="px-4 sm:px-6 py-3 border-t border-ld-border bg-ld-bg-elevated">
        <label className="flex items-center gap-2 mb-2 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={esReporte}
            onChange={(e) => setEsReporte(e.target.checked)}
            className="w-4 h-4 rounded accent-[#C0785C]"
          />
          <span className="text-xs font-semibold text-ld-fg-soft flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-ld-highlight" /> Marcar como reporte
          </span>
        </label>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
            rows={1}
            placeholder="Escribe un mensaje o reporte…"
            className="flex-1 ld-input rounded-2xl px-4 py-2.5 text-sm resize-none max-h-32"
            style={{ borderRadius: '1rem' }}
          />
          <button
            onClick={enviar}
            disabled={enviando || !input.trim()}
            className="ld-btn-primary w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0 disabled:opacity-50"
          >
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}