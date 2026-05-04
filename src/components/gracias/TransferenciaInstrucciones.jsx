import { useState } from 'react';
import { Copy, Check, Building2, AlertCircle, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Bloque de instrucciones de pago por transferencia para la página /gracias.
 * Muestra los datos bancarios oficiales de Peyu Chile SpA con botones para
 * copiar al portapapeles y CTAs para enviar el comprobante por WhatsApp/email.
 *
 * Se monta SOLO cuando ?pago=Transferencia en la URL de /gracias.
 */

const DATOS = [
  { label: 'Titular',       value: 'Peyu Chile SpA' },
  { label: 'RUT',           value: '77.069.974-6' },
  { label: 'Banco',         value: 'Banco Santander' },
  { label: 'Tipo cuenta',   value: 'Cuenta Corriente' },
  { label: 'N° cuenta',     value: '94151872', highlight: true },
  { label: 'Email',         value: 'ventas@peyuchile.cl' },
];

function CopyRow({ label, value, highlight }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-emerald-50/50 transition-colors text-left group"
    >
      <span className="text-xs text-gray-500 font-medium flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`font-mono tabular-nums truncate ${highlight ? 'text-base font-bold text-emerald-700' : 'text-sm font-semibold text-gray-900'}`}>
          {value}
        </span>
        {copied
          ? <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          : <Copy className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
        }
      </div>
    </button>
  );
}

export default function TransferenciaInstrucciones({ numero, total }) {
  const totalFmt = total ? `$${total.toLocaleString('es-CL')}` : '';
  const waMsg = encodeURIComponent(
    `Hola PEYU 👋, adjunto comprobante de transferencia del pedido ${numero} por ${totalFmt}.`
  );
  const emailSubject = encodeURIComponent(`Comprobante transferencia · ${numero}`);

  return (
    <div className="bg-white border-2 border-emerald-400/50 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/10">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
          <Building2 className="w-7 h-7" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100 mb-1">Acción requerida</p>
        <h2 className="font-poppins font-bold text-xl sm:text-2xl">Transfiere {totalFmt}</h2>
        <p className="text-xs text-emerald-50/90 mt-1">Para iniciar la producción de tu pedido</p>
      </div>

      {/* Datos bancarios */}
      <div className="bg-gray-50 divide-y divide-gray-100">
        {DATOS.map((d) => <CopyRow key={d.label} {...d} />)}
      </div>

      {/* Pasos */}
      <div className="p-5 sm:p-6 bg-amber-50/70 border-t border-amber-100">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 space-y-1.5">
            <p className="font-bold text-amber-950">Pasos para finalizar:</p>
            <ol className="space-y-1 text-xs leading-relaxed text-amber-800/90 list-decimal list-inside">
              <li>Realiza la transferencia por <strong className="text-amber-950">{totalFmt}</strong>.</li>
              <li>En el detalle/comentario, indica el N° de pedido <strong className="text-amber-950 font-mono">{numero}</strong>.</li>
              <li>Envíanos el comprobante por WhatsApp o email.</li>
              <li>Apenas validemos el pago, comenzamos la producción 🐢.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* CTAs envío comprobante */}
      <div className="p-4 sm:p-5 bg-white grid grid-cols-2 gap-2.5">
        <a
          href={`https://wa.me/56935040242?text=${waMsg}`}
          target="_blank"
          rel="noreferrer"
        >
          <Button className="w-full h-11 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold gap-2 text-sm">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </Button>
        </a>
        <a href={`mailto:ventas@peyuchile.cl?subject=${emailSubject}`}>
          <Button className="w-full h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold gap-2 text-sm">
            <Mail className="w-4 h-4" /> Email
          </Button>
        </a>
      </div>

      <p className="text-center text-[11px] text-emerald-700 font-semibold py-3 bg-emerald-50/70 border-t border-emerald-100">
        ✅ 5% de descuento incluido por pago con transferencia
      </p>
    </div>
  );
}