// ============================================================================
// LaunchFlowDiagram — Diagrama de flujo militar del blitz de lanzamiento PEYU
// ----------------------------------------------------------------------------
// Visualiza cómo se conectan todas las piezas: Ads → Landing → Lead → CRM → Cierre.
// SVG puro, responsive, con leyenda y estado en vivo de cada nodo.
// ============================================================================
import { Radar, Target, Zap, FileText, Mail, Brain, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';

const NODES = [
  // Columna 1 — Fuentes de tráfico
  { id: 'ads', x: 60, y: 60, w: 160, h: 70, label: 'Google Ads', sub: 'Commander + Scientist', icon: Target, color: 'orange', col: 1 },
  { id: 'seo', x: 60, y: 160, w: 160, h: 70, label: 'SEO Orgánico', sub: 'GSC + Schema + Sitemap', icon: Radar, color: 'purple', col: 1 },
  { id: 'social', x: 60, y: 260, w: 160, h: 70, label: 'Social / WhatsApp', sub: 'Instagram + WA Business', icon: Zap, color: 'pink', col: 1 },

  // Columna 2 — Indexación (solo SEO)
  { id: 'indexnow', x: 280, y: 160, w: 160, h: 70, label: 'Indexación', sub: 'IndexNow + Sitemaps', icon: Zap, color: 'red', col: 2 },

  // Columna 3 — Landings
  { id: 'landing', x: 500, y: 60, w: 160, h: 70, label: '/lanzamiento', sub: 'Pure conversion B2B', icon: FileText, color: 'emerald', col: 3 },
  { id: 'shop', x: 500, y: 260, w: 160, h: 70, label: '/shop', sub: 'Landing + /', icon: FileText, color: 'teal', col: 3 },

  // Columna 4 — Captura
  { id: 'lead', x: 720, y: 160, w: 160, h: 70, label: 'Lead en CRM', sub: 'Form + UTM tracking', icon: Mail, color: 'blue', col: 4 },

  // Columna 5 — Inteligencia
  { id: 'brain', x: 940, y: 60, w: 160, h: 70, label: 'Pinecone Brain', sub: 'Contexto 360° del lead', icon: Brain, color: 'indigo', col: 5 },
  { id: 'ga', x: 940, y: 160, w: 160, h: 70, label: 'GA4 Realtime', sub: 'Atribución por canal', icon: BarChart3, color: 'amber', col: 5 },
  { id: 'close', x: 940, y: 260, w: 160, h: 70, label: 'Cierre B2B', sub: 'Propuesta → Orden', icon: CheckCircle2, color: 'green', col: 5 },
];

const EDGES = [
  { from: 'ads', to: 'landing' },
  { from: 'seo', to: 'indexnow' },
  { from: 'indexnow', to: 'landing' },
  { from: 'indexnow', to: 'shop' },
  { from: 'social', to: 'shop' },
  { from: 'landing', to: 'lead' },
  { from: 'shop', to: 'lead' },
  { from: 'lead', to: 'brain' },
  { from: 'lead', to: 'ga' },
  { from: 'lead', to: 'close' },
  { from: 'ga', to: 'ads' }, // feedback loop — scientist usa GA4 para optimizar ads
];

const COLORS = {
  orange: { bg: 'fill-orange-50', border: 'stroke-orange-400', text: 'text-orange-700' },
  purple: { bg: 'fill-purple-50', border: 'stroke-purple-400', text: 'text-purple-700' },
  pink: { bg: 'fill-pink-50', border: 'stroke-pink-400', text: 'text-pink-700' },
  red: { bg: 'fill-red-50', border: 'stroke-red-400', text: 'text-red-700' },
  emerald: { bg: 'fill-emerald-50', border: 'stroke-emerald-500', text: 'text-emerald-700' },
  teal: { bg: 'fill-teal-50', border: 'stroke-teal-400', text: 'text-teal-700' },
  blue: { bg: 'fill-blue-50', border: 'stroke-blue-500', text: 'text-blue-700' },
  indigo: { bg: 'fill-indigo-50', border: 'stroke-indigo-400', text: 'text-indigo-700' },
  amber: { bg: 'fill-amber-50', border: 'stroke-amber-400', text: 'text-amber-700' },
  green: { bg: 'fill-green-50', border: 'stroke-green-500', text: 'text-green-700' },
};

const getNode = (id) => NODES.find(n => n.id === id);

// Calcula la curva Bezier entre dos nodos
const edgePath = (from, to) => {
  const a = getNode(from);
  const b = getNode(to);
  if (!a || !b) return '';
  const x1 = a.x + a.w;
  const y1 = a.y + a.h / 2;
  const x2 = b.x;
  const y2 = b.y + b.h / 2;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
};

// Feedback loop (ga → ads) — curva hacia atrás por arriba
const feedbackPath = (from, to) => {
  const a = getNode(from);
  const b = getNode(to);
  const x1 = a.x;
  const y1 = a.y + 10;
  const x2 = b.x + b.w;
  const y2 = b.y + 10;
  return `M ${x1} ${y1} C ${x1 - 150} ${y1 - 80}, ${x2 + 150} ${y2 - 80}, ${x2} ${y2}`;
};

export default function LaunchFlowDiagram() {
  return (
    <div className="w-full overflow-x-auto bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-4">
      <svg viewBox="0 0 1160 360" className="w-full min-w-[900px]" style={{ height: 'auto' }}>
        {/* Grid subtle */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
          </pattern>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#64748b"/>
          </marker>
          <marker id="arrowFeedback" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#f59e0b"/>
          </marker>
        </defs>
        <rect width="1160" height="360" fill="url(#grid)"/>

        {/* Edges */}
        {EDGES.map((e, i) => {
          const isFeedback = e.from === 'ga' && e.to === 'ads';
          return (
            <path
              key={i}
              d={isFeedback ? feedbackPath(e.from, e.to) : edgePath(e.from, e.to)}
              fill="none"
              stroke={isFeedback ? '#f59e0b' : '#94a3b8'}
              strokeWidth={isFeedback ? 2 : 1.5}
              strokeDasharray={isFeedback ? '5 3' : ''}
              markerEnd={`url(#${isFeedback ? 'arrowFeedback' : 'arrow'})`}
              opacity={0.75}
            />
          );
        })}

        {/* Nodes */}
        {NODES.map((n) => {
          const c = COLORS[n.color];
          return (
            <g key={n.id}>
              <rect
                x={n.x} y={n.y} width={n.w} height={n.h}
                rx="10"
                className={`${c.bg} ${c.border}`}
                strokeWidth="2"
              />
              <text x={n.x + 14} y={n.y + 28} className={`${c.text} font-poppins font-bold text-[14px]`}>
                {n.label}
              </text>
              <text x={n.x + 14} y={n.y + 48} className="fill-slate-500 text-[11px]">
                {n.sub}
              </text>
            </g>
          );
        })}

        {/* Labels de fases */}
        <text x="140" y="25" textAnchor="middle" className="fill-slate-400 font-semibold text-[10px] uppercase tracking-widest">1. Tráfico</text>
        <text x="360" y="25" textAnchor="middle" className="fill-slate-400 font-semibold text-[10px] uppercase tracking-widest">2. Indexar</text>
        <text x="580" y="25" textAnchor="middle" className="fill-slate-400 font-semibold text-[10px] uppercase tracking-widest">3. Conversión</text>
        <text x="800" y="25" textAnchor="middle" className="fill-slate-400 font-semibold text-[10px] uppercase tracking-widest">4. Captura</text>
        <text x="1020" y="25" textAnchor="middle" className="fill-slate-400 font-semibold text-[10px] uppercase tracking-widest">5. Inteligencia</text>

        {/* Legend feedback */}
        <g>
          <line x1="40" y1="345" x2="70" y2="345" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3"/>
          <text x="78" y="349" className="fill-slate-600 text-[11px]">Feedback loop del Scientist (optimiza Ads con data real)</text>
        </g>
      </svg>
    </div>
  );
}