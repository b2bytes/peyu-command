import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import CardDispatcher from './CardDispatcher';

// Burbuja de conversación. Usuario → derecha (acento). Agente → izquierda con
// avatar 🐢 y nombre, más tarjetas ricas embebidas.
export default function MessageBubble({ message, crm, metrics, lists, onAsk, onDone }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex justify-end"
      >
        <div className="ld-btn-primary max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-3"
    >
      <div className="w-9 h-9 rounded-full bg-ld-action-soft flex items-center justify-center text-lg flex-shrink-0 mt-0.5">
        🐢
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ld-fg">Peyu</span>
          <span className="text-[11px] text-ld-fg-subtle">Agent OS</span>
        </div>
        {message.content && (
          <div className="ld-card rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed text-ld-fg-soft prose-sm max-w-none [&_p]:my-1 [&_strong]:text-ld-fg [&_strong]:font-semibold">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {message.cards?.map((card, i) => (
          <CardDispatcher key={i} card={card} crm={crm} metrics={metrics} lists={message.lists || lists} onAsk={onAsk} onDone={onDone} />
        ))}
      </div>
    </motion.div>
  );
}