// ============================================================================
// PEYU OS · ContenidoBlock
// Orquesta al agente de marketing dentro del mismo chat. Flujo confirmable:
//   1) Generar borrador (texto + imagen IA) → generateSocialContent
//   2) Revisar copy/hashtags/imagen
//   3) Publicar directo a IG/LinkedIn (publishContentPost) o dejar como borrador
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, CheckCircle2, Send, Image as ImageIcon, Instagram, Linkedin, FileText } from 'lucide-react';

export default function ContenidoBlock({ contenido }) {
  const [estado, setEstado] = useState('idle'); // idle | generando | listo | publicando | publicado | error
  const [draft, setDraft] = useState(null);     // { copy, hashtags, imagen_url, post_id, titulo }
  const [errorMsg, setErrorMsg] = useState('');

  if (!contenido?.tema) return null;

  const red = contenido.red_social || 'Instagram';
  const esLinkedIn = red === 'LinkedIn';

  const generar = async () => {
    setEstado('generando');
    setErrorMsg('');
    try {
      const res = await base44.functions.invoke('generateSocialContent', {
        red_social: red,
        tipo_post: contenido.tipo_post || 'Post Imagen',
        pilar: contenido.pilar || 'Producto',
        tema: contenido.tema,
        objetivo: contenido.objetivo || 'Engagement',
        producto_sku: contenido.producto_sku || '',
        incluir_imagen: true,
        auto_guardar: true,
        num_variantes: 1,
        fecha_publicacion: contenido.fecha_publicacion || '',
      });
      const v = res?.data?.variantes?.[0];
      if (!v) throw new Error('No se generó contenido');
      setDraft({
        titulo: v.titulo_interno,
        copy: v.copy,
        hashtags: v.hashtags,
        imagen_url: v.imagen_url,
        post_id: v.post_id,
      });
      setEstado('listo');
    } catch (e) {
      setErrorMsg(e?.response?.data?.error || e?.message || 'No se pudo generar');
      setEstado('error');
    }
  };

  const publicar = async () => {
    if (!draft?.post_id) return;
    setEstado('publicando');
    setErrorMsg('');
    try {
      // El post debe estar Aprobado/Programado para publicar.
      await base44.entities.ContentPost.update(draft.post_id, { estado: 'Aprobado' });
      const res = await base44.functions.invoke('publishContentPost', { post_id: draft.post_id, modo: 'auto' });
      if (!res?.data?.ok) throw new Error(res?.data?.reason || 'No se pudo publicar');
      setDraft((d) => ({ ...d, link: res.data.link, modo: res.data.modo }));
      setEstado('publicado');
    } catch (e) {
      setErrorMsg(e?.response?.data?.error || e?.message || 'No se pudo publicar');
      setEstado('error');
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-[#e7d8c6] p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#0F8B6C]/15 to-[#D96B4D]/15 text-[#0F8B6C]">
          {esLinkedIn ? <Linkedin className="w-4 h-4" /> : <Instagram className="w-4 h-4" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#22302c] truncate">
            {contenido.etiqueta || `Contenido para ${red}`}
          </p>
          <p className="text-[11px] text-[#9aa6a0] truncate">{contenido.pilar || 'Producto'} · {contenido.objetivo || 'Engagement'}</p>
        </div>
      </div>

      <p className="text-sm text-[#6f7d77] mb-3 leading-relaxed">{contenido.tema}</p>

      {/* Borrador generado */}
      {draft && (
        <div className="mb-3 rounded-xl border border-[#ece4d8] bg-[#fbfaf7] overflow-hidden">
          {draft.imagen_url ? (
            <img src={draft.imagen_url} alt={draft.titulo} className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-24 flex items-center justify-center text-[#c8bfae]"><ImageIcon className="w-6 h-6" /></div>
          )}
          <div className="p-3">
            <p className="text-xs text-[#22302c] whitespace-pre-wrap leading-relaxed">{draft.copy}</p>
            {draft.hashtags && <p className="text-[11px] text-[#0F8B6C] mt-1.5">{draft.hashtags}</p>}
          </div>
        </div>
      )}

      {/* Acciones según estado */}
      {estado === 'publicado' ? (
        <div className="flex items-center gap-2 text-sm font-medium text-[#0F8B6C]">
          <CheckCircle2 className="w-4 h-4" />
          {draft?.modo === 'auto' ? `Publicado en ${red}` : 'Marcado como publicado'}
          {draft?.link && <a href={draft.link} target="_blank" rel="noreferrer" className="underline text-[#0F8B6C]">ver</a>}
        </div>
      ) : estado === 'listo' || estado === 'publicando' ? (
        <div className="flex items-center gap-2">
          <button
            onClick={publicar}
            disabled={estado === 'publicando'}
            className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl bg-[#0F8B6C] hover:bg-[#0b6e55] text-white transition-colors disabled:opacity-50"
          >
            {estado === 'publicando' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publicar en {red}
          </button>
          <span className="inline-flex items-center gap-1.5 text-xs text-[#9aa6a0]">
            <FileText className="w-3.5 h-3.5" /> guardado como borrador
          </span>
        </div>
      ) : (
        <button
          onClick={generar}
          disabled={estado === 'generando'}
          className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl bg-[#0F8B6C] hover:bg-[#0b6e55] text-white transition-colors disabled:opacity-50"
        >
          {estado === 'generando' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {estado === 'generando' ? 'Generando texto + imagen…' : 'Generar borrador'}
        </button>
      )}

      {estado === 'error' && <p className="text-xs text-[#D96B4D] mt-2">{errorMsg}</p>}
    </div>
  );
}