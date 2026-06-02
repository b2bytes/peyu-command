import { ShoppingBag, ArrowRight } from 'lucide-react';

/**
 * Barra inferior fija (bottom bar sticky) del cotizador B2B en MÓVIL.
 * Siempre visible mientras se arma el pedido: muestra cantidad de productos +
 * subtotal y un botón grande "Ver pedido / Cotizar" que abre el drawer.
 * Paleta turquesa/warm coherente con el resto del flujo.
 *
 * Si el carrito está vacío muestra un estado guía deshabilitado, así el usuario
 * siempre sabe dónde está su pedido.
 */
export default function MobileOrderBar({ cart, subtotalEstimado, onOpen }) {
  const totalUnidades = cart.reduce((s, c) => s + c.cantidad, 0);
  const vacio = cart.length === 0;

  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 ld-glass-strong border-t border-white/15 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.45)]"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.625rem)' }}
    >
      <div className="px-3 pt-2.5 flex items-center gap-3">
        {/* Resumen: productos + subtotal */}
        <div className="flex items-center gap-2.5 min-w-0 flex-shrink">
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400/30 to-cyan-500/30 border border-teal-400/40 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-teal-300" />
            {!vacio && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-amber-950 text-[10px] font-extrabold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-slate-900 tabular-nums">
                {cart.length}
              </span>
            )}
          </div>
          <div className="min-w-0">
            {vacio ? (
              <>
                <p className="text-[11px] text-white/55 leading-tight">Tu pedido</p>
                <p className="text-sm font-bold text-white leading-tight">Vacío</p>
              </>
            ) : (
              <>
                <p className="text-[11px] text-white/55 leading-tight tabular-nums">
                  {cart.length} prod · {totalUnidades} u.
                </p>
                <p className="text-base font-poppins font-extrabold text-white leading-tight tabular-nums">
                  ${subtotalEstimado.toLocaleString('es-CL')}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Botón grande Ver pedido / Cotizar */}
        <button
          onClick={onOpen}
          disabled={vacio}
          className="ml-auto flex-1 max-w-[58%] h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 active:from-teal-600 active:to-cyan-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/30 transition-all disabled:opacity-40 disabled:shadow-none"
        >
          {vacio ? (
            <span className="text-[13px]">Agrega productos</span>
          ) : (
            <>
              <span>Ver pedido</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}