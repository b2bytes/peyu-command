// ============================================================================
// ProposalDeliveryActions · Envío multicanal de la propuesta B2B
// ----------------------------------------------------------------------------
// Al generar la cotización, el cliente elige cómo recibirla:
//   · Email   → reenvía el correo con la propuesta (backend ya lo mandó al crear)
//   · WhatsApp→ abre wa.me con un resumen + link a la propuesta online
//   · Ambos   → dispara email y abre WhatsApp en un solo gesto
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, MessageCircle, Send, Check, Loader2 } from 'lucide-react';

const WA_NUMBER = '56935040242';

function buildWhatsAppUrl(propuesta, form) {
  const url = `${window.location.origin}/b2b/propuesta?id=${propuesta.proposal_id}`;
  const total = `$${(propuesta.total || 0).toLocaleString('es-CL')}`;
  const lines = [
    `Hola PEYU 👋 Soy ${form.contact_name || ''} de ${form.company_name || ''}.`,
    `Generé la propuesta N° ${propuesta.numero} (${total}, ${propuesta.items?.length || 0} ítems).`,
    `Quiero avanzar con la cotización. Link: ${url}`,
  ];
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export default function ProposalDeliveryActions({ propuesta, form }) {
  const [emailState, setEmailState] = useState(propuesta.email_sent ? 'sent' : 'idle');

  const sendEmail = async () => {
    if (emailState === 'sending') return false;
    setEmailState('sending');
    try {
      const res = await base44.functions.invoke('sendSelfServiceProposalEmail', {
        proposalId: propuesta.proposal_id,
        form,
      });
      const ok = !!res?.data?.success;
      setEmailState(ok ? 'sent' : 'idle');
      return ok;
    } catch {
      setEmailState('idle');
      return false;
    }
  };

  const openWhatsApp = () => {
    window.open(buildWhatsAppUrl(propuesta, form), '_blank', 'noopener');
  };

  const sendBoth = async () => {
    openWhatsApp();
    await sendEmail();
  };

  const emailLabel = {
    idle: 'Enviar a mi correo',
    sending: 'Enviando…',
    sent: 'Enviada a tu correo',
  }[emailState];

  return (
    <div className="ld-card p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400/30 to-cyan-500/30 border border-teal-400/40 flex items-center justify-center flex-shrink-0">
          <Send className="w-4 h-4 text-teal-300" />
        </div>
        <div>
          <p className="font-poppins font-bold text-white text-sm leading-none">¿Cómo quieres recibirla?</p>
          <p className="text-[11px] text-white/55 mt-1">Te enviamos tu propuesta donde prefieras.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Email */}
        <button
          onClick={sendEmail}
          disabled={emailState === 'sending' || emailState === 'sent'}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-4 border transition-all ${
            emailState === 'sent'
              ? 'border-emerald-400/50 bg-emerald-500/15'
              : 'border-white/15 bg-white/[0.05] hover:bg-white/[0.10] hover:border-white/30'
          }`}
        >
          {emailState === 'sending' ? (
            <Loader2 className="w-5 h-5 text-teal-300 animate-spin" />
          ) : emailState === 'sent' ? (
            <Check className="w-5 h-5 text-emerald-300" />
          ) : (
            <Mail className="w-5 h-5 text-teal-300" />
          )}
          <span className="text-xs font-bold text-white text-center leading-tight">{emailLabel}</span>
        </button>

        {/* WhatsApp */}
        <button
          onClick={openWhatsApp}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-4 border border-green-400/40 bg-green-500/15 hover:bg-green-500/25 transition-all"
        >
          <MessageCircle className="w-5 h-5 text-green-300" />
          <span className="text-xs font-bold text-white text-center leading-tight">Enviar a WhatsApp</span>
        </button>

        {/* Ambos */}
        <button
          onClick={sendBoth}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-4 border border-cyan-400/40 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 transition-all"
        >
          <div className="flex items-center gap-1">
            <Mail className="w-4 h-4 text-cyan-200" />
            <MessageCircle className="w-4 h-4 text-cyan-200" />
          </div>
          <span className="text-xs font-bold text-white text-center leading-tight">Enviar a ambos</span>
        </button>
      </div>
    </div>
  );
}