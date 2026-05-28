// ============================================================================
// DeliveryMethodPicker · Selección de retiro en tienda vs despacho a domicilio.
// Cuando es despacho, pide la dirección + comuna del lugar de entrega.
// Cuando es retiro, muestra la dirección de la tienda PEYU.
// ============================================================================
import { Store, Truck, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';

const TIENDA_DIR = 'Av. Quilín 3340, Macul · Santiago (con cita previa)';

export default function DeliveryMethodPicker({ metodo, direccion, comuna, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange({ metodo: 'Despacho a domicilio', direccion, comuna })}
          className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all text-left ${
            metodo === 'Despacho a domicilio'
              ? 'border-teal-400 bg-gradient-to-br from-teal-500/25 to-cyan-500/15 shadow-lg shadow-teal-500/20'
              : 'border-white/15 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.07]'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mb-2.5 shadow-lg shadow-teal-500/30">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <p className="font-poppins font-bold text-sm text-white">Despacho</p>
          <p className="text-[10px] text-white/55 mt-1">A todo Chile · courier</p>
        </button>

        <button
          type="button"
          onClick={() => onChange({ metodo: 'Retiro en tienda', direccion, comuna })}
          className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all text-left ${
            metodo === 'Retiro en tienda'
              ? 'border-teal-400 bg-gradient-to-br from-teal-500/25 to-cyan-500/15 shadow-lg shadow-teal-500/20'
              : 'border-white/15 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.07]'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-2.5">
            <Store className="w-5 h-5 text-white/80" />
          </div>
          <p className="font-poppins font-bold text-sm text-white">Retiro en tienda</p>
          <p className="text-[10px] text-white/55 mt-1">Sin costo de envío</p>
        </button>
      </div>

      {metodo === 'Despacho a domicilio' ? (
        <div className="grid sm:grid-cols-[1fr_180px] gap-3">
          <div>
            <label className="text-[10px] font-bold text-white/55 uppercase tracking-[0.1em] mb-1.5 block">
              Dirección de despacho
            </label>
            <Input
              value={direccion || ''}
              onChange={e => onChange({ metodo, direccion: e.target.value, comuna })}
              placeholder="Calle, número, oficina/depto"
              className="h-12 rounded-xl bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus-visible:border-teal-400/60 focus-visible:bg-white/[0.10] transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-white/55 uppercase tracking-[0.1em] mb-1.5 block">
              Comuna / Ciudad
            </label>
            <Input
              value={comuna || ''}
              onChange={e => onChange({ metodo, direccion, comuna: e.target.value })}
              placeholder="Ej: Providencia"
              className="h-12 rounded-xl bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus-visible:border-teal-400/60 focus-visible:bg-white/[0.10] transition-all"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 bg-white/[0.04] border border-white/10 rounded-2xl p-4">
          <MapPin className="w-4 h-4 text-teal-300 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-white">Lugar de retiro</p>
            <p className="text-[11px] text-white/60 mt-0.5">{TIENDA_DIR}</p>
            <p className="text-[10px] text-white/40 mt-1">Te avisaremos por email cuando esté listo para retirar.</p>
          </div>
        </div>
      )}
    </div>
  );
}