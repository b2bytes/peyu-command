// ============================================================================
// PostDetailDrawer · vista detalle de un post con imagen grande
// Permite revisar copy completo, hashtags, CTA y actuar (aprobar/rechazar/publicar)
// ============================================================================
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Copy, Check, Send, Loader2, ExternalLink, Clock, Hash, Target, Instagram, Linkedin, Facebook, Music2, Twitter, Sparkles } from 'lucide-react';

const ICONOS_RED = { Instagram, LinkedIn: Linkedin, Facebook, TikTok: Music2, 'Twitter/X': Twitter };

export default function PostDetailDrawer({ post, onClose, onAction, actioning }) {
  const [copied, setCopied] = useState(false);
  const Icon = ICONOS_RED[post.red_social] || Sparkles;

  const copyText = () => {
    navigator.clipboard.writeText(`${post.copy}\n\n${post.hashtags || ''}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-3xl bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 z-50 overflow-hidden flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{post.red_social} · {post.tipo_post}</p>
              <h2 className="text-base font-bold text-white leading-tight">{post.titulo}</h2>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body — 2 columnas: imagen grande + detalles */}
        <div className="flex-1 overflow-y-auto peyu-scrollbar-light">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-0">
            {/* Imagen grande */}
            <div className="relative bg-black aspect-square lg:aspect-auto lg:min-h-[500px]">
              {post.imagen_url ? (
                <img src={post.imagen_url} alt={post.titulo} className="w-full h-full object-contain" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/30">
                  Sin imagen
                </div>
              )}
              {post.pillar_contenido && (
                <span className="absolute top-3 left-3 bg-violet-500/95 backdrop-blur px-2.5 py-1 rounded-full text-[11px] text-white font-bold">
                  {post.pillar_contenido}
                </span>
              )}
            </div>

            {/* Detalles */}
            <div className="p-5 space-y-4">
              {/* Copy */}
              <Section title="Copy" icon={Sparkles}>
                <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">{post.copy}</p>
              </Section>

              {/* Hashtags */}
              {post.hashtags && (
                <Section title="Hashtags" icon={Hash}>
                  <p className="text-xs text-violet-300 leading-relaxed">{post.hashtags}</p>
                </Section>
              )}

              {/* CTA */}
              {post.cta && (
                <Section title="Call-to-action" icon={Target}>
                  <p className="text-sm text-amber-300 font-medium flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" /> {post.cta}
                  </p>
                </Section>
              )}

              {/* Meta · 2 columnas */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <MetaCard label="Fecha programada" value={post.fecha_publicacion ? new Date(post.fecha_publicacion).toLocaleDateString('es-CL') : '—'} />
                <MetaCard label="Hora óptima" value={post.hora_publicacion || '—'} />
                <MetaCard label="Objetivo" value={post.objetivo || '—'} />
                <MetaCard label="SKU relacionado" value={post.producto_relacionado_sku || '—'} mono />
              </div>

              {/* Métricas si publicado */}
              {post.estado === 'Publicado' && (post.impresiones || post.likes) && (
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {[
                    { l: 'Impresiones', v: post.impresiones },
                    { l: 'Likes',       v: post.likes },
                    { l: 'Comentarios', v: post.comentarios },
                    { l: 'Shares',      v: post.shares },
                  ].map(m => (
                    <div key={m.l} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                      <p className="text-base font-bold text-white">{m.v || 0}</p>
                      <p className="text-[9px] uppercase tracking-wider text-white/50">{m.l}</p>
                    </div>
                  ))}
                </div>
              )}

              {post.link_publicado && (
                <a
                  href={post.link_publicado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-sky-300 hover:underline pt-2"
                >
                  <ExternalLink className="w-4 h-4" /> Ver publicación en {post.red_social}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer · acciones */}
        <div className="flex-shrink-0 border-t border-white/10 p-4 flex items-center gap-2 bg-black/30">
          <Button onClick={copyText} variant="outline" size="sm" className="bg-white/5 border-white/15 text-white hover:bg-white/10 gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Copiar texto'}
          </Button>

          <div className="flex-1" />

          {post.estado === 'En revisión' && (
            <>
              <Button onClick={() => onAction('reject')} disabled={actioning} variant="outline" className="bg-white/5 border-white/15 text-white hover:bg-rose-500/20 hover:border-rose-400/50 gap-1.5">
                <X className="w-4 h-4" /> Rechazar
              </Button>
              <Button onClick={() => onAction('approve')} disabled={actioning} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 shadow-lg shadow-emerald-500/30">
                {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Aprobar
              </Button>
            </>
          )}
          {post.estado === 'Aprobado' && (
            <Button onClick={() => onAction('publish')} disabled={actioning} className="bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white gap-1.5 shadow-lg shadow-pink-500/30">
              {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publicar ahora
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
        <Icon className="w-3 h-3 text-white/40" />
        <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">{title}</p>
      </div>
      {children}
    </div>
  );
}

function MetaCard({ label, value, mono }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">{label}</p>
      <p className={`text-sm text-white mt-0.5 truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}