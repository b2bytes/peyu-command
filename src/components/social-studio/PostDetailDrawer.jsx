// ============================================================================
// PostDetailDrawer · Liquid Dual · vista detalle de un post
// Layout: panel imagen (izq) + panel data (der) con tipografía clara, alto
// contraste en modo día y noche. Acciones aprobar / rechazar / publicar.
// ============================================================================
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  X, Copy, Check, Send, Loader2, ExternalLink, Hash, Target,
  Instagram, Linkedin, Facebook, Music2, Twitter, Sparkles, Calendar, Clock, BoxSelect, FileText,
} from 'lucide-react';

const ICONOS_RED = { Instagram, LinkedIn: Linkedin, Facebook, TikTok: Music2, 'Twitter/X': Twitter };
const COLORES_RED = {
  Instagram: 'from-pink-500 to-orange-500',
  LinkedIn:  'from-sky-600 to-blue-700',
  Facebook:  'from-blue-600 to-indigo-700',
  TikTok:    'from-slate-900 to-slate-700',
  'Twitter/X': 'from-slate-800 to-black',
};

export default function PostDetailDrawer({ post, onClose, onAction, actioning }) {
  const [copied, setCopied] = useState(false);
  const Icon = ICONOS_RED[post.red_social] || Sparkles;
  const gradient = COLORES_RED[post.red_social] || 'from-violet-500 to-pink-500';

  const copyText = () => {
    navigator.clipboard.writeText(`${post.copy || ''}\n\n${post.hashtags || ''}`.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-ld-bg border-l border-ld-border z-50 overflow-hidden flex flex-col animate-in slide-in-from-right shadow-2xl">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-ld-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-ld-fg-muted font-bold">
                {post.red_social} · {post.tipo_post}
              </p>
              <h2 className="text-base font-bold text-ld-fg leading-tight truncate">{post.titulo || 'Post sin título'}</h2>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="text-ld-fg-muted hover:text-ld-fg hover:bg-ld-bg-soft flex-shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body — 2 columnas: imagen | detalles */}
        <div className="flex-1 overflow-y-auto peyu-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-0">
            {/* Imagen grande con fondo claro */}
            <div className="relative bg-ld-bg-soft border-b lg:border-b-0 lg:border-r border-ld-border aspect-square lg:aspect-auto lg:min-h-[560px] flex items-center justify-center">
              {post.imagen_url ? (
                <img
                  src={post.imagen_url}
                  alt={post.titulo}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="text-ld-fg-muted text-sm flex flex-col items-center gap-2">
                  <BoxSelect className="w-10 h-10 opacity-40" />
                  Sin imagen
                </div>
              )}
              {post.pillar_contenido && (
                <span className="absolute top-3 left-3 ld-glass-strong px-3 py-1 rounded-full text-[11px] text-ld-fg font-bold shadow-md">
                  {post.pillar_contenido}
                </span>
              )}
            </div>

            {/* Detalles */}
            <div className="p-5 space-y-5">
              {/* Copy */}
              <Section title="Copy" icon={FileText}>
                <p className="text-[15px] text-ld-fg leading-relaxed whitespace-pre-wrap">
                  {post.copy || <span className="text-ld-fg-muted italic">Sin texto generado</span>}
                </p>
              </Section>

              {/* Hashtags */}
              {post.hashtags && (
                <Section title="Hashtags" icon={Hash}>
                  <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--ld-action)' }}>
                    {post.hashtags}
                  </p>
                </Section>
              )}

              {/* CTA */}
              {post.cta && (
                <Section title="Call-to-action" icon={Target}>
                  <p className="text-sm text-ld-fg font-medium flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--ld-highlight)' }} />
                    <span>{post.cta}</span>
                  </p>
                </Section>
              )}

              {/* Meta · 2x2 grid con contraste alto */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <MetaCard
                  icon={Calendar}
                  label="Fecha programada"
                  value={post.fecha_publicacion ? new Date(post.fecha_publicacion).toLocaleDateString('es-CL') : '—'}
                />
                <MetaCard
                  icon={Clock}
                  label="Hora óptima"
                  value={post.hora_publicacion || '—'}
                />
                <MetaCard
                  icon={Target}
                  label="Objetivo"
                  value={post.objetivo || '—'}
                />
                <MetaCard
                  icon={Sparkles}
                  label="SKU relacionado"
                  value={post.producto_relacionado_sku || '—'}
                  mono
                />
              </div>

              {/* Métricas si publicado */}
              {post.estado === 'Publicado' && (post.impresiones || post.likes || post.comentarios || post.shares) && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ld-fg-muted font-bold mb-2">Métricas</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { l: 'Impresiones', v: post.impresiones },
                      { l: 'Likes',       v: post.likes },
                      { l: 'Comentarios', v: post.comentarios },
                      { l: 'Shares',      v: post.shares },
                    ].map(m => (
                      <div key={m.l} className="ld-card p-2 text-center">
                        <p className="text-base font-bold text-ld-fg">{(m.v || 0).toLocaleString('es-CL')}</p>
                        <p className="text-[9px] uppercase tracking-wider text-ld-fg-muted font-semibold">{m.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {post.link_publicado && (
                <a
                  href={post.link_publicado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold hover:underline pt-1"
                  style={{ color: 'var(--ld-action)' }}
                >
                  <ExternalLink className="w-4 h-4" /> Ver publicación en {post.red_social}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer · acciones */}
        <div className="flex-shrink-0 border-t border-ld-border px-5 py-3 flex items-center gap-2 bg-ld-bg-soft">
          <Button
            onClick={copyText}
            variant="outline"
            size="sm"
            className="ld-btn-ghost gap-1.5 text-ld-fg"
          >
            {copied
              ? <><Check className="w-3.5 h-3.5" style={{ color: 'var(--ld-action)' }} /> Copiado</>
              : <><Copy className="w-3.5 h-3.5" /> Copiar texto</>}
          </Button>

          <div className="flex-1" />

          {post.estado === 'En revisión' && (
            <>
              <Button
                onClick={() => onAction('reject')}
                disabled={actioning}
                variant="outline"
                className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" /> Rechazar
              </Button>
              <Button
                onClick={() => onAction('approve')}
                disabled={actioning}
                className="ld-btn-primary gap-1.5"
              >
                {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Aprobar
              </Button>
            </>
          )}
          {post.estado === 'Aprobado' && (
            <Button
              onClick={() => onAction('publish')}
              disabled={actioning}
              className="ld-btn-primary gap-1.5"
            >
              {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publicar ahora
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3 text-ld-fg-muted" />
        <p className="text-[10px] uppercase tracking-wider text-ld-fg-muted font-bold">{title}</p>
      </div>
      {children}
    </div>
  );
}

function MetaCard({ icon: Icon, label, value, mono }) {
  return (
    <div className="ld-card px-3 py-2">
      <div className="flex items-center gap-1.5 mb-0.5">
        {Icon && <Icon className="w-3 h-3 text-ld-fg-muted" />}
        <p className="text-[10px] uppercase tracking-wider text-ld-fg-muted font-bold">{label}</p>
      </div>
      <p className={`text-sm font-semibold text-ld-fg mt-0.5 truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}