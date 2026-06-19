import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, Download, Loader2, Check, Mail, AlertTriangle } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// VendedorQuoteCard — Card inteligente de PROPUESTA PDF B2B dentro del chat.
// Cuando el agente emite [[QUOTE_PDF:sku=...;qty=...;empresa=...;...]] esta
// card genera la propuesta formal (backend generateChatQuotePDF), muestra el
// resumen económico ordenado y permite descargarla / la envía al correo.
// Genera UNA sola vez por solicitud (idempotente por la firma de campos).
// ════════════════════════════════════════════════════════════════════════
const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');

export default function VendedorQuoteCard({ req }) {
  const [estado, setEstado] = useState('idle'); // idle | loading | done | error
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const startedRef = useRef(false);

  // Firma estable de la solicitud → evita regenerar si el componente re-renderiza.
  const firma = `${req.sku}|${req.qty}|${req.empresa}|${req.email}`;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setEstado('loading');
    base44.functions.invoke('generateChatQuotePDF', {
      sku: req.sku,
      qty: req.qty,
      empresa: req.empresa,
      contacto: req.contacto,
      email: req.email,
      telefono: req.telefono,
      fecha_requerida: req.fecha_requerida,
      personalizacion: req.personalizacion,
    }).then((res) => {
      const d = res?.data;
      if (d?.ok && d.pdf_base64) {
        setData(d);
        setEstado('done');
      } else {
        setErrorMsg(d?.error || 'No pudimos generar la cotización.');
        setEstado('error');
      }
    }).catch((e) => {
      setErrorMsg(e?.message || 'No pudimos generar la cotización.');
      setEstado('error');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma]);

  const descargar = () => {
    if (!data?.pdf_base64) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${data.pdf_base64}`;
    link.download = data.filename || 'Cotizacion-Peyu.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-2xl overflow-hidden w-full" style={{ background: 'white', border: '1.5px solid #D4C4B0', boxShadow: '0 4px 16px rgba(44,24,16,.08)' }}>
      {/* Header verde bosque (identidad propuesta PEYU) */}
      <div className="px-4 py-3 flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg,#0B4634,#0F8B6C)' }}>
        <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,.18)' }}>
          <FileText className="w-4 h-4 text-white" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white leading-tight">Propuesta comercial PEYU</p>
          <p className="text-[10px] font-semibold leading-tight" style={{ color: '#CDEAE0' }}>
            {req.empresa || 'Tu cotización formal en PDF'}
          </p>
        </div>
      </div>

      <div className="p-4">
        {estado === 'loading' && (
          <div className="flex items-center gap-2.5 py-3">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#0F8B6C' }} />
            <span className="text-sm font-semibold" style={{ color: '#7A6050' }}>Generando tu propuesta PDF…</span>
          </div>
        )}

        {estado === 'error' && (
          <div className="flex items-start gap-2.5 py-1">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#D96B4D' }} />
            <span className="text-[13px] font-semibold" style={{ color: '#B45309' }}>{errorMsg}</span>
          </div>
        )}

        {estado === 'done' && data && (
          <>
            {/* Resumen económico ordenado tipo ficha */}
            <div className="rounded-xl p-3 mb-3" style={{ background: '#F0F7F4', border: '1px solid #CDE7DD' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#0B6E55' }}>Cotización {data.numero}</span>
                <span className="text-[10px] font-semibold" style={{ color: '#7A6050' }}>{req.qty} u</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-[11px] font-semibold" style={{ color: '#7A6050' }}>Total (IVA incl.)</span>
                <span className="text-xl font-bold" style={{ color: '#0B4634' }}>{fmtCLP(data.total)}</span>
              </div>
            </div>

            {/* Estado de envío por correo */}
            {data.email_enviado && (
              <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-bold" style={{ color: '#0F8B6C' }}>
                <Mail className="w-3.5 h-3.5" /> Enviada a {req.email}
              </div>
            )}

            {/* Acciones */}
            <button
              onClick={descargar}
              className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-sm transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }}
            >
              <Download className="w-4 h-4" /> Descargar propuesta PDF
            </button>
            <p className="text-[10px] text-center mt-2" style={{ color: '#A08070' }}>
              Válida 15 días · Láser gratis desde 10u · Pago 50/50
            </p>
          </>
        )}
      </div>
    </div>
  );
}