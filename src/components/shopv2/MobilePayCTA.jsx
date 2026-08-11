import { Lock, ShieldCheck } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';

// Botón de pago final destacado (solo móvil): cierra el flujo con el monto
// visible, sello de seguridad y máximo contraste para empujar la conversión.
export default function MobilePayCTA({ label, total, onClick, loading }) {
  return (
    <div className="lg:hidden pt-1">
      <button
        onClick={onClick}
        disabled={loading}
        className="w-full h-16 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg,var(--ck-action, #C0785C),var(--ck-action-dark, #A86440))',
          boxShadow: '0 12px 30px rgba(var(--ck-action-rgb, 192,120,92),.38)',
        }}
      >
        {loading ? (
          <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando…</>
        ) : (
          <><Lock className="w-5 h-5" /> {label}</>
        )}
      </button>
      {total > 0 && !loading && (
        <p className="text-center text-xs font-bold mt-2" style={{ color: 'var(--ck-fg, #2C1810)' }}>
          Total a pagar: {fmtCLP(total)}
        </p>
      )}
      <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold mt-1.5" style={{ color: 'var(--ck-fg-muted, #A08070)' }}>
        <ShieldCheck className="w-3.5 h-3.5" /> Pago protegido · no guardamos tus datos de tarjeta
      </p>
    </div>
  );
}