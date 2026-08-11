// Chips compactos con los datos esenciales del lead: verde = capturado,
// gris = todavía falta. Se usan en el kanban y en la vista de etiquetas.
const CAMPOS = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'producto_interes_nombre', label: 'Producto' },
  { key: 'cantidad_estimada', label: 'Cantidad' },
];

export default function LeadDataChips({ lead, compact = false }) {
  return (
    <div className="flex flex-wrap gap-1">
      {CAMPOS.map((c) => {
        const ok = !!lead[c.key];
        if (compact && !ok) return null;
        return (
          <span
            key={c.key}
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={ok
              ? { background: 'rgba(16,185,129,.14)', color: '#10B981' }
              : { background: 'var(--ld-bg-soft)', color: 'var(--ld-fg-subtle)' }}
          >
            {ok ? '✓ ' : ''}{c.label}
          </span>
        );
      })}
    </div>
  );
}