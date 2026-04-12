import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Bot, Plus, Trash2, MessageSquare, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

// Sugerencias rápidas contextuales
const SUGERENCIAS = [
  "¿Cuántos leads activos hay en el pipeline?",
  "Muéstrame los leads calientes sin respuesta",
  "Crear tarea: contactar leads B2B esta semana",
  "¿Qué productos tienen mejor margen B2B?",
  "¿Hay cotizaciones pendientes de respuesta?",
  "Resumen del estado de producción actual",
  "¿Qué clientes no han comprado en 60 días?",
  "Crear cotización para empresa TechCorp por 50 soportes",
];

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#0F8B6C' }}>
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? "flex flex-col items-end" : ""}`}>
        {message.content && (
          <div className={`rounded-2xl px-4 py-2.5 ${
            isUser
              ? "text-white text-sm"
              : "bg-white border border-border text-sm"
          }`} style={isUser ? { background: '#0F8B6C' } : {}}>
            {isUser ? (
              <p className="leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  code: ({ children }) => <code className="px-1 py-0.5 rounded bg-muted text-xs">{children}</code>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {message.tool_calls?.length > 0 && message.tool_calls.map((tc, i) => (
          <div key={i} className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className={`w-3 h-3 ${tc.status === 'in_progress' ? 'animate-spin' : ''}`} />
            <span>{tc.status === 'completed' ? '✓' : '…'} {tc.name?.split('.').reverse().join(' ')}</span>
          </div>
        ))}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-muted-foreground">
          Tú
        </div>
      )}
    </div>
  );
}

export default function AsistenteIA() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Cargar conversaciones
  const loadConversations = async () => {
    setLoadingConvs(true);
    const convs = await base44.agents.listConversations({ agent_name: "asistente_comercial" });
    setConversations(convs || []);
    setLoadingConvs(false);
  };

  useEffect(() => { loadConversations(); }, []);

  // Suscribirse a la conversación activa
  useEffect(() => {
    if (!activeConvId) return;
    const unsub = base44.agents.subscribeToConversation(activeConvId, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [activeConvId]);

  const openConversation = async (conv) => {
    setActiveConvId(conv.id);
    setActiveConv(conv);
    const full = await base44.agents.getConversation(conv.id);
    setMessages(full.messages || []);
  };

  const createNewConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "asistente_comercial",
      metadata: { name: `Sesión ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` },
    });
    setActiveConvId(conv.id);
    setActiveConv(conv);
    setMessages([]);
    loadConversations();
  };

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || sending) return;

    let convId = activeConvId;
    let conv = activeConv;

    // Auto-crear conversación si no hay una
    if (!convId) {
      conv = await base44.agents.createConversation({
        agent_name: "asistente_comercial",
        metadata: { name: msg.slice(0, 40) },
      });
      convId = conv.id;
      setActiveConvId(convId);
      setActiveConv(conv);
      loadConversations();

      const unsub = base44.agents.subscribeToConversation(convId, (data) => {
        setMessages(data.messages || []);
      });
      // No cleanup needed here as component will handle it
    }

    setInput("");
    setSending(true);
    await base44.agents.addMessage(conv || activeConv, { role: "user", content: msg });
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Sidebar conversaciones */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-border bg-muted/20">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#0F8B6C' }}>
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-poppins font-semibold text-sm">Asistente Comercial</span>
          </div>
          <Button onClick={createNewConversation} className="w-full gap-2 text-sm text-white" style={{ background: '#0F8B6C' }}>
            <Plus className="w-3.5 h-3.5" />Nueva sesión
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvs ? (
            <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Sin sesiones previas</p>
          ) : conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => openConversation(conv)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                activeConvId === conv.id ? 'text-white' : 'hover:bg-muted text-foreground'
              }`}
              style={activeConvId === conv.id ? { background: '#0F8B6C' } : {}}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate text-xs">{conv.metadata?.name || 'Sesión'}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-white flex items-center justify-between">
          <div>
            <h1 className="font-poppins font-semibold text-base">Asistente Comercial IA</h1>
            <p className="text-xs text-muted-foreground">Pipeline B2B · Cotizaciones · Clientes · Producción</p>
          </div>
          {activeConvId && (
            <span className="text-xs text-muted-foreground">{messages.filter(m => m.role === 'user').length} mensajes</span>
          )}
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!activeConvId && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#0F8B6C' }}>
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-poppins font-semibold text-lg mb-2">¿En qué puedo ayudarte hoy?</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Soy el asistente comercial de Peyu. Puedo consultar leads, crear cotizaciones, revisar producción y mucho más.
              </p>
              <div className="grid grid-cols-1 gap-2 w-full">
                {SUGERENCIAS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="text-left px-4 py-2.5 rounded-xl border border-border bg-white hover:bg-muted/30 transition-colors text-sm text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#0F8B6C' }}>
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-border rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-white">
          {/* Sugerencias rápidas cuando hay conversación activa */}
          {activeConvId && messages.length > 0 && messages.length < 4 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {SUGERENCIAS.slice(0, 4).map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full border border-border bg-muted/30 hover:bg-muted transition-colors flex-shrink-0"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta sobre leads, clientes, producción..."
              className="flex-1"
              disabled={sending}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              style={{ background: '#0F8B6C' }}
              className="text-white gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Acceso a Leads · Clientes · Cotizaciones · Productos · Producción · Tareas
          </p>
        </div>
      </div>
    </div>
  );
}