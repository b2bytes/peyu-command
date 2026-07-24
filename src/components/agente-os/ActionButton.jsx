import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Check, X } from 'lucide-react';

// Botón de acción real del Agent OS. Llama a agentOSAction con confirmación
// opcional inline. Muestra estado (idle → confirm → loading → done/error).
// onDone() permite refrescar métricas tras ejecutar.
export default function ActionButton({
  action,
  payload,
  label,
  icon: Icon,
  variant = 'ghost', // 'primary' | 'ghost'
  confirm = true,
  onDone,
  className = '',
}) {
  const [state, setState] = useState('idle'); // idle | confirm | loading | done | error
  const [msg, setMsg] = useState('');

  // HARNESS · Las acciones irreversibles SIEMPRE piden confirmación inline
  // (aunque el caller pase confirm={false}) y viajan con confirmado:true,
  // que el backend exige para ejecutarlas.
  const esDestructiva =
    ['eliminarLead', 'cancelarPedido', 'anularGiftCard'].includes(action) ||
    (action === 'toggleCupon' && payload?.accion === 'eliminar');
  const requiereConfirm = confirm || esDestructiva;

  const run = async () => {
    setState('loading');
    try {
      const res = await base44.functions.invoke('agentOSAction', {
        action,
        payload: esDestructiva ? { ...payload, confirmado: true } : payload,
      });
      if (res?.data?.error) throw new Error(res.data.error);
      setMsg(res?.data?.message || 'Listo');
      setState('done');
      onDone?.();
    } catch (e) {
      setMsg(e?.response?.data?.error || e?.message || 'Error');
      setState('error');
    }
  };

  const base = 'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors';
  const styles =
    variant === 'primary'
      ? 'ld-btn-primary text-white'
      : 'ld-glass-soft text-ld-fg-soft hover:text-ld-fg hover:border-ld-action/50';

  if (state === 'done') {
    return (
      <span className={`${base} bg-ld-action-soft text-ld-action ${className}`}>
        <Check className="w-3.5 h-3.5" /> {msg}
      </span>
    );
  }
  if (state === 'error') {
    return (
      <button onClick={() => setState('idle')} className={`${base} bg-ld-highlight-soft text-ld-highlight ${className}`}>
        <X className="w-3.5 h-3.5" /> {msg} · reintentar
      </button>
    );
  }
  if (state === 'loading') {
    return (
      <span className={`${base} ${styles} ${className} opacity-70`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> {label}
      </span>
    );
  }
  if (state === 'confirm') {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <button onClick={run} className={`${base} ld-btn-primary text-white`}>
          <Check className="w-3.5 h-3.5" /> Confirmar
        </button>
        <button onClick={() => setState('idle')} className={`${base} ld-glass-soft text-ld-fg-muted`}>
          Cancelar
        </button>
      </span>
    );
  }
  return (
    <button onClick={() => (requiereConfirm ? setState('confirm') : run())} className={`${base} ${styles} ${className}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />} {label}
    </button>
  );
}