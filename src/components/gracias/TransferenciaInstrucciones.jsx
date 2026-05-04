import { useState } from 'react';
import { Copy, Check, Building2, AlertCircle, Mail, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Bloque de instrucciones de pago por transferencia para la página /gracias.
 * Diseñado para destacar sobre el fondo oscuro/teal de la página: card blanco
 * editorial con monto destacado, datos copiables al click, pasos numerados y
 * CTAs directos para enviar comprobante (WhatsApp/email).
 *
 * Solo se renderiza cuando ?pago=Transferencia en la URL.
 */

const DATOS = [
  { label: 'Titular',     value: 'Peyu Chile SpA',  type: 'text' },
  { label: 'RUT',         value: '77.069.974-6',    type: 'mono' },
  { label: 'Banco',       value: 'Banco Santander', type: 'text' },
  { label: 'Tipo cuenta', value: 'Cuenta Corriente', type: 'text' },
  { label: 'N° de cuenta', value: '94151872',        type: 'hero' },
  { label: 'Email',       value: 'ventas@peyuchile.cl', type: 'text' },
];

function CopyRow({ label, value, type }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Hero row — el N° de cuenta destaca con tipografía grande verde
  if (type === 'hero') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className="w-full flex items-center justify-between gap-3 px-5 py-5 bg-gradient-to-br from-emerald-50 to-teal-50/60 hover:from-emerald-100 hover:to-teal-100/60 transition-all text-left group border-y-2 border-emerald-200/60"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 mb-1">{label}</p>
          <p className="font-mono tabular-nums text-2xl sm:text-3xl font-extrabold text-emerald-800 leading-none tracking-wide">
            {value}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
          copied ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-200 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600'
        }`}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="w-full flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left group"
    >
      <span className="text-xs text-gray-500 font-medium flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`truncate ${
          type === 'mono' ? 'font-mono tabular-nums text-sm font-bold text-gray-900' : 'text-sm font-semibold text-gray-900'
        }`}>
          {value}
        </span>
        {copied
          ? <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          : <Copy className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
        }
      </div>
    </button>
  );
}

export default function TransferenciaInstrucciones({ numero, total }) {
  const totalFmt = total ? `$${total.toLocaleString('es-CL')}` : '';
  const waMsg = encodeURIComponent(
    `Hola PEYU 🐢, adjunto comprobante de transferencia del pedido ${numero} por ${totalFmt}.`
  );
  const emailSubject = encodeURIComponent(`Comprobante transferencia · ${numero}`);

  return (
    <div className="bg-white rounded-[28px] overflow-hidden shadow-2xl shadow-emerald-900/30 ring-1 ring-emerald-400/30">
      {/* Header — monto destacado, look editorial dark */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-7 sm:p-9 text-white overflow-hidden">
        {/* Decoración sutil */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-emerald-400/40">
              <Building2 className="w-4.5 h-4.5 text-emerald-300" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300">Transferencia bancaria</p>
          </div>

          <p className="text-xs text-white/50 mb-2 font-medium">Monto a transferir</p>
          <p className="font-poppins text-4xl sm:text-5xl font-black tracking-tight tabular-nums leading-none">
            {totalFmt}
          </p>
          <p className="text-xs text-emerald-300/80 mt-3 font-mono">Pedido {numero}</p>
        </div>
      </div>

      {/* Sección datos bancarios */}
      <div>
        <div className="px-5 pt-5 pb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Datos para transferir</p>
          <p className="text-xs text-gray-500 mt-1">Toca cualquier campo para copiarlo</p>
        </div>

        <div className="divide-y divide-gray-100">
          {DATOS.map((d) => <CopyRow key={d.label} {...d} />)}
        </div>
      </div>

      {/* Pasos */}
      <div className="px-5 sm:px-6 py-6 bg-gradient-to-b from-amber-50/40 to-white border-t border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">Tres pasos y listo</p>
        </div>

        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <p className="text-sm text-gray-700 leading-relaxed pt-0.5">
              Transfiere <strong className="text-gray-900">{totalFmt}</strong> a la cuenta de arriba.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <p className="text-sm text-gray-700 leading-relaxed pt-0.5">
              En el detalle de la transferencia, indica:{' '}
              <strong className="font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md text-xs whitespace-nowrap">{numero}</strong>
            </p>
          </li>
          <li className="flex gap-3">
            <span className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <p className="text-sm text-gray-700 leading-relaxed pt-0.5">
              Envíanos el comprobante. Apenas lo validemos, partimos producción 🐢.
            </p>
          </li>
        </ol>
      </div>

      {/* CTAs envío comprobante */}
      <div className="px-5 sm:px-6 py-5 bg-white border-t border-gray-100 grid grid-cols-2 gap-2.5">
        <a href={`https://wa.me/56935040242?text=${waMsg}`} target="_blank" rel="noreferrer">
          <Button className="w-full h-12 rounded-2xl bg-[#25D366] hover:bg-[#1fb858] text-white font-bold gap-2 text-sm shadow-md">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </Button>
        </a>
        <a href={`mailto:ventas@peyuchile.cl?subject=${emailSubject}`}>
          <Button className="w-full h-12 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold gap-2 text-sm shadow-md">
            <Mail className="w-4 h-4" /> Email
          </Button>
        </a>
      </div>

      {/* Footer descuento */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-t border-emerald-100/80 text-center">
        <p className="text-xs text-emerald-800 font-semibold flex items-center justify-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          5% de descuento ya aplicado por pago con transferencia
        </p>
      </div>
    </div>
  );
}