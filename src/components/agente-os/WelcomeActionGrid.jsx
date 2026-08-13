// Accesos de arranque del Agent OS, agrupados por los caminos del negocio.
// Cada botón envía una pregunta al río de conversación: todo se resuelve
// dentro del chat con tarjetas interactivas, sin salir a otras pantallas.
const GRUPOS = [
  {
    titulo: 'Vender',
    items: [
      { emoji: '📋', label: 'Gestionar pedidos', ask: 'gestionar pedidos' },
      { emoji: '🤝', label: 'Leads B2B', ask: 'muéstrame los leads B2B activos' },
      { emoji: '📄', label: 'Propuestas', ask: 'propuestas pendientes' },
    ],
  },
  {
    titulo: 'Producir y despachar',
    items: [
      { emoji: '🏷️', label: 'Generar etiquetas', ask: 'pedidos para generar etiqueta' },
      { emoji: '🚚', label: 'Envíos y tracking', ask: 'estado de los envíos' },
      { emoji: '📦', label: 'Stock bajo', ask: 'stock bajo' },
    ],
  },
  {
    titulo: 'Catálogo y contenido',
    items: [
      { emoji: '🛠️', label: 'Editar catálogo', ask: 'edita el catálogo' },
      { emoji: '🎨', label: 'Imagen por color', ask: 'asignar imagen por color' },
      { emoji: '✨', label: 'Diseños láser', ask: 'gestionar diseños láser' },
    ],
  },
  {
    titulo: 'Crecer',
    items: [
      { emoji: '💰', label: 'Ventas de hoy', ask: 'ventas de hoy' },
      { emoji: '🎟️', label: 'Cupones', ask: 'cupones y descuentos' },
      { emoji: '🎁', label: 'Gift cards', ask: 'gift cards' },
    ],
  },
];

export default function WelcomeActionGrid({ onAsk }) {
  return (
    <div className="space-y-4">
      {GRUPOS.map((g) => (
        <div key={g.titulo}>
          <p className="text-xs font-bold text-ld-fg-muted uppercase tracking-wide mb-2">{g.titulo}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {g.items.map((it) => (
              <button
                key={it.label}
                onClick={() => onAsk(it.ask)}
                className="ld-card flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:border-ld-action transition-colors"
              >
                <span className="text-base flex-shrink-0" aria-hidden>{it.emoji}</span>
                <span className="text-sm font-semibold text-ld-fg leading-snug">{it.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}