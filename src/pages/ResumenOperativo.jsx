import { CheckCircle2, AlertTriangle, Zap, Truck, Package, CreditCard, Bug, Sparkles, TrendingUp, Calendar } from 'lucide-react';

/**
 * ResumenOperativo — Dashboard de cambios, bugs fixes y estado del sistema.
 * Resumen ejecutivo de lo desarrollado hoy + estado operativo.
 */
export default function ResumenOperativo() {
  const fechaHoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-bold mb-2.5 sm:mb-3 text-blue-700">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {fechaHoy}
              </div>
              <h1 className="text-2xl sm:text-4xl font-poppins font-black text-slate-900">Resumen Operativo</h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 sm:mt-2">Cambios, mejoras y estado del despacho</p>
            </div>
            <div className="flex sm:hidden items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700">
              <div className="w-2 h-2 rounded-full bg-green-500"></div> Operativo
            </div>
            <div className="hidden sm:flex items-center gap-3 text-sm font-bold px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700">
              <CheckCircle2 className="w-4 h-4" /> Sistema operativo
            </div>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">

          {/* BUGS FIXES */}
          <section className="bg-white rounded-2xl border border-red-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <Bug className="w-4 h-4 sm:w-5 sm:h-5" /> Bugs Corregidos
            </div>
            <div className="p-3.5 sm:p-5 space-y-2.5 sm:space-y-3">
              <div className="border-l-4 border-red-400 bg-red-50 rounded p-2.5 sm:p-3">
                <p className="text-[10px] sm:text-xs font-bold text-red-900 uppercase tracking-wide">Etiqueta BlueExpress</p>
                <p className="text-xs sm:text-sm text-red-800 mt-0.5 sm:mt-1">✅ Check de pago reconoce transferencias confirmadas</p>
              </div>
              <div className="border-l-4 border-red-400 bg-red-50 rounded p-2.5 sm:p-3">
                <p className="text-[10px] sm:text-xs font-bold text-red-900 uppercase tracking-wide">Retiro en tienda</p>
                <p className="text-xs sm:text-sm text-red-800 mt-0.5 sm:mt-1">✅ Ya no requiere dirección de envío</p>
              </div>
              <div className="border-l-4 border-red-400 bg-red-50 rounded p-2.5 sm:p-3">
                <p className="text-[10px] sm:text-xs font-bold text-red-900 uppercase tracking-wide">Tarifas Atacama</p>
                <p className="text-xs sm:text-sm text-red-800 mt-0.5 sm:mt-1">✅ +15% acumulado para tramos sin datos</p>
              </div>
            </div>
          </section>

          {/* MEJORAS */}
          <section className="bg-white rounded-2xl border border-purple-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-purple-500 to-violet-500 px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> Mejoras Implementadas
            </div>
            <div className="p-3.5 sm:p-5 space-y-2.5 sm:space-y-3">
              <div className="border-l-4 border-purple-400 bg-purple-50 rounded p-2.5 sm:p-3">
                <p className="text-[10px] sm:text-xs font-bold text-purple-900 uppercase tracking-wide">Lead Time Estimado</p>
                <p className="text-xs sm:text-sm text-purple-800 mt-0.5 sm:mt-1">Por región (RM: 1d · Sur: 2-3d · Extremos: 4-5d)</p>
              </div>
              <div className="border-l-4 border-purple-400 bg-purple-50 rounded p-2.5 sm:p-3">
                <p className="text-[10px] sm:text-xs font-bold text-purple-900 uppercase tracking-wide">ShippingSelector</p>
                <p className="text-xs sm:text-sm text-purple-800 mt-0.5 sm:mt-1">Días hábiles reales por comuna</p>
              </div>
              <div className="border-l-4 border-purple-400 bg-purple-50 rounded p-2.5 sm:p-3">
                <p className="text-[10px] sm:text-xs font-bold text-purple-900 uppercase tracking-wide">Checkout</p>
                <p className="text-xs sm:text-sm text-purple-800 mt-0.5 sm:mt-1">Salta dirección para retiro en tienda</p>
              </div>
            </div>
          </section>

          {/* ESTADO DEL SISTEMA */}
          <section className="sm:col-span-2 lg:col-span-1 bg-white rounded-2xl border border-green-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" /> Estado del Sistema
            </div>
            <div className="p-3.5 sm:p-5 space-y-2">
              <div className="flex items-center justify-between py-1.5 sm:py-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-700">BlueExpress API</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] sm:text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> Operativo
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 sm:py-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-700">Tarifas (346)</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] sm:text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> Cargadas
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 sm:py-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-700">Checkout v2</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] sm:text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> Completo
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 sm:py-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-700">Retiro tienda</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] sm:text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> Activo
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 sm:py-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-700">Emails</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] sm:text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> Routed
                </span>
              </div>
            </div>
          </section>

        </div>

        {/* FUNCIONES NUEVAS/MEJORADAS POR PÁGINA */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 sm:px-6 sm:py-4 flex items-center gap-2 text-white font-bold">
            <Truck className="w-5 h-5" /> Función Despacho · Estado y Responsabilidades
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid md:grid-cols-2 gap-6">

              {/* Checkout Nuevo */}
              <div>
                <h3 className="font-bold text-slate-900 mb-2.5 sm:mb-3 text-sm sm:text-base flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /> CheckoutNuevo
                </h3>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-700">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Valida dirección solo si es envío</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Cotiza en tiempo real</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Guarda courier correcto</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>MercadoPago + webhook</span>
                  </li>
                </ul>
              </div>

              {/* ProcesarPedidos */}
              <div>
                <h3 className="font-bold text-slate-900 mb-2.5 sm:mb-3 text-sm sm:text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /> ProcesarPedidos
                </h3>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-700">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Kanban: Nuevo → Listo → Despachado</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Tabs de pago integrados</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>BluexPanel genera etiqueta</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Sync y refresh tracking</span>
                  </li>
                </ul>
              </div>

              {/* Centro Logístico */}
              <div className="sm:col-span-2">
                <h3 className="font-bold text-slate-900 mb-2.5 sm:mb-3 text-sm sm:text-base flex items-center gap-2">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" /> Centro Logístico
                </h3>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-700">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Dashboard: lista, KPIs, filtros</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Refresh + CRON cada 6h</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Secuencias IA por ciudad</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Análisis OTIF y excepciones</span>
                  </li>
                </ul>
              </div>

              {/* Despacho Rápido */}
              <div className="sm:col-span-2">
                <h3 className="font-bold text-slate-900 mb-2.5 sm:mb-3 text-sm sm:text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" /> Despacho Rápido
                </h3>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-700">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Flujo: selecciona → genera → imprime</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Búsqueda por pedido/tracking/cliente</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Etiqueta PDF + botón imprimir</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Sincronizado con otros módulos</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* FUNCIONES BACKEND */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-2.5 sm:py-4 flex items-center gap-2 text-white font-bold text-sm sm:text-base">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> Backend Functions
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="border-l-4 border-indigo-400 pl-3 sm:pl-4">
                <p className="font-bold text-slate-900 text-xs sm:text-sm">bluexCreateShipment</p>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1">Genera OT o registra manual + webhook tracking</p>
              </div>
              <div className="border-l-4 border-indigo-400 pl-3 sm:pl-4">
                <p className="font-bold text-slate-900 text-xs sm:text-sm">bluexTrackingPollerCRON</p>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1">Cada 6h: sincroniza tracking + notificaciones</p>
              </div>
              <div className="border-l-4 border-indigo-400 pl-3 sm:pl-4">
                <p className="font-bold text-slate-900 text-xs sm:text-sm">bluexAnalyzeShipments</p>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1">IA: OTIF, atrasos, excepciones</p>
              </div>
              <div className="border-l-4 border-indigo-400 pl-3 sm:pl-4">
                <p className="font-bold text-slate-900 text-xs sm:text-sm">onNewPedidoWeb</p>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1">Trigger: email + lead + carrito abandonado</p>
              </div>
              <div className="border-l-4 border-indigo-400 pl-3 sm:pl-4">
                <p className="font-bold text-slate-900 text-xs sm:text-sm">onPedidoWebStatusChange</p>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1">Trigger: email + genera etiqueta</p>
              </div>
              <div className="border-l-4 border-indigo-400 pl-3 sm:pl-4">
                <p className="font-bold text-slate-900 text-xs sm:text-sm">updateShippingStatus</p>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1">Actualiza estado + tracking + notifica</p>
              </div>
              <div className="border-l-4 border-indigo-400 pl-3 sm:pl-4">
                <p className="font-bold text-slate-900 text-xs sm:text-sm">importBluexTarifas</p>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1">Sincroniza 346 comunas + recargos</p>
              </div>
            </div>
          </div>
        </section>

        {/* FLUJO DESPACHO VISUAL */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 sm:px-6 py-2.5 sm:py-4 flex items-center gap-2 text-white font-bold text-sm sm:text-base">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> Flujo de Despacho
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs font-bold mb-4">
              <span className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">1. Checkout</span>
              <span className="hidden sm:inline text-slate-300">→</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">2. MP</span>
              <span className="hidden sm:inline text-slate-300">→</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900">3. Crear</span>
              <span className="hidden sm:inline text-slate-300">→</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900">4. Procesar</span>
              <span className="hidden sm:inline text-slate-300">→</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-900">5. Despacho</span>
              <span className="hidden sm:inline text-slate-300">→</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-900">6. Tracking</span>
            </div>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-700">
              <p><strong>1.</strong> Cliente paga (MP/Transferencia/Retiro) → PedidoWeb creado</p>
              <p><strong>2.</strong> Webhook confirma pago → estado="Confirmado"</p>
              <p><strong>3.</strong> onNewPedidoWeb: email + lead + tracker</p>
              <p><strong>4.</strong> Admin arrastra a "Listo"</p>
              <p><strong>5.</strong> Genera etiqueta Bluex (auto o manual)</p>
              <p><strong>6.</strong> CRON 6h: tracking + notificaciones</p>
            </div>
          </div>
        </section>

        {/* PRÓXIMOS PASOS */}
        <section className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 sm:px-6 py-2.5 sm:py-4 flex items-center gap-2 text-white font-bold text-sm sm:text-base">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" /> Próximas Mejoras
          </div>
          <div className="p-4 sm:p-6 space-y-2.5 sm:space-y-3">
            <div className="flex gap-2.5 sm:gap-3 text-xs sm:text-sm text-slate-700">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex-shrink-0">TODO</span>
              <span>Auditar tarifas Atacama vs factura Bluex</span>
            </div>
            <div className="flex gap-2.5 sm:gap-3 text-xs sm:text-sm text-slate-700">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex-shrink-0">TODO</span>
              <span>Refrescar imágenes productos (limpiar logos viejos)</span>
            </div>
            <div className="flex gap-2.5 sm:gap-3 text-xs sm:text-sm text-slate-700">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex-shrink-0">TODO</span>
              <span>Finalizar color-mapping B2B</span>
            </div>
            <div className="flex gap-2.5 sm:gap-3 text-xs sm:text-sm text-slate-700">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex-shrink-0">NOTA</span>
              <span>PedidoDetailDrawer: considerar split en subcomponentes</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}