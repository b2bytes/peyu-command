import { motion } from 'framer-motion';

// ════════════════════════════════════════════════════════════════════════
// QuickRepliesSF — Chips de respuesta rápida. Al elegir, avanza la
// conversación y sincroniza el canvas de productos.
// ════════════════════════════════════════════════════════════════════════
export default function QuickRepliesSF({ options, onPick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex flex-wrap gap-2 pl-[42px]"
    >
      {options.map((opt) => (
        <button
          key={opt.label}
          onClick={() => onPick(opt)}
          className="px-3.5 py-2 rounded-full text-[13px] font-semibold transition-all hover:-translate-y-0.5 active:scale-95"
          style={{
            background: '#fff',
            color: '#0F8B6C',
            border: '1.5px solid rgba(15,139,108,.25)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </motion.div>
  );
}