// ============================================================================
// PEYU OS · Stream de conversación.
// Renderiza burbujas de texto + los bloques hidratados que el agente adjunta.
// ============================================================================
import ReactMarkdown from 'react-markdown';
import KpiBlock from './blocks/KpiBlock';
import QuotesBlock from './blocks/QuotesBlock';
import UrgentAlertBlock from './blocks/UrgentAlertBlock';
import ProductBlock from './blocks/ProductBlock';
import ProductionBlock from './blocks/ProductionBlock';
import AccionBlock from './blocks/AccionBlock';
import MensajeBlock from './blocks/MensajeBlock';

function Blocks({ blocks, crm, kpis, onAction, busyId, onEjecutarAccion, onEnviarMensaje }) {
  if (!blocks?.length) return null;
  return (
    <div className="space-y-3 mt-2">
      {blocks.map((b, i) => {
        if (b.type === 'kpis') return <KpiBlock key={i} data={kpis} />;
        if (b.type === 'urgent') return <UrgentAlertBlock key={i} cotizaciones={crm.cotizaciones} onAction={onAction} busyId={busyId} />;
        if (b.type === 'quotes') return <QuotesBlock key={i} cotizaciones={crm.cotizaciones} onAction={onAction} busyId={busyId} />;
        if (b.type === 'production') return <ProductionBlock key={i} pedidos={crm.pedidos} />;
        if (b.type === 'product') return <ProductBlock key={i} producto={b.product} />;
        if (b.type === 'accion') return <AccionBlock key={i} accion={b.accion} onEjecutar={onEjecutarAccion} />;
        if (b.type === 'mensaje') return <MensajeBlock key={i} mensaje={b.mensaje} onEnviar={onEnviarMensaje} />;
        return null;
      })}
    </div>
  );
}

export default function MessageStream({ messages, crm, kpis, onAction, busyId, loading, bottomRef, onEjecutarAccion, onEnviarMensaje }) {
  return (
    <div className="flex-1 overflow-y-auto peyu-scrollbar px-3 sm:px-6 py-6">
      <div className="max-w-[880px] mx-auto space-y-5">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-white border border-[#e7d8c6] flex items-center justify-center text-base flex-shrink-0 mt-0.5 shadow-sm">
                🐢
              </div>
            )}
            <div className={`min-w-0 ${m.role === 'user' ? 'max-w-[80%]' : 'flex-1'}`}>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-[#0F8B6C] text-white rounded-tr-sm ml-auto inline-block'
                    : 'bg-white border border-[#ece4d8] text-[#22302c] rounded-tl-sm'
                }`}
              >
                {m.role === 'user' ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <ReactMarkdown
                    className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                    components={{
                      p: ({ children }) => <p className="my-1 leading-relaxed text-[#22302c]">{children}</p>,
                      ul: ({ children }) => <ul className="my-1 ml-4 list-disc text-[#22302c]">{children}</ul>,
                      li: ({ children }) => <li className="my-0.5">{children}</li>,
                      strong: ({ children }) => <strong className="text-[#0F8B6C] font-semibold">{children}</strong>,
                      code: ({ children }) => <code className="px-1 py-0.5 rounded bg-[#f6f1ea] text-xs">{children}</code>,
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                )}
              </div>
              {m.role === 'assistant' && (
                <Blocks blocks={m.blocks} crm={crm} kpis={kpis} onAction={onAction} busyId={busyId} onEjecutarAccion={onEjecutarAccion} onEnviarMensaje={onEnviarMensaje} />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-[#e7d8c6] flex items-center justify-center text-base flex-shrink-0 shadow-sm">🐢</div>
            <div className="bg-white border border-[#ece4d8] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#0F8B6C] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}