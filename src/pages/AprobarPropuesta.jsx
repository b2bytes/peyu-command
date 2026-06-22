import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Loader2, Sprout, MessageCircle, AlertCircle } from 'lucide-react';

// Página pública de aprobación de propuesta. El botón "Aprobar propuesta" del
// PDF apunta aquí (?cot=<id>). Al cargar, dispara aprobarPropuestaChat, que
// marca la cotización como Aceptada y arranca la secuencia de embudo.
export default function AprobarPropuesta() {
  const [status, setStatus] = useState('loading'); // loading | done | already | error
  const [data, setData] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cot = params.get('cot');
    const numero = params.get('numero');
    if (!cot && !numero) { setStatus('error'); setErrMsg('Falta el identificador de la propuesta.'); return; }

    base44.functions.invoke('aprobarPropuestaChat', { cotizacion_id: cot || undefined, numero: numero || undefined })
      .then((res) => {
        const d = res?.data;
        if (d?.ok) { setData(d); setStatus(d.ya_aprobada ? 'already' : 'done'); }
        else { setStatus('error'); setErrMsg(d?.error || 'No pudimos aprobar la propuesta.'); }
      })
      .catch((e) => { setStatus('error'); setErrMsg(e?.message || 'Error de conexión.'); });
  }, []);

  const wsp = `https://wa.me/56979471933?text=${encodeURIComponent(`Hola PEYU, aprobé mi propuesta${data?.numero ? ' ' + data.numero : ''}. Coordino el pago.`)}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 ld-canvas">
      <div className="w-full max-w-lg ld-card p-8 sm:p-10 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto animate-spin" style={{ color: 'var(--ld-action)' }} />
            <p className="mt-5 text-ld-fg-muted">Confirmando tu aprobación…</p>
          </>
        )}

        {(status === 'done' || status === 'already') && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                 style={{ background: 'var(--ld-action-soft)' }}>
              <Sprout className="w-8 h-8" style={{ color: 'var(--ld-action)' }} />
            </div>
            <h1 className="ld-display text-3xl mt-5 text-ld-fg">
              {status === 'already' ? 'Tu propuesta ya estaba aprobada' : '¡Tu regalo con propósito ya nace!'}
            </h1>
            <p className="mt-3 text-ld-fg-soft leading-relaxed">
              Cada producto de tu orden nace de tapitas que rescatamos del mar y de la calle. Las fundimos,
              moldeamos y grabamos tu logo. No regalas un objeto, regalas un gesto. 🌱
            </p>
            {data?.numero && (
              <p className="mt-4 text-sm text-ld-fg-muted">
                Propuesta <span className="font-bold text-ld-fg">{data.numero}</span>
                {data?.total ? <> · Total <span className="font-bold text-ld-action">${(data.total).toLocaleString('es-CL')}</span></> : null}
              </p>
            )}
            <div className="mt-6 rounded-2xl p-5 text-left text-sm leading-relaxed"
                 style={{ background: 'var(--ld-action-soft)' }}>
              <p className="font-bold text-ld-fg mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--ld-action)' }} /> Próximos pasos
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-ld-fg-soft">
                <li>Confirma el pago: <b>retiro</b> 50% ahora + 50% contra entrega, o <b>despacho</b> con abono 100%.</li>
                <li>Envíanos tu logo en alta resolución (AI/PDF/PNG 300dpi).</li>
                <li>Producción inicia 48h hábiles después del pago.</li>
              </ol>
            </div>
            <a href={wsp} target="_blank" rel="noreferrer"
               className="mt-6 inline-flex items-center justify-center gap-2 w-full ld-btn-primary py-3.5 rounded-full font-bold">
              <MessageCircle className="w-5 h-5" /> Coordinar pago por WhatsApp
            </a>
            <p className="mt-4 text-xs text-ld-fg-muted">
              También puedes responder a corporativos@peyuchile.cl
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                 style={{ background: 'var(--ld-highlight-soft)' }}>
              <AlertCircle className="w-8 h-8" style={{ color: 'var(--ld-highlight)' }} />
            </div>
            <h1 className="ld-display text-2xl mt-5 text-ld-fg">No pudimos procesar la aprobación</h1>
            <p className="mt-3 text-ld-fg-soft">{errMsg}</p>
            <a href={wsp} target="_blank" rel="noreferrer"
               className="mt-6 inline-flex items-center justify-center gap-2 w-full ld-btn-primary py-3.5 rounded-full font-bold">
              <MessageCircle className="w-5 h-5" /> Escríbenos por WhatsApp
            </a>
          </>
        )}
      </div>
    </div>
  );
}