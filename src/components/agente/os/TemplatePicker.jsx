// ============================================================================
// PEYU OS · Selector de plantillas predefinidas
// Botón que despliega un menú con prompts listos para que Peyu redacte y
// proponga un mensaje (WhatsApp/Email) con un clic: presupuestos y seguimientos.
// Al elegir, rellena el input del composer y lo enfoca.
// ============================================================================
import { useState, useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'presupuesto_wa',
    emoji: '💬',
    label: 'Enviar presupuesto por WhatsApp',
    prompt: 'Escríbele por WhatsApp al cliente de esta cotización para enviarle el presupuesto, con tono cálido y un cierre que invite a avanzar.',
  },
  {
    id: 'presupuesto_email',
    emoji: '📧',
    label: 'Enviar presupuesto por email',
    prompt: 'Redacta un email para enviarle el presupuesto al cliente de esta cotización, con asunto claro y resumen de la propuesta.',
  },
  {
    id: 'seguimiento_wa',
    emoji: '🔔',
    label: 'Seguimiento por WhatsApp',
    prompt: 'Escríbele un mensaje de seguimiento por WhatsApp al cliente para retomar la conversación de su cotización pendiente.',
  },
  {
    id: 'seguimiento_email',
    emoji: '✉️',
    label: 'Seguimiento por email',
    prompt: 'Redacta un email de seguimiento al cliente para recordarle su cotización pendiente y ofrecer ayuda para cerrar.',
  },
  {
    id: 'agradecimiento',
    emoji: '🙌',
    label: 'Agradecer y confirmar pedido',
    prompt: 'Redacta un mensaje de agradecimiento al cliente confirmando que recibimos su pedido y los próximos pasos.',
  },
];

export default function TemplatePicker({ onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Plantillas rápidas"
        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
          open
            ? 'bg-[#0F8B6C]/10 border-[#0F8B6C]/40 text-[#0F8B6C]'
            : 'bg-[#f6f1ea] border-[#e7d8c6] text-[#6f7d77] hover:text-[#22302c] hover:border-[#0F8B6C]/40'
        }`}
        aria-label="Plantillas"
      >
        <FileText className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute bottom-12 left-0 w-72 rounded-2xl bg-white border border-[#e7d8c6] shadow-[0_8px_32px_-12px_rgba(34,48,44,0.3)] p-1.5 z-20">
          <p className="text-[11px] font-medium text-[#9aa6a0] px-2.5 py-1.5">Plantillas rápidas</p>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onPick(t.prompt);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 text-left text-sm text-[#22302c] px-2.5 py-2 rounded-xl hover:bg-[#f6f1ea] transition-colors"
            >
              <span className="text-base flex-shrink-0">{t.emoji}</span>
              <span className="leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}