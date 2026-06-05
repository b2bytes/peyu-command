import { CheckCircle2, Building2, Mail, MessageCircle, FileText, PhoneCall } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';

// Próximos pasos tras enviar la cotización: dan claridad de qué pasará.
const PASOS = [
  { Icon: FileText, txt: 'Revisamos tu pedido y armamos el presupuesto formal con factura.' },
  { Icon: PhoneCall, txt: 'Un ejecutivo te contacta en 24h hábiles para afinar plazos y personalización.' },
  { Icon: CheckCircle2, txt: 'Confirmas, pagas el anticipo y entramos a producción.' },
];

// Tarjeta de resultado tras enviar la cotización: confirma el envío y muestra
// el desglose con precios por volumen reales que calculó el backend.
export default function QuoteResultCard({ result, empresa, email, onReset }) {
  return (
    <div className="bg-white border border-[#EBE3D6] rounded-3xl p-6 sm:p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#0F8B6C]/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8 text-[#0F8B6C]" />
      </div>
      <h2 className="font-fraunces text-2xl text-[#2A2420] mb-1">¡Cotización recibida!</h2>
      <p className="text-sm text-[#4B4F54] mb-1">
        Preparamos tu presupuesto por volumen. Nuestro equipo te contactará a la brevedad.
      </p>
      <div className="flex items-center justify-center gap-3 text-xs text-[#A78B6F] mb-6">
        <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" /> {empresa}</span>
        <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {email}</span>
      </div>

      <div className="text-left bg-[#FAF7F2] border border-[#EBE3D6] rounded-2xl p-4 space-y-2 mb-5">
        {result.lineas.map((l) => (
          <div key={l.sku} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-[#2A2420] truncate">
              <span className="font-bold">{l.cantidad}×</span> {l.nombre}
              <span className="text-[#A78B6F] text-[11px] ml-1">({fmtCLP(l.precio_unitario)}/u · {l.tramo})</span>
            </span>
            <span className="font-bold text-[#2A2420] flex-shrink-0">{fmtCLP(l.subtotal)}</span>
          </div>
        ))}
        <div className="border-t border-[#EBE3D6] pt-2 mt-2 space-y-1">
          <div className="flex justify-between text-xs text-[#4B4F54]">
            <span>Neto ({result.qty_total} u)</span><span>{fmtCLP(result.total_neto)}</span>
          </div>
          <div className="flex justify-between text-xs text-[#4B4F54]">
            <span>IVA (19%)</span><span>{fmtCLP(result.iva)}</span>
          </div>
          <div className="flex justify-between font-bold text-[#0F8B6C] text-base">
            <span>Total estimado</span><span>{fmtCLP(result.total_con_iva)}</span>
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

      <div className="flex flex-col sm:flex-row gap-2.5">
        <a
          href="https://wa.me/56912345678?text=Hola%20PEYU,%20acabo%20de%20enviar%20una%20cotizaci%C3%B3n%20por%20volumen%20y%20quiero%20avanzar."
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
          Hacer otra cotización
        </button>
      </div>
    </div>
  );
}