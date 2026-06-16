import { useEffect, useState } from 'react';
import { X, Printer, Download, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ════════════════════════════════════════════════════════════════════════
// PropuestaViewerModal — Visor del PDF de una propuesta corporativa DENTRO
// del chat. Genera el PDF on-demand (generateProposalPDF) y lo muestra
// embebido en un modal, sin abrir pestañas externas. Permite imprimir y
// descargar el mismo documento que recibe el cliente.
// ════════════════════════════════════════════════════════════════════════
export default function PropuestaViewerModal({ proposalId, titulo, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [filename, setFilename] = useState('propuesta.pdf');
  const [error, setError] = useState('');

  useEffect(() => {
    let revoke = null;
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke('generateProposalPDF', { proposalId });
        const d = res?.data || {};
        if (!d.pdf_base64) throw new Error(d.error || 'Sin PDF');
        const bytes = Uint8Array.from(atob(d.pdf_base64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const u = URL.createObjectURL(blob);
        revoke = u;
        if (!cancelled) {
          setBlobUrl(u);
          if (d.filename) setFilename(d.filename);
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || err.message || 'Error');
      }
    })();
    return () => { cancelled = true; if (revoke) URL.revokeObjectURL(revoke); };
  }, [proposalId]);

  const imprimir = () => {
    if (!blobUrl) return;
    const w = window.open(blobUrl, '_blank');
    if (w) { try { w.focus(); } catch { /* noop */ } }
  };

  const descargar = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-2xl bg-[#ffffff] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#f1f5f9] flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#0f172a] leading-tight">Propuesta corporativa</p>
            {titulo && <p className="text-[11px] text-[#64748b] truncate">{titulo}</p>}
          </div>
          <button onClick={imprimir} disabled={!blobUrl} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold disabled:opacity-50">
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </button>
          <button onClick={descargar} disabled={!blobUrl} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-white text-[11px] font-bold disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> Descargar
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-[#f8fafc] min-h-[55vh]">
          {error ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-6 py-12">
              <AlertTriangle className="w-7 h-7 text-[#d97706]" />
              <p className="text-sm font-bold text-[#1e293b]">No se pudo generar la propuesta</p>
              <p className="text-[12px] text-[#64748b]">{error}</p>
            </div>
          ) : !blobUrl ? (
            <div className="h-full flex items-center justify-center gap-2 text-[#94a3b8]">
              <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Generando propuesta…</span>
            </div>
          ) : (
            <iframe title="Propuesta corporativa" src={blobUrl} className="w-full h-full min-h-[55vh] border-0" />
          )}
        </div>

        <div className="px-4 py-3 border-t border-[#f1f5f9] flex-shrink-0 flex gap-2 sm:hidden">
          <button onClick={imprimir} disabled={!blobUrl} className="flex-1 h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button onClick={descargar} disabled={!blobUrl} className="flex-1 h-11 rounded-xl bg-[#1e293b] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            <Download className="w-4 h-4" /> Descargar
          </button>
        </div>
      </div>
    </div>
  );
}