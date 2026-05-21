// Panel pedagógico que explica el modelo Setup + Mantenimiento.
// 1. Lo que costó construir (setup inicial total)
// 2. Lo que ya pagaron y se abona al setup
// 3. Cómo se paga en cuotas + mantenimiento
// 4. Qué pasa cuando termina (la plataforma queda de PEYU)
import { motion } from 'framer-motion';
import { Wrench, CreditCard, Wallet, Award, ArrowRight } from 'lucide-react';
import { ECONOMIA, CONTEXT, fmtCLP } from '@/lib/peyu-value-journey';

export default function SetupBreakdownPanel() {
  return (
    <div className="space-y-8">
      {/* Bloque 1: Setup inicial */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-violet-950/50 via-slate-900 to-fuchsia-950/30 border-2 border-violet-400/30 rounded-3xl p-6 md:p-10"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center flex-shrink-0">
            <Wrench className="w-6 h-6 text-violet-300" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-violet-300 font-jakarta mb-1">
              Setup inicial · One-time
            </p>
            <h3 className="font-fraunces text-2xl md:text-3xl font-medium text-slate-50 tracking-tight">
              Construir esta plataforma costó {fmtCLP(ECONOMIA.setup_inicial_clp)}
            </h3>
          </div>
        </div>

        <p className="text-slate-300 font-inter text-[14px] md:text-base leading-relaxed mb-6">
          Eso es lo que vale en el mercado armar un sistema como este desde cero: 2 meses
          de equipo dedicado, arquitectura, 40+ entidades, integraciones, agentes IA, SEO técnico
          y todo el frontend. <strong className="text-slate-50">No lo cobramos así al principio</strong>,
          y por eso quedamos cortos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Block label="Costo real" value={fmtCLP(ECONOMIA.setup_inicial_clp)} sub="Lo que costó construir" tone="slate" />
          <Block label="Descuento clientes fundadores" value={`− ${fmtCLP(ECONOMIA.setup_descuento_clp)}`} sub="33% off · solo para PEYU" tone="emerald" />
          <Block label="Setup a pagar" value={fmtCLP(ECONOMIA.setup_a_pagar_clp)} sub="Total que PEYU paga" tone="violet" highlight />
        </div>
      </motion.div>

      {/* Bloque 2: Lo ya pagado se abona */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-emerald-950/30 border border-emerald-500/30 rounded-3xl p-6 md:p-8"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-300 font-jakarta mb-1">
              Los $750K que ya pagaron
            </p>
            <h3 className="font-fraunces text-xl md:text-2xl font-medium text-slate-50 mb-3">
              No se pierden. Se acreditan completos al setup.
            </h3>
            <p className="text-emerald-100/90 font-inter text-[14px] leading-relaxed">
              {fmtCLP(ECONOMIA.setup_a_pagar_clp)} − {fmtCLP(ECONOMIA.ya_abonado_al_setup_clp)} (ya abonados) =
              <strong className="text-emerald-200 ml-1">{fmtCLP(ECONOMIA.setup_restante_clp)} restantes del setup</strong>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Bloque 3: Cómo se paga */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-teal-300 font-jakarta mb-1">
              Cómo se paga · Cuotas + mantenimiento
            </p>
            <h3 className="font-fraunces text-2xl md:text-3xl font-medium text-slate-50 tracking-tight">
              Nosotros adelantamos el setup. Ustedes lo pagan en cuotas.
            </h3>
          </div>
        </div>

        <p className="text-slate-300 font-inter text-[14px] md:text-base leading-relaxed mb-6">
          El setup se divide en <strong className="text-slate-50">{ECONOMIA.cuotas_setup} cuotas mensuales</strong> que
          se suman al mantenimiento. Mientras dura el plan, pagan una cuota mensual que cubre ambas cosas.
          Cuando se termina de pagar el setup, <strong className="text-teal-200">la plataforma queda 100% de PEYU</strong> y
          desde ese mes solo pagan el mantenimiento.
        </p>

        {/* Desglose visual */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          <Row label="Mantenimiento mensual" value={fmtCLP(ECONOMIA.mantenimiento_mensual_clp)} sub="Operación + soporte + evolución continua" />
          <Row label={`Cuota setup (${ECONOMIA.cuotas_setup} meses)`} value={fmtCLP(ECONOMIA.cuota_setup_mensual_clp)} sub={`${fmtCLP(ECONOMIA.setup_restante_clp)} ÷ ${ECONOMIA.cuotas_setup} cuotas`} />
          <div className="px-4 md:px-6 py-5 bg-gradient-to-r from-teal-950/50 to-cyan-950/30 flex items-center justify-between gap-4">
            <div>
              <p className="font-jakarta font-extrabold text-slate-50 text-base md:text-lg">
                Total mensual (primeros {ECONOMIA.cuotas_setup} meses)
              </p>
              <p className="text-[12px] text-slate-400 font-inter mt-0.5">
                Mantenimiento + cuota del setup
              </p>
            </div>
            <p className="font-fraunces font-medium text-teal-300 text-2xl md:text-3xl whitespace-nowrap">
              {fmtCLP(ECONOMIA.total_mensual_periodo_setup_clp)}
            </p>
          </div>
        </div>

        {/* Después del mes 18 */}
        <div className="mt-5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-5 md:p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-300 font-jakarta mb-1">
              Mes 19 en adelante
            </p>
            <p className="font-jakarta font-extrabold text-slate-50 text-lg mb-1">
              La plataforma queda 100% de PEYU.
            </p>
            <p className="text-emerald-100/90 font-inter text-[13px] md:text-[14px] leading-relaxed flex items-center gap-2 flex-wrap">
              <span>Solo pagan mantenimiento:</span>
              <strong className="text-emerald-200 font-jakarta font-extrabold text-lg">
                {fmtCLP(ECONOMIA.total_mensual_post_setup_clp)}/mes
              </strong>
              <ArrowRight className="w-4 h-4 text-emerald-300" />
              <span className="text-emerald-200">ahorro de {fmtCLP(ECONOMIA.cuota_setup_mensual_clp)}/mes para siempre</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Block({ label, value, sub, tone, highlight }) {
  const TONE = {
    slate:   'border-slate-700 text-slate-300',
    emerald: 'border-emerald-500/40 text-emerald-300',
    violet:  'border-violet-500/40 text-violet-300',
  };
  return (
    <div className={`bg-slate-950/60 border-2 ${TONE[tone]} rounded-2xl p-4 md:p-5 ${highlight ? 'shadow-xl shadow-violet-500/20' : ''}`}>
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-jakarta mb-2">{label}</p>
      <p className={`font-fraunces text-2xl md:text-3xl font-medium tracking-tight ${highlight ? 'text-violet-200' : 'text-slate-50'}`}>
        {value}
      </p>
      <p className="text-[11px] text-slate-400 font-inter mt-1">{sub}</p>
    </div>
  );
}

function Row({ label, value, sub }) {
  return (
    <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-800 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-jakarta font-bold text-slate-50 text-[14px] md:text-[15px]">{label}</p>
        <p className="text-[12px] text-slate-400 font-inter mt-0.5">{sub}</p>
      </div>
      <p className="font-jakarta font-extrabold text-slate-100 font-mono text-[14px] md:text-base whitespace-nowrap">
        {value}
      </p>
    </div>
  );
}