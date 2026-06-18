// ============================================================================
// MetaAgentMarkdown · Render rico para las respuestas del Estratega de Meta Ads.
// Convierte el markdown del agente en CARDS TEMÁTICOS: cada encabezado (##) se
// pinta como una tarjeta con color + ícono según el tema detectado (setup/pixel,
// rendimiento, dominio, eventos, campaña, advertencia, éxito). Mejora listas,
// estados (✅/⚠️/❌) y callouts (>) para una lectura ordenada y escaneable.
// Solo presenta — no toca lógica del chat.
// ============================================================================
import { Children, isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Activity, ShieldCheck, BarChart2, Globe, Zap, Megaphone,
  AlertTriangle, CheckCircle2, Sparkles, Target, ListChecks,
} from 'lucide-react';

// Mapea el texto de un encabezado a un tema visual (color + ícono).
function themeFor(title = '') {
  const t = title.toLowerCase();
  if (/(pixel|conversions api|integraci|setup|configuraci|tracking|seguimiento)/.test(t))
    return { icon: ShieldCheck, ring: 'border-cyan-500/30', bg: 'bg-cyan-500/[0.07]', dot: 'text-cyan-300', label: 'text-cyan-200' };
  if (/(rendimiento|resultado|kpi|roas|cpa|m[eé]trica|an[aá]lisis)/.test(t))
    return { icon: BarChart2, ring: 'border-violet-500/30', bg: 'bg-violet-500/[0.07]', dot: 'text-violet-300', label: 'text-violet-200' };
  if (/(dominio|atribuci)/.test(t))
    return { icon: Globe, ring: 'border-sky-500/30', bg: 'bg-sky-500/[0.07]', dot: 'text-sky-300', label: 'text-sky-200' };
  if (/(evento|purchase|lead|addtocart|prueba|test)/.test(t))
    return { icon: Activity, ring: 'border-emerald-500/30', bg: 'bg-emerald-500/[0.07]', dot: 'text-emerald-300', label: 'text-emerald-200' };
  if (/(campa|anuncio|creativo|advantage|escalar|presupuesto)/.test(t))
    return { icon: Megaphone, ring: 'border-blue-500/30', bg: 'bg-blue-500/[0.07]', dot: 'text-blue-300', label: 'text-blue-200' };
  if (/(acci[oó]n|recomend|pr[oó]xim|siguiente|paso)/.test(t))
    return { icon: ListChecks, ring: 'border-teal-500/30', bg: 'bg-teal-500/[0.07]', dot: 'text-teal-300', label: 'text-teal-200' };
  if (/(ojo|atenci|cuidado|alerta|problema|falta|riesgo)/.test(t))
    return { icon: AlertTriangle, ring: 'border-amber-500/30', bg: 'bg-amber-500/[0.07]', dot: 'text-amber-300', label: 'text-amber-200' };
  if (/(listo|ok|excelente|confirmad|en resumen|resumen)/.test(t))
    return { icon: CheckCircle2, ring: 'border-emerald-500/30', bg: 'bg-emerald-500/[0.07]', dot: 'text-emerald-300', label: 'text-emerald-200' };
  return { icon: Sparkles, ring: 'border-white/12', bg: 'bg-white/[0.04]', dot: 'text-blue-300', label: 'text-blue-200' };
}

function plainText(children) {
  return Children.toArray(children).map((c) =>
    typeof c === 'string' ? c : isValidElement(c) ? plainText(c.props.children) : ''
  ).join('');
}

// Encabezado como cabecera de card temática.
function ThemeHeading({ children }) {
  const text = plainText(children);
  const th = themeFor(text);
  const Icon = th.icon;
  return (
    <div className={`mt-3 first:mt-0 mb-2 flex items-center gap-2 rounded-xl border ${th.ring} ${th.bg} px-3 py-2`}>
      <Icon className={`w-4 h-4 ${th.dot} flex-shrink-0`} />
      <span className={`text-[12px] font-bold tracking-tight ${th.label}`}>{text}</span>
    </div>
  );
}

// Viñeta: detecta estado inicial (✅ ⚠️ ❌) y lo pinta como chip.
function StatusListItem({ children }) {
  const arr = Children.toArray(children);
  let lead = '';
  if (typeof arr[0] === 'string') lead = arr[0].trimStart();
  let dot = 'bg-blue-400';
  if (/^(✅|✓)/.test(lead)) dot = 'bg-emerald-400';
  else if (/^(⚠️|⚠)/.test(lead)) dot = 'bg-amber-400';
  else if (/^(❌|✗|🚫)/.test(lead)) dot = 'bg-red-400';
  return (
    <li className="flex items-start gap-2 text-white/85 leading-relaxed">
      <span className={`w-1.5 h-1.5 rounded-full ${dot} mt-[7px] flex-shrink-0`} />
      <span className="flex-1">{children}</span>
    </li>
  );
}

export default function MetaAgentMarkdown({ content }) {
  return (
    <ReactMarkdown
      className="text-sm max-w-none"
      components={{
        h1: ThemeHeading,
        h2: ThemeHeading,
        h3: ThemeHeading,
        p: ({ children }) => <p className="my-1.5 leading-relaxed text-white/90">{children}</p>,
        ul: ({ children }) => <ul className="my-2 space-y-1.5">{children}</ul>,
        ol: ({ children }) => <ol className="my-2 ml-5 list-decimal space-y-1.5 marker:text-blue-300/70">{children}</ol>,
        li: StatusListItem,
        strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
        em: ({ children }) => <em className="text-blue-200 not-italic font-medium">{children}</em>,
        code: ({ children }) => (
          <code className="px-1.5 py-0.5 rounded-md bg-black/40 border border-white/10 text-[12px] text-teal-200 font-mono">{children}</code>
        ),
        blockquote: ({ children }) => (
          <div className="my-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2 text-[13px] text-amber-100/90 flex gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300 flex-shrink-0 mt-0.5" />
            <div>{children}</div>
          </div>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline underline-offset-2 hover:text-cyan-200">{children}</a>
        ),
        hr: () => <div className="my-3 h-px bg-white/10" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}