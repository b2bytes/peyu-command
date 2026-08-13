import { useState } from 'react';
import { Mail, Check, Clock } from 'lucide-react';
import ActionButton from '../ActionButton';
import { fmtFechaCompleta } from '@/lib/fecha-relativa';

// Fila de consulta sin responder: identidad + antigüedad + mensaje plegado,
// con respuesta por email inline. El detalle no estira el chat.
export default function ConsultaRow({ consulta: c, onDone }) {
  const [respondiendo, setRespondiendo] = useState(false);
  const [cuerpo, setCuerpo] = useState('');

  return (
    <div className="rounded-xl px-3 py-2 bg-ld-bg-soft/60 border border-ld-border">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-ld-fg truncate leading-tight">{c.nombre || 'Sin nombre'}</p>
          <p className="text-[10.5px] text-ld-fg-muted truncate">
            {c.canal || 'Web'}{c.email ? ` · ${c.email}` : ''}
          </p>
        </div>
        {c.calidad && (
          <span className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-bold flex-shrink-0 ${c.calidad === 'Caliente' ? 'bg-ld-highlight-soft text-ld-highlight' : 'bg-ld-bg-soft text-ld-fg-muted'}`}>
            {c.calidad}
          </span>
        )}
      </div>

      {c.created_date && (
        <p className="text-[10px] text-ld-fg-subtle mt-1 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" /> Llegó {fmtFechaCompleta(c.created_date)}
        </p>
      )}
      {c.mensaje && <p className="text-[11.5px] text-ld-fg-soft mt-1 line-clamp-2 leading-snug">{c.mensaje}</p>}

      {respondiendo ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            rows={3}
            placeholder="Escribe tu respuesta…"
            className="w-full text-[12.5px] rounded-lg bg-ld-bg border border-ld-border p-2 outline-none text-ld-fg focus:border-ld-action peyu-scrollbar"
          />
          <div className="flex items-center gap-1.5">
            <ActionButton
              action="responderConsulta"
              payload={{ id: c.id, email: c.email, asunto: 'Respuesta de PEYU Chile', cuerpo }}
              label="Enviar"
              icon={Mail}
              variant="primary"
              confirm={false}
              onDone={() => { setRespondiendo(false); setCuerpo(''); onDone?.(); }}
            />
            <button onClick={() => { setRespondiendo(false); setCuerpo(''); }} className="text-[11px] text-ld-fg-muted px-2 py-1.5">Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 mt-2">
          {c.email && (
            <button
              onClick={() => { setRespondiendo(true); setCuerpo(''); }}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg ld-glass-soft text-ld-fg-soft hover:text-ld-fg transition-colors"
            >
              <Mail className="w-3.5 h-3.5" /> Responder
            </button>
          )}
          <ActionButton action="marcarConsultaRespondida" payload={{ id: c.id }} label="Respondida" icon={Check} confirm={false} onDone={onDone} />
        </div>
      )}
    </div>
  );
}