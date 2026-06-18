import { motion } from 'framer-motion';

// ════════════════════════════════════════════════════════════════════════
// ChatBubbleSF — Burbuja de mensaje del Conversational Storefront.
// role: 'assistant' (PEYU) | 'user'. Estética Linear/Notion: limpio, suave.
// ════════════════════════════════════════════════════════════════════════
export default function ChatBubbleSF({ role, children }) {
  const isUser = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2.5`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[15px] mt-0.5"
          style={{ background: '#0F8B6C' }}>
          🐢
        </div>
      )}
      <div
        className={`max-w-[82%] px-4 py-2.5 text-[14px] leading-relaxed ${
          isUser ? 'rounded-[18px] rounded-br-md' : 'rounded-[18px] rounded-bl-md'
        }`}
        style={
          isUser
            ? { background: '#0F8B6C', color: '#fff' }
            : { background: '#fff', color: '#1C2421', border: '1px solid rgba(15,139,108,.12)', boxShadow: '0 1px 3px rgba(15,40,30,.05)' }
        }
      >
        {children}
      </div>
    </motion.div>
  );
}