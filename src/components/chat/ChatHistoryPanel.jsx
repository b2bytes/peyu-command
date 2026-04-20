import { useEffect, useState } from 'react';
import { History, MessageCircle, Trash2, X, Clock } from 'lucide-react';
import { readHistory, removeFromHistory } from '@/lib/chat-history';

function formatWhen(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Hace ${days}d`;
  return new Date(ts).toLocaleDateString('es-CL');
}

/**
 * Panel desplegable con el historial de conversaciones anteriores.
 * - onResume(id): reabre la conversación con ese id.
 * - onClose: cierra el panel.
 */
export default function ChatHistoryPanel({ onResume, onClose }) {
  const [items, setItems] = useState([]);

  useEffect(() => { setItems(readHistory()); }, []);

  const handleDelete = (id) => {
    removeFromHistory(id);
    setItems(readHistory());
  };

  return (
    <div className="absolute inset-0 bg-white z-10 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-teal-600" />
          <h4 className="font-poppins font-bold text-sm text-gray-900">Conversaciones anteriores</h4>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-200 transition">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-center text-gray-400 text-xs py-12 space-y-2">
            <MessageCircle className="w-8 h-8 mx-auto opacity-40" />
            <p>Aún no tienes conversaciones anteriores.</p>
            <p className="text-[10px]">Cuando cierres la app y vuelvas, podrás retomar tus chats aquí.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id}
              className="group flex items-center gap-2 bg-white border border-gray-100 hover:border-teal-300 rounded-xl p-2.5 transition-all">
              <button
                onClick={() => onResume(item.id)}
                className="flex-1 flex items-center gap-2.5 text-left min-w-0">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{item.title}</p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" /> {formatWhen(item.updated_at)}
                  </p>
                </div>
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}