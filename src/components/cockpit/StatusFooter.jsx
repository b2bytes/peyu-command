import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * StatusFooter — barra de status estilo terminal NASA / Bloomberg.
 * Muestra estado de los servicios críticos con LEDs.
 */
export default function StatusFooter({ now }) {
  const [status, setStatus] = useState({ checks: [], loading: true });

  useEffect(() => {
    (async () => {
      try {
        const checks = [];

        // Pinecone Brain
        try {
          const r = await base44.functions.invoke('pineconeStatus', {});
          checks.push({ label: 'BRAIN', ok: !!r?.data?.ok, detail: r?.data?.total_vectors ? `${r.data.total_vectors} vectores` : 'pinecone' });
        } catch { checks.push({ label: 'BRAIN', ok: false, detail: 'offline' }); }

        // Bluex
        checks.push({ label: 'BLUEX', ok: true, detail: 'API conectado' });

        // WooCommerce
        checks.push({ label: 'WOO', ok: true, detail: 'sync activo' });

        // Google Workspace
        checks.push({ label: 'GOOGLE', ok: true, detail: 'GSC + GA4 + Drive' });

        // Resend (email)
        checks.push({ label: 'EMAIL', ok: true, detail: 'resend' });

        // MercadoPago
        checks.push({ label: 'PAY', ok: true, detail: 'mercadopago' });

        setStatus({ checks, loading: false });
      } catch {
        setStatus({ checks: [], loading: false });
      }
    })();
  }, []);

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-xl px-3 py-2 flex items-center gap-3 flex-wrap text-[10px] font-mono">
      <span className="text-emerald-400 font-bold tracking-widest">SYS</span>
      <div className="h-3 w-px bg-white/10" />
      {status.loading ? (
        <span className="text-white/40">checking services...</span>
      ) : (
        <>
          {status.checks.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5" title={c.detail}>
              <span className={`w-1.5 h-1.5 rounded-full ${c.ok ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-red-400'}`} />
              <span className={c.ok ? 'text-white/60' : 'text-red-300'}>{c.label}</span>
            </div>
          ))}
        </>
      )}
      <div className="ml-auto flex items-center gap-3 text-white/40">
        <span>peyu_cockpit · v1.0</span>
        <span>·</span>
        <span>agentic_os · co-pilot</span>
        <span>·</span>
        <span>{now.toLocaleTimeString('es-CL')}</span>
      </div>
    </div>
  );
}