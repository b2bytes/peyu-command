import { CheckCircle2, Building2, Mail, MessageCircle, FileText, PhoneCall, Download } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';

// Próximos pasos tras enviar la cotización: dan claridad de qué pasará.
const PASOS = [
  { Icon: FileText, txt: 'Revisamos tu pedido y armamos el presupuesto formal con factura.' },
  { Icon: PhoneCall, txt: 'Un ejecutivo te contacta en 24h hábiles para afinar plazos y personalización.' },
  { Icon: CheckCircle2, txt: 'Confirmas, pagas el anticipo y entramos a producción.' },
];

// Descarga el PDF (base64) que devolvió el backend, sin pasar por red.
function descargarPDF(base64, filename) {
  if (!base64) return;
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'Cotizacion-Peyu.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Tarjeta de resultado tras enviar la cotización: confirma el envío y muestra
// el desglose con precios por volumen reales que calculó el backend.
export default function QuoteResultCard({ result, empresa, email, onReset }) {
  const tienePDF = !!result.pdf_base64;
  return (
    <div className="bg-white border border-[#EBE3D6] rounded-3xl p-6 sm:p-8 text-center pb-28 sm:pb-8">
      <div className="w-16 h-16 rounded-2xl bg-[#0F8B6C]/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8 text-[#0F8B6C]" />
      </div>
      <h2 className="font-fraunces text-2xl text-[#2A2420] mb-1">¡Cotización recibida!</h2>
      {result.numero && (
        <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F8B6C] bg-[#0F8B6C]/10 px-3 py-1 rounded-full mb-2">
          <FileText className="w-3 h-3" /> {result.numero}
        </p>
      )}
      <p className="text-sm text-[#4B4F54] mb-1">
        Preparamos tu presupuesto por volumen. Nuestro equipo te contactará a la brevedad.
      </p>
      <div className="flex items-center justify-center flex-wrap gap-3 text-xs text-[#A78B6F] mb-2">
        <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" /> {empresa}</span>
        <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {email}</span>
      </div>
      {result.email_enviado && (
        <p className="text-[11px] text-[#0F8B6C] mb-5">✓ Te enviamos el PDF a tu correo.</p>
      )}
      {!result.email_enviado && <div className="mb-5" />}

      <div className="text-left bg-white border-2 border-[#0F8B6C] rounded-2xl p-5 space-y-3 mb-5">
         {/* Líneas de productos */}
         {result.lineas.map((l, idx) => (
           <div key={l.sku}>
             <div className="flex items-center justify-between gap-2 text-sm">
               <span className="text-[#2A2420] truncate flex-1">
                 <span className="font-bold">{l.cantidad}× </span> {l.nombre}
               </span>
               <span className="font-bold text-[#2A2420] flex-shrink-0 text-right">{fmtCLP(l.subtotal)}</span>
             </div>
             <p className="text-[11px] text-[#A78B6F] mt-0.5">
               {fmtCLP(l.precio_unitario)}/u · Tramo {l.tramo}
             </p>
             {idx < result.lineas.length - 1 && <div className="border-t border-[#EBE3D6] my-2.5" />}
           </div>
         ))}

         {/* Desglose totales */}
         <div className="border-t-2 border-[#0F8B6C] pt-3.5 mt-3.5 space-y-2">
           <div className="flex justify-between text-sm">
             <span style={{ color: '#4B4F54' }}>Subtotal ({result.qty_total} u)</span>
             <span className="font-bold text-[#2A2420]">{fmtCLP(result.total_neto + result.iva)}</span>
           </div>
           <div className="flex justify-between text-sm">
             <span style={{ color: '#4B4F54', fontWeight: 'bold' }}>Neto (sin IVA)</span>
             <span className="font-bold text-[#0F8B6C] text-base">{fmtCLP(result.total_neto)}</span>
           </div>
           <div className="flex justify-between text-sm">
             <span style={{ color: '#A78B6F' }}>IVA (19%)</span>
             <span style={{ color: '#A78B6F', fontWeight: '600' }}>{fmtCLP(result.iva)}</span>
           </div>
           <div className="flex justify-between items-end pt-2 border-t border-[#0F8B6C]">
             <span style={{ color: '#0F8B6C', fontWeight: 'bold' }}>Total estimado</span>
             <span className="font-fraunces text-2xl font-bold text-[#0F8B6C]">{fmtCLP(result.total_con_iva)}</span>
           </div>
         </div>
       </div>

      {/* Próximos pasos — qué pasará ahora */}
      <div className="text-left bg-white border border-[#EBE3D6] rounded-2xl p-4 mb-5">
        <p className="text-xs font-bold text-[#2A2420] mb-3">¿Qué sigue ahora?</p>
        <div className="space-y-3">
          {PASOS.map(({ Icon, txt }, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg bg-[#0F8B6C]/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-[#0F8B6C]" />
              </span>
              <p className="text-xs text-[#4B4F54] leading-snug pt-0.5">
                <span className="font-bold text-[#2A2420]">Paso {i + 1}.</span> {txt}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-[#A78B6F] mb-5">
        Precio referencial por volumen. El presupuesto final puede variar según personalización y plazos.
      </p>

      {/* Acciones inline (desktop) */}
      <div className="hidden sm:flex flex-col gap-2.5">
        {tienePDF && (
          <button
            onClick={() => descargarPDF(result.pdf_base64, result.filename)}
            className="h-11 rounded-xl bg-[#2A2420] hover:bg-[#1a1714] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" /> Descargar cotización PDF
          </button>
        )}
        <div className="flex gap-2.5">
          <a
            href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola PEYU, acabo de enviar la cotización ${result.numero || ''} y quiero avanzar.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-11 rounded-xl bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Avanzar por WhatsApp
          </a>
          <button
            onClick={onReset}
            className="flex-1 h-11 rounded-xl bg-white border border-[#EBE3D6] hover:border-[#0F8B6C]/40 text-[#2A2420] font-bold text-sm transition-colors"
          >
            Otra cotización
          </button>
        </div>
      </div>

      {/* Botón secundario "otra cotización" visible en mobile dentro del card */}
      <button
        onClick={onReset}
        className="sm:hidden w-full h-11 rounded-xl bg-white border border-[#EBE3D6] hover:border-[#0F8B6C]/40 text-[#2A2420] font-bold text-sm transition-colors"
      >
        Hacer otra cotización
      </button>

      {/* Barra de acciones persistente (mobile): PDF + WhatsApp siempre a mano */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-[#FAF7F2]/95 backdrop-blur border-t border-[#EBE3D6] px-4 py-3 flex gap-2.5">
        {tienePDF && (
          <button
            onClick={() => descargarPDF(result.pdf_base64, result.filename)}
            className="flex-1 h-12 rounded-2xl bg-[#2A2420] text-white font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
        )}
        <a
          href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola PEYU, acabo de enviar la cotización ${result.numero || ''} y quiero avanzar.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-12 rounded-2xl bg-[#0F8B6C] text-white font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </a>
      </div>
    </div>
  );
}