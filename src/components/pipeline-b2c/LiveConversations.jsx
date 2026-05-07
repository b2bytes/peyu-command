// LiveConversations · Conversaciones de Peyu agrupadas por sesión.
import { useMemo } from 'react';
import { Bot, User2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LiveConversations({ ailogs, activity }) {
  // Agrupamos AILogs por conversation_id (o agent_name+hora si null)
  const conversations = useMemo(() => {
    const map = new Map();
    for (const log of ailogs) {
      const key = log.conversation_id || `${log.agent_name}-${log.created_date?.slice(0, 16)}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          agent: log.agent_name,
          messages: [],
          firstAt: log.created_date,
          lastAt: log.created_date,
          totalTokens: 0,
          totalCost: 0,
        });
      }
      const c = map.get(key);
      c.messages.push(log);
      c.totalTokens += log.tokens_total || 0;
      c.totalCost += log.cost_usd || 0;
      if (log.created_date < c.firstAt) c.firstAt = log.created_date;
      if (log.created_date > c.lastAt) c.lastAt = log.created_date;
    }
    return Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }, [ailogs]);

  // Cruz: cuántos chat_messages hay en activity (los del feed público)
  const chatMessagesCount = activity.filter(a => a.event_type === 'chat_message').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[640px] flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-teal-600" />
          <h2 className="font-bold text-slate-900 font-jakarta">Conversaciones Peyu</h2>
        </div>
        <span className="text-xs text-slate-500">{conversations.length} chats · {chatMessagesCount} msgs</span>
      </div>
      <div className="flex-1 overflow-y-auto peyu-scrollbar p-3 space-y-3">
        {conversations.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Sin conversaciones aún hoy</p>
        )}
        {conversations.map(conv => (
          <div key={conv.key} className="border border-slate-200 rounded-xl p-3 hover:border-teal-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                {conv.agent || 'peyu'}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(conv.lastAt), { locale: es, addSuffix: true })}
              </div>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto peyu-scrollbar">
              {conv.messages.slice(0, 4).map(m => (
                <div key={m.id} className="space-y-1">
                  {m.user_message && (
                    <div className="flex gap-1.5 items-start">
                      <User2 className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-700 leading-snug line-clamp-2">{m.user_message}</p>
                    </div>
                  )}
                  {m.ai_response && (
                    <div className="flex gap-1.5 items-start">
                      <Bot className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-600 leading-snug line-clamp-2">{m.ai_response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
              <span>{conv.messages.length} mensajes</span>
              <span>{conv.totalTokens} tokens · ${conv.totalCost.toFixed(4)} USD</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}