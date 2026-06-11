import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Volume2, Pause, Play, Loader2, FileText } from 'lucide-react';
import CardDispatcher from './CardDispatcher';

// Burbuja de conversación. Usuario → derecha (acento). Agente → izquierda con
// avatar 🐢 y nombre, voz de Joaquín y tarjetas ricas embebidas.
export default function MessageBubble({ message, msgId, voice, crm, metrics, lists, onAsk, onDone }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] space-y-1.5">
          {/* Adjuntos enviados con el mensaje */}
          {message.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {message.attachments.map((a, i) => a.type?.startsWith('image') ? (
                <img key={i} src={a.url} alt={a.name} className="w-20 h-20 object-cover rounded-xl border border-ld-border" />
              ) : (
                <a key={i} href={a.url} target="_blank" rel="noreferrer" className="ld-glass-soft inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-ld-fg-soft">
                  <FileText className="w-3.5 h-3.5 text-ld-action" /> {a.name}
                </a>
              ))}
            </div>
          )}
          <div className="ld-btn-primary rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed">
            {message.content}
          </div>
        </div>
      </motion.div>
    );
  }

  const speakingThis = voice?.speakingId === msgId;
  const loadingThis = voice?.loadingId === msgId;

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
          {/* Voz de Joaquín: leer / pausar este mensaje */}
          {voice && message.content && (
            <button
              onClick={() => voice.speak(msgId, message.content)}
              className={`p-1 rounded-full transition-colors ${speakingThis ? 'bg-ld-action-soft text-ld-action' : 'text-ld-fg-subtle hover:text-ld-action hover:bg-ld-action-soft'}`}
              title={speakingThis ? (voice.paused ? 'Reanudar' : 'Pausar') : 'Escuchar con la voz de Joaquín'}
            >
              {loadingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : speakingThis ? (voice.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />)
                : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}
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