import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, FileDown, AlertCircle, MessageCircle, CheckCircle2 } from 'lucide-react';
import NoIndex from '@/components/NoIndex';

// Página pública de la propuesta (/propuesta?cot=<id>). Es el link que el
// agente envía por WhatsApp: siempre abre algo — resumen de la cotización,
// descarga del PDF y botón para aprobar.
export default function PropuestaPublica() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const cot = p.get('cot');
    const numero = p.get('numero');
    if (!cot && !numero) { setError('Falta el identificador de la propuesta.'); return; }
    base44.functions.invoke('getPropuestaPublica', { cotizacion_id: cot || undefined, numero: numero || undefined })
      .then((r) => {
        if (r?.data?.ok) setData(r.data);
        else setError(r?.data?.error || 'No encontramos esa propuesta.');
      })
      .catch((e) => setError(e?.message || 'Error de conexión.'));
  }, []);

  const wsp = `https://wa.me/56935040242?text=${encodeURIComponent(`Hola PEYU, consulto por la propuesta ${data?.numero || ''}`)}`;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 ld-canvas">
        <NoIndex />
        <div className="w-full max-w-md ld-card p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto" style={{ color: 'var(--ld-highlight)' }} />
          <h1 className="ld-display text-2xl mt-4 text-ld-fg">No pudimos abrir tu propuesta</h1>
          <p className="mt-2 text-ld-fg-soft text-sm">{error}</p>
          <a href={wsp} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center gap-2 w-full ld-btn-primary py-3.5 rounded-full font-bold">
            <MessageCircle className="w-5 h-5" /> Escríbenos por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center ld-canvas">
        <NoIndex />
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--ld-action)' }} />
      </div>
    );
  }

  const clp = (n) => `$${(n || 0).toLocaleString('es-CL')}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 ld-canvas">
      <NoIndex />
      <div className="w-full max-w-lg ld-card p-7 sm:p-9">
        <p className="text-xs font-bold tracking-widest text-ld-fg-muted">PROPUESTA {data.numero}</p>
        <h1 className="ld-display text-3xl mt-2 text-ld-fg">{data.producto_nombre}</h1>
        <p className="text-sm text-ld-fg-soft mt-1">Preparada para {data.empresa || data.contacto || 'ti'}</p>

        {(data.mockup_url || data.producto_imagen) && (
          <img
            src={data.mockup_url || data.producto_imagen}
            alt={data.producto_nombre}
            className="mt-5 w-full rounded-2xl object-contain max-h-64"
            style={{ background: 'var(--ld-bg-soft)' }}
          />
        )}

        <div className="mt-6 rounded-2xl overflow-hidden" style={{ background: 'var(--ld-bg-soft)' }}>
          {[
            ['Cantidad', `${data.cantidad} unidades`],
            ['Precio unitario', clp(data.precio_unitario)],
            ['Personalización', data.personalizacion_tipo || '—'],
            ['Lead time', `${data.lead_time_dias || 0} días hábiles`],
            ['Válida hasta', data.fecha_vencimiento || '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between px-4 py-2.5 text-sm border-b border-ld-border last:border-0">
              <span className="text-ld-fg-muted">{k}</span>
              <span className="font-bold text-ld-fg">{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3.5" style={{ background: 'var(--ld-action-soft)' }}>
            <span className="font-bold text-ld-fg">Total (IVA incl.)</span>
            <span className="text-xl font-bold" style={{ color: 'var(--ld-action)' }}>{clp(data.total)}</span>
          </div>
        </div>

        {data.pdf_url ? (
          <a href={data.pdf_url} target="_blank" rel="noreferrer"
             className="mt-6 inline-flex items-center justify-center gap-2 w-full ld-btn-ghost py-3.5 rounded-full font-bold">
            <FileDown className="w-5 h-5" /> Descargar propuesta en PDF
          </a>
        ) : (
          <p className="mt-6 text-xs text-ld-fg-muted text-center">
            El PDF detallado te lo envía el equipo por correo. Este resumen es la propuesta vigente.
          </p>
        )}

        <a href={`/aprobar-propuesta?cot=${data.id}`}
           className="mt-3 inline-flex items-center justify-center gap-2 w-full ld-btn-primary py-3.5 rounded-full font-bold">
          <CheckCircle2 className="w-5 h-5" /> Aprobar propuesta
        </a>

        <a href={wsp} target="_blank" rel="noreferrer"
           className="mt-4 block text-center text-xs font-bold" style={{ color: 'var(--ld-action)' }}>
          ¿Dudas o ajustes? Escríbenos por WhatsApp
        </a>
      </div>
    </div>
  );
}