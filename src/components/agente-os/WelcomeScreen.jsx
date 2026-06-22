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
            ¿Quieres editar el catálogo, subir fotos o agregar un producto? Dime <span className="text-ld-action font-medium">“edita el catálogo”</span> y lo gestionas aquí.
          </p>
        </div>
        <DailySummaryCard metrics={metrics} onAsk={onAsk} />
      </div>
    </motion.div>
  );
}