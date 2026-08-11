// Acentos festivos discretos para el home: una línea tricolor fina y un chip
// de temporada. Se apoyan en la paleta Warm Dusk, sin cambiar la identidad.
export function FiestasLine({ className = '' }) {
  return (
    <div className={`flex h-[3px] rounded-full overflow-hidden w-16 ${className}`}>
      <div className="flex-1" style={{ background: '#0F3D91' }} />
      <div className="flex-1" style={{ background: '#E7D8C6' }} />
      <div className="flex-1" style={{ background: '#A8443A' }} />
    </div>
  );
}

export function FiestasChip({ children = 'Edición 18 de septiembre' }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold"
      style={{ background: 'rgba(168,68,58,.1)', color: '#A8443A' }}
    >
      🇨🇱 {children}
    </span>
  );
}