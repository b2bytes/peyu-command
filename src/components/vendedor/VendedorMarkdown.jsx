import ReactMarkdown from 'react-markdown';

// ════════════════════════════════════════════════════════════════════════
// VendedorMarkdown — Renderiza el texto del agente con formato real (negritas,
// listas, párrafos) en vez del muro de markdown crudo (**, *, -) que se veía
// plano y básico. Estilizado para la burbuja crema del chat vendedor.
// ════════════════════════════════════════════════════════════════════════
export default function VendedorMarkdown({ children, isUser = false }) {
  const textColor = isUser ? '#FFFFFF' : '#2C1810';
  const accent = isUser ? 'rgba(255,255,255,.92)' : '#C0785C';

  return (
    <ReactMarkdown
      components={{
        p: ({ node, ...props }) => (
          <p className="text-[13px] leading-relaxed mb-1.5 last:mb-0" style={{ color: textColor }} {...props} />
        ),
        strong: ({ node, ...props }) => (
          <strong className="font-bold" style={{ color: isUser ? '#FFFFFF' : '#1A0F08' }} {...props} />
        ),
        em: ({ node, ...props }) => <em className="italic" {...props} />,
        ul: ({ node, ...props }) => <ul className="space-y-1 my-1.5 pl-0.5" {...props} />,
        ol: ({ node, ...props }) => <ol className="space-y-1 my-1.5 pl-4 list-decimal" {...props} />,
        li: ({ node, children, ...props }) => (
          <li className="text-[13px] leading-snug flex gap-1.5 items-start" style={{ color: textColor }} {...props}>
            <span className="mt-[6px] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent }} />
            <span className="flex-1 min-w-0">{children}</span>
          </li>
        ),
        a: ({ node, ...props }) => (
          <a className="font-bold underline" style={{ color: accent }} target="_blank" rel="noopener noreferrer" {...props} />
        ),
        h1: ({ node, ...props }) => <p className="text-sm font-bold mb-1" style={{ color: textColor }} {...props} />,
        h2: ({ node, ...props }) => <p className="text-sm font-bold mb-1" style={{ color: textColor }} {...props} />,
        h3: ({ node, ...props }) => <p className="text-[13px] font-bold mb-1" style={{ color: textColor }} {...props} />,
        code: ({ node, ...props }) => (
          <code className="px-1 py-0.5 rounded text-[11px] font-mono" style={{ background: 'rgba(192,120,92,.12)', color: '#A86440' }} {...props} />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}