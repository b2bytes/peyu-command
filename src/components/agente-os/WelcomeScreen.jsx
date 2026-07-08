import { motion } from 'framer-motion';
import DailySummaryCard from './cards/DailySummaryCard';

// Mensaje de bienvenida del agente al abrir: saludo + resumen del día + invita
// a preguntar. Aparece cuando aún no hay mensajes en el río.
export default function WelcomeScreen({ metrics, onAsk }) {
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex gap-3 max-w-[820px] mx-auto w-full"
    >
      <div className="w-9 h-9 rounded-full bg-ld-action-soft flex items-center justify-center text-lg flex-shrink-0 mt-0.5">
        🐢
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ld-fg">Peyu</span>
          <span className="text-[11px] text-ld-fg-subtle">Agent OS</span>
        </div>
        <div className="ld-card rounded-2xl rounded-tl-md px-4 py-3.5">
          <p className="text-base font-semibold text-ld-fg">{saludo} 👋</p>
          <p className="text-sm text-ld-fg-soft mt-1 leading-relaxed">
            Soy Peyu, tu Agent OS. Acá tienes el pulso del negocio en vivo. Pregúntame lo que necesites:
            ventas, pedidos, stock, cotizaciones o clientes — te respondo aquí mismo con los datos reales.
          </p>
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-bold text-ld-fg-muted uppercase tracking-wide">Operaciones desde el chat</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => onAsk('edita el catálogo')} className="text-[11px] px-2.5 py-1 rounded-full bg-ld-action-soft text-ld-action font-semibold hover:opacity-80 transition-opacity">📦 Editar catálogo</button>
              <button onClick={() => onAsk('asignar imagen por color')} className="text-[11px] px-2.5 py-1 rounded-full bg-ld-action-soft text-ld-action font-semibold hover:opacity-80 transition-opacity">🎨 Imagen por color</button>
              <button onClick={() => onAsk('gestionar diseños láser')} className="text-[11px] px-2.5 py-1 rounded-full bg-ld-action-soft text-ld-action font-semibold hover:opacity-80 transition-opacity">✨ Diseños láser</button>
              <button onClick={() => onAsk('gestionar pedidos')} className="text-[11px] px-2.5 py-1 rounded-full bg-ld-bg-elevated text-ld-fg-soft font-semibold hover:opacity-80 transition-opacity">📋 Pedidos</button>
              <button onClick={() => onAsk('cupones y descuentos')} className="text-[11px] px-2.5 py-1 rounded-full bg-ld-bg-elevated text-ld-fg-soft font-semibold hover:opacity-80 transition-opacity">🎟️ Cupones</button>
              <button onClick={() => onAsk('gift cards')} className="text-[11px] px-2.5 py-1 rounded-full bg-ld-bg-elevated text-ld-fg-soft font-semibold hover:opacity-80 transition-opacity">🎁 Gift cards</button>
            </div>
          </div>
        </div>
        <DailySummaryCard metrics={metrics} onAsk={onAsk} />
      </div>
    </motion.div>
  );
}