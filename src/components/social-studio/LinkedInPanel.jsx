// ============================================================================
// LinkedInPanel · Gestión LinkedIn conectado (OAuth connector)
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Linkedin, CheckCircle2, Loader2, ExternalLink, Send, RefreshCw, BarChart2, Users, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LinkedInPanel({ onPublished }) {
  const [status, setStatus] = useState(null);
  const [approved, setApproved] = useState([]);
  const [publishing, setPublishing] = useState(null);
  const [publishResult, setPublishResult] = useState({});

  const load = async () => {
    setStatus(null);
    const [statusRes, postsRes] = await Promise.all([
      base44.functions.invoke('linkedInStatus', {}),
      base44.entities.ContentPost.filter({ red_social: 'LinkedIn', estado: 'Aprobado' }, '-created_date', 20),
    ]);
    setStatus(statusRes.data || { connected: false, error: 'Sin respuesta' });
    setApproved(postsRes || []);
  };

  useEffect(() => { load(); }, []);

  const handlePublish = async (postId) => {
    setPublishing(postId);
    try {
      const res = await base44.functions.invoke('publishContentPost', { post_id: postId, modo: 'auto' });
      setPublishResult(prev => ({ ...prev, [postId]: res.data }));
      setApproved(prev => prev.filter(p => p.id !== postId));
      onPublished?.();
    } catch (e) {
      setPublishResult(prev => ({ ...prev, [postId]: { ok: false, error: e.message } }));
    }
    setPublishing(null);
  };

  if (!status) {
    return (
      <div className="h-full flex items-center justify-center gap-3 text-white/40">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Conectando con LinkedIn…</span>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: '#0A66C2' }}>
            <Linkedin className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">LinkedIn no conectado</h3>
          <p className="text-white/50 text-sm mb-4">{status.error || 'La conexión OAuth no está activa.'}</p>
          <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { org, stats } = status;

  return (
    <div className="h-full overflow-y-auto peyu-scrollbar-light bg-black/20 rounded-2xl border border-white/5 p-4">
      <div className="space-y-5 max-w-4xl mx-auto">

        {/* Org Card */}
        <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: 'linear-gradient(135deg,rgba(10,102,194,0.2),rgba(10,102,194,0.08))', border: '1px solid rgba(10,102,194,0.4)' }}>
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: '#0A66C2' }}>
              {org?.logoUrl ? <img src={org.logoUrl} className="w-full h-full object-cover rounded-xl" /> : <Linkedin className="w-7 h-7 text-white" />}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-slate-950 flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">{org?.name || 'PEYU Chile'}</h3>
                <p className="text-white/50 text-xs mt-0.5">linkedin.com/company/{org?.vanityName || 'peyuchile'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">✓ Conectado</span>
                <button onClick={load} className="text-white/30 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-5 mt-3 flex-wrap">
              {org?.followerCount && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-sm font-bold text-white">{org.followerCount >= 1000 ? `${(org.followerCount/1000).toFixed(1)}k` : org.followerCount}</span>
                  <span className="text-[11px] text-white/40">seguidores</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-sm font-bold text-white">{stats?.publicados || 0}</span>
                <span className="text-[11px] text-white/40">publicados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm font-bold text-white">{approved.length}</span>
                <span className="text-[11px] text-white/40">listos para publicar</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          {/* Posts aprobados */}
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-sky-400" />
              Listos para publicar
              {approved.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30">{approved.length}</span>
              )}
            </h4>

            {approved.length === 0 ? (
              <div className="text-center py-10 rounded-2xl bg-white/[0.03] border border-white/10">
                <CheckCircle2 className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/50 text-sm">Sin posts aprobados pendientes</p>
                <p className="text-white/30 text-xs mt-1">Aprueba posts en la Cola para publicarlos aquí</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {approved.map(post => {
                  const result = publishResult[post.id];
                  return (
                    <div key={post.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/30 flex-shrink-0">
                        {post.imagen_url
                          ? <img src={post.imagen_url} alt={post.titulo} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center bg-sky-900/30"><Linkedin className="w-5 h-5 text-sky-400" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{post.titulo}</p>
                        <p className="text-xs text-white/40 truncate mt-0.5">{post.copy?.slice(0, 70)}…</p>
                      </div>
                      <div className="flex-shrink-0">
                        {result?.ok ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[11px] font-bold text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Publicado</span>
                            {result.link && <a href={result.link} target="_blank" rel="noreferrer" className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5">Ver <ExternalLink className="w-2.5 h-2.5" /></a>}
                          </div>
                        ) : result?.ok === false ? (
                          <div className="text-right">
                            <span className="text-[11px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Error</span>
                            <p className="text-[9px] text-white/30 max-w-[100px] text-right">{result.error || result.reason}</p>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handlePublish(post.id)}
                            disabled={publishing === post.id}
                            size="sm"
                            className="h-8 px-3 text-xs gap-1.5 font-bold border-0"
                            style={{ background: '#0A66C2' }}
                          >
                            {publishing === post.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Publicando…</> : <><Send className="w-3 h-3" /> Publicar</>}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-5">
            {/* Acciones rápidas */}
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-violet-400" /> Acciones rápidas
              </h4>
              <div className="flex flex-col gap-2">
                <a href="https://www.linkedin.com/feed/?shareActive=true" target="_blank" rel="noreferrer"
                   className="flex items-center gap-2.5 p-3 rounded-xl bg-sky-600/10 border border-sky-500/25 hover:bg-sky-600/20 transition-colors">
                  <Send className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-white">Composer LinkedIn</p>
                    <p className="text-[10px] text-white/40">Publicar manualmente</p>
                  </div>
                </a>
                <a href={`https://www.linkedin.com/company/${org?.vanityName || 'peyuchile'}/admin/`} target="_blank" rel="noreferrer"
                   className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-600/10 border border-indigo-500/25 hover:bg-indigo-600/20 transition-colors">
                  <BarChart2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-white">Analytics</p>
                    <p className="text-[10px] text-white/40">Métricas de la página</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Posts recientes publicados */}
            {status.recent_posts?.filter(p => p.estado === 'Publicado').length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <BarChart2 className="w-4 h-4 text-emerald-400" /> Recientes
                </h4>
                <div className="space-y-2">
                  {status.recent_posts.filter(p => p.estado === 'Publicado').slice(0, 4).map(post => (
                    <div key={post.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-white/80 truncate">{post.titulo}</p>
                        {post.fecha_publicacion && (
                          <p className="text-[9px] text-white/30">{new Date(post.fecha_publicacion).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</p>
                        )}
                      </div>
                      {post.link_publicado && (
                        <a href={post.link_publicado} target="_blank" rel="noreferrer" className="text-sky-400 hover:text-sky-300 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}