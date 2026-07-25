import { Check, Phone } from 'lucide-react';

// Fila seleccionable de un cliente de la base de datos, para envío por WhatsApp.
export default function ClienteSelectRow({ cliente, seleccionado, onToggle }) {
  const nombre = cliente.contacto || cliente.empresa || 'Sin nombre';
  return (
    <button
      onClick={() => onToggle(cliente.id)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
      style={seleccionado
        ? { background: 'rgba(37,211,102,.14)', border: '1px solid rgba(37,211,102,.35)' }
        : { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}
    >
      <span
        className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center"
        style={seleccionado
          ? { background: '#25D366' }
          : { border: '1.5px solid rgba(255,255,255,.25)' }}
      >
        {seleccionado && <Check className="w-3.5 h-3.5 text-white" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{nombre}</p>
        <p className="text-[11px] text-white/40 truncate">
          {cliente.empresa && cliente.empresa !== nombre ? `${cliente.empresa} · ` : ''}
          {cliente.telefono}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {cliente.estado && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white/60" style={{ background: 'rgba(255,255,255,.07)' }}>
            {cliente.estado}
          </span>
        )}
        <Phone className="w-3.5 h-3.5 text-[#25D366]" />
      </div>
    </button>
  );
}