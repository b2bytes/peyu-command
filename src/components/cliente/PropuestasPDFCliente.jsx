import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { FileDown, Link2, Loader2, FileText, Check } from 'lucide-react';

// Biblioteca de propuestas del cliente: todas sus cotizaciones y propuestas
// B2B con su PDF listo para descargar o compartir (mismo link que usan los
// agentes por WhatsApp).
export default function PropuestasPDFCliente({ email, empresa }) {
  const [docs, setDocs] = useState(null);
  const [copiado, setCopiado] = useState('');

  useEffect(() => {
    (async () => {
      const r = await base44.functions
        .invoke('clientePropuestas', { email, empresa })
        .catch(() => null);
      setDocs(r?.data?.propuestas || []);
    })();
  }, [email, empresa]);

  const copiar = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiado(id);
    setTimeout(() => setCopiado(''), 1800);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-teal-600" /> Propuestas en PDF
      </h2>

      {docs === null && (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-teal-600" /></div>
      )}
      {docs?.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">Este cliente aún no tiene propuestas guardadas.</p>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {(docs || []).map((d) => (
          <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-gray-900 truncate">
                {d.numero || d.id.slice(-5).toUpperCase()} · {d.origen}
              </p>
              <p className="text-xs text-gray-500">
                {d.fecha || '—'} · ${(d.total || 0).toLocaleString('es-CL')} · {d.estado}
              </p>
            </div>

            {d.share_url && (
              <button
                onClick={() => copiar(d.share_url, d.id)}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                title="Copiar link para compartir"
              >
                {copiado === d.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Link2 className="w-3.5 h-3.5" />}
                {copiado === d.id ? 'Copiado' : 'Link'}
              </button>
            )}
            {d.pdf_url ? (
              <a
                href={d.pdf_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full bg-teal-600 text-white hover:brightness-110"
              >
                <FileDown className="w-3.5 h-3.5" /> PDF
              </a>
            ) : (
              <span className="text-[10px] text-gray-400">Sin PDF</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}