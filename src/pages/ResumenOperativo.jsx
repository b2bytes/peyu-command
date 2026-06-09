import { CheckCircle2, AlertTriangle, Zap, Truck, Package, CreditCard, Bug, Sparkles, TrendingUp, Calendar } from 'lucide-react';

/**
 * ResumenOperativo — Dashboard de cambios, bugs fixes y estado del sistema.
 * Resumen ejecutivo de lo desarrollado hoy + estado operativo.
 */
export default function ResumenOperativo() {
  const fechaHoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-bold mb-3 text-blue-700">
                <Calendar className="w-3.5 h-3.5" /> {fechaHoy}
              </div>
              <h1 className="text-3xl sm:text-4xl font-poppins font-black text-slate-900">Resumen Operativo PEYU</h1>
              <p className="text-slate-600 mt-2">Cambios, mejoras y estado del sistema de despacho</p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-sm font-bold px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700">
              <CheckCircle2 className="w-4 h-4" /> Sistema operativo
            </div>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* BUGS FIXES */}
          <section className="lg:col-span-1 bg-white rounded-2xl border border-red-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 px-5 py-3 flex items-center gap-2 text-white font-bold">
              <Bug className="w-5 h-5" /> Bugs Corregidos
            </div>
            <div className="p-5 space-y-3">
              <div className="border-l-4 border-red-400 bg-red-50 rounded p-3">
                <p className="text-xs font-bold text-red-900 uppercase tracking-wide">Etiqueta BlueExpress</p>
                <p className="text-sm text-red-800 mt-1">✅ Check de pago ahora reconoce transferencias confirmadas (usa getPagoStatus en vez de payment_status directo)</p>
              </div>
              <div className="border-l-4 border-red-400 bg-red-50 rounded p-3">
                <p className="text-xs font-bold text-red-900 uppercase tracking-wide">Retiro en tienda</p>
                <p className="text-sm text-red-800 mt-1">✅ Pedidos de retiro ya no requieren dirección de envío para habilitar despacho</p>
              </div>
              <div className="border-l-4 border-red-400 bg-red-50 rounded p-3">
                <p className="text-xs font-bold text-red-900 uppercase tracking-wide">Tarifas Atacama</p>
                <p className="text-sm text-red-800 mt-1">✅ Tramos 5kg+ sin datos aplican +15% acumulado en vez de precio mínimo</p>
              </div>
            </div>
          </section>

          {/* MEJORAS */}
          <section className="lg:col-span-1 bg-white rounded-2xl border border-purple-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-purple-500 to-violet-500 px-5 py-3 flex items-center gap-2 text-white font-bold">
              <Sparkles className="w-5 h-5" /> Mejoras Implementadas
            </div>
            <div className="p-5 space-y-3">
              <div className="border-l-4 border-purple-400 bg-purple-50 rounded p-3">
                <p className="text-xs font-bold text-purple-900 uppercase tracking-wide">Lead Time Estimado</p>
                <p className="text-sm text-purple-800 mt-1">Calcula automáticamente por región cuando la tabla trae 0 (RM: 1d · Sur: 2-3d · Extremos: 4-5d)</p>
              </div>
              <div className="border-l-4 border-purple-400 bg-purple-50 rounded p-3">
                <p className="text-xs font-bold text-purple-900 uppercase tracking-wide">ShippingSelector</p>
                <p className="text-sm text-purple-800 mt-1">Muestra días hábiles reales en subtítulo de EXPRESS según la comuna</p>
              </div>
              <div className="border-l-4 border-purple-400 bg-purple-50 rounded p-3">
                <p className="text-xs font-bold text-purple-900 uppercase tracking-wide">Checkout</p>
                <p className="text-sm text-purple-800 mt-1">Validación de dirección saltada para retiro en tienda</p>
              </div>
            </div>
          </section>

          {/* ESTADO DEL SISTEMA */}
          <section className="lg:col-span-1 bg-white rounded-2xl border border-green-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-3 flex items-center gap-2 text-white font-bold">
              <TrendingUp className="w-5 h-5" /> Estado del Sistema
            </div>
            <div className="p-5 space-y-2.5">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm font-semibold text-slate-700">BlueExpress API</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> Operativo
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm font-semibold text-slate-700">Tarifas (346 comunas)</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> Cargadas
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm font-semibold text-slate-700">Checkout v2</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> Completo
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm font-semibold text-slate-700">Retiro en tienda</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> Activo
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm font-semibold text-slate-700">Emails (B2C/B2B)</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">
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
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" /> CheckoutNuevo
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Valida dirección SOLO si no es retiro en tienda</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Cotiza envío en tiempo real (ShippingSelector)</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Guarda courier/ciudad correctos: "Retiro en Tienda" o "BlueExpress"</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Integración MercadoPago + webhook onNewPedidoWeb</span>
                  </li>
                </ul>
              </div>

              {/* ProcesarPedidos */}
              <div>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" /> ProcesarPedidos
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Kanban: Nuevo → Confirmado → En Producción → Listo → Despachado</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Tabs de pago: pending_mp · pending_transfer · paid · refunded</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>PedidoDetailDrawer con BluexPanel integrado (genera etiqueta)</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Batch sync y refresh manual de tracking</span>
                  </li>
                </ul>
              </div>

              {/* Centro Logístico */}
              <div>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-cyan-600" /> CentroLogistico
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Dashboard Bluex: lista envíos, KPIs, filtros y búsqueda</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Refresh manual + CRON cada 6h actualiza tracking</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Panel de secuencias IA por ciudad (urbano/extremo/rural/alto-valor)</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Análisis IA de OTIF, atrasos y excepciones</span>
                  </li>
                </ul>
              </div>

              {/* Despacho Rápido */}
              <div>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" /> DespachoRapido
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Flujo rápido: selecciona pedido → genera etiqueta → imprime</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Búsqueda por número de pedido / tracking / cliente</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Embed de etiqueta PDF + botón imprimir directamente</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Sincronización con ProcesarPedidos y CentroLogístico</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* FUNCIONES BACKEND */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 sm:px-6 sm:py-4 flex items-center gap-2 text-white font-bold">
            <Sparkles className="w-5 h-5" /> Backend Functions · Flujo de Despacho
          </div>
          <div className="p-5 sm:p-6">
            <div className="space-y-4">
              <div className="border-l-4 border-indigo-400 pl-4">
                <p className="font-bold text-slate-900 text-sm">bluexCreateShipment</p>
                <p className="text-xs text-slate-600 mt-1">Genera OT Bluex automática o registra manual. Crea entidad Envio + dispara secuencias IA + webhook tracking</p>
              </div>
              <div className="border-l-4 border-indigo-400 pl-4">
                <p className="font-bold text-slate-900 text-sm">bluexTrackingPollerCRON</p>
                <p className="text-xs text-slate-600 mt-1">Corre cada 6h. Sincroniza tracking desde API Bluex, actualiza estados, envía notificaciones según secuencia por ciudad</p>
              </div>
              <div className="border-l-4 border-indigo-400 pl-4">
                <p className="font-bold text-slate-900 text-sm">bluexAnalyzeShipments</p>
                <p className="text-xs text-slate-600 mt-1">Análisis IA: OTIF, comunas problemáticas, atrasos, excepciones. Recomendaciones operativas</p>
              </div>
              <div className="border-l-4 border-indigo-400 pl-4">
                <p className="font-bold text-slate-900 text-sm">onNewPedidoWeb (entity automation)</p>
                <p className="text-xs text-slate-600 mt-1">Trigger: cuando se crea pedido. Envía email confirmación + captura lead + crea carrito abandonado tracker</p>
              </div>
              <div className="border-l-4 border-indigo-400 pl-4">
                <p className="font-bold text-slate-900 text-sm">onPedidoWebStatusChange (entity automation)</p>
                <p className="text-xs text-slate-600 mt-1">Trigger: cambio de estado. Envía email según cambio + genera etiqueta si pasa a "Listo para Despacho"</p>
              </div>
              <div className="border-l-4 border-indigo-400 pl-4">
                <p className="font-bold text-slate-900 text-sm">updateShippingStatus</p>
                <p className="text-xs text-slate-600 mt-1">API para PedidoDetailDrawer: actualiza estado + courier + tracking + envía notificación al cliente</p>
              </div>
              <div className="border-l-4 border-indigo-400 pl-4">
                <p className="font-bold text-slate-900 text-sm">importBluexTarifas</p>
                <p className="text-xs text-slate-600 mt-1">Sincroniza tarifas BlueExpress (346 comunas) con recargo automático para tramos sin datos</p>
              </div>
            </div>
          </div>
        </section>

        {/* FLUJO DESPACHO VISUAL */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 sm:px-6 sm:py-4 flex items-center gap-2 text-white font-bold">
            <CheckCircle2 className="w-5 h-5" /> Flujo de Despacho Completo
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 text-sm text-slate-700">
              <span className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 font-bold text-blue-900">1. Checkout</span>
              <span className="hidden md:inline text-slate-300">→</span>
              <span className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 font-bold text-amber-900">2. MP Webhook</span>
              <span className="hidden md:inline text-slate-300">→</span>
              <span className="px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 font-bold text-purple-900">3. onNewPedidoWeb</span>
              <span className="hidden md:inline text-slate-300">→</span>
              <span className="px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 font-bold text-indigo-900">4. ProcesarPedidos</span>
              <span className="hidden md:inline text-slate-300">→</span>
              <span className="px-3 py-2 rounded-lg bg-cyan-50 border border-cyan-200 font-bold text-cyan-900">5. Bluex Despacho</span>
              <span className="hidden md:inline text-slate-300">→</span>
              <span className="px-3 py-2 rounded-lg bg-green-50 border border-green-200 font-bold text-green-900">6. Tracking</span>
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-700">
              <p><strong>Paso 1:</strong> Cliente paga en CheckoutNuevo (MercadoPago, Transferencia o Retiro en tienda). Se crea PedidoWeb con estado="Nuevo"</p>
              <p><strong>Paso 2:</strong> MP webhook confirma pago → actualiza payment_status="paid" → estado="Confirmado"</p>
              <p><strong>Paso 3:</strong> onNewPedidoWeb dispara: email confirmación + crea CarritoAbandonado tracker + sincroniza cliente</p>
              <p><strong>Paso 4:</strong> Admin abre ProcesarPedidos → arrastran pedido a "Listo para Despacho"</p>
              <p><strong>Paso 5:</strong> onPedidoWebStatusChange genera etiqueta Bluex automática OR admin abre PedidoDetailDrawer y genera manual</p>
              <p><strong>Paso 6:</strong> bluexTrackingPollerCRON cada 6h: sincroniza tracking, envía notificaciones (secuencias por ciudad), dispara emails post-entrega</p>
            </div>
          </div>
        </section>

        {/* PRÓXIMOS PASOS */}
        <section className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 sm:px-6 sm:py-4 flex items-center gap-2 text-white font-bold">
            <AlertTriangle className="w-5 h-5" /> Próximas Mejoras (Backlog)
          </div>
          <div className="p-5 sm:p-6 space-y-3">
            <div className="flex gap-3 text-sm text-slate-700">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex-shrink-0">TODO</span>
              <span>Auditar tarifas regionales Atacama (DNI, Copiapó) contra factura Bluex real</span>
            </div>
            <div className="flex gap-3 text-sm text-slate-700">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex-shrink-0">TODO</span>
              <span>Refrescar imagen_url de productos (limpiar logos PEYU viejos, usar IA para texturas material)</span>
            </div>
            <div className="flex gap-3 text-sm text-slate-700">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex-shrink-0">TODO</span>
              <span>Finalizar B2B color-mapping taxonomy (Excel de Bluex tiene ambigüedades en algunas regiones)</span>
            </div>
            <div className="flex gap-3 text-sm text-slate-700">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex-shrink-0">NOTA</span>
              <span>PedidoDetailDrawer se está acercando a 520 líneas — considerar split en subcomponentes más adelante</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}