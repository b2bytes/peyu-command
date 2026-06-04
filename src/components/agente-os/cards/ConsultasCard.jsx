import { useState } from 'react';
import { MessageCircle, Mail, Check } from 'lucide-react';
import ActionButton from '../ActionButton';

// Tarjeta de consultas SIN RESPONDER con datos reales (nombre, canal, mensaje)
// + acciones: marcar respondida / responder por email. Arregla el bug donde
// el agente decía "tengo 2 consultas" pero no las mostraba.
export default function ConsultasCard({ consultas = [], onDone }) {
  const [replyTo, setReplyTo] = useState(null);
  const [cuerpo, setCuerpo] = useState('');

  if (consultas.length === 0) {
    return (
      <div className="ld-glass rounded-2xl p-4 sm:p-5">
        <p className="text-sm text-ld-fg-muted">No hay consultas sin responder 🎉</p>
      </div>
    );
  }

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-ld-highlight-soft flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-ld-highlight" />
        </span>
        <span className="text-sm font-semibold text-ld-fg">Consultas sin responder</span>
        <span className="text-[11px] text-ld-fg-subtle">({consultas.length})</span>
      </div>

      <div className="space-y-2.5">
        {consultas.map((c) => (
          <div key={c.id} className="rounded-xl px-3 py-2.5 bg-ld-bg-soft/60 border border-ld-border">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ld-fg truncate">{c.nombre || 'Sin nombre'}</div>
                <div className="text-[11px] text-ld-fg-muted">{c.canal || 'Web'}{c.email ? ` · ${c.email}` : ''}</div>
              </div>
            </div>
            {c.mensaje && <p className="text-xs text-ld-fg-soft mt-1.5 line-clamp-3 leading-relaxed">{c.mensaje}</p>}

            {replyTo === c.id ? (
              <div className="mt-2.5 space-y-2">
                <textarea
                  value={cuerpo}
                  onChange={(e) => setCuerpo(e.target.value)}
                  rows={3}
                  placeholder="Escribe tu respuesta…"
                  className="w-full text-sm rounded-lg bg-ld-bg border border-ld-border p-2 outline-none text-ld-fg focus:border-ld-action peyu-scrollbar"
                />
                <div className="flex items-center gap-1.5">
                  <ActionButton
                    action="responderConsulta"
                    payload={{ id: c.id, email: c.email, asunto: `Respuesta de PEYU Chile`, cuerpo }}
                    label="Enviar respuesta"
                    icon={Mail}
                    variant="primary"
                    confirm={false}
                    onDone={() => { setReplyTo(null); setCuerpo(''); onDone?.(); }}
                  />
                  <button onClick={() => { setReplyTo(null); setCuerpo(''); }} className="text-xs text-ld-fg-muted px-2 py-1.5">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-2.5">
                {c.email && (
                  <button
                    onClick={() => { setReplyTo(c.id); setCuerpo(''); }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ld-glass-soft text-ld-fg-soft hover:text-ld-fg hover:border-ld-action/50 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Responder
                  </button>
                )}
                <ActionButton
                  action="marcarConsultaRespondida"
                  payload={{ id: c.id }}
                  label="Marcar respondida"
                  icon={Check}
                  confirm={false}
                  onDone={onDone}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}