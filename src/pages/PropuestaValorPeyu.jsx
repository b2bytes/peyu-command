// ============================================================================
// PropuestaValorPeyu · Página pública compartible (sin login) para PEYU Chile.
// Diseñada como un viaje pedagógico profesor→alumno que:
//   1. Reconoce el cobro inicial bajo ($250K) y los $750K ya pagados.
//   2. Muestra la línea de tiempo del proyecto.
//   3. Compara cada módulo PEYU con su equivalente del mercado chileno/LATAM.
//   4. Suma el costo real si lo armaran con SaaS sueltos.
//   5. Transparenta el costo operativo de PEYU.
//   6. Proyecta ROI desde mes 3 con Google Ads.
//   7. Propone 3 planes de continuidad.
// ============================================================================
import { motion } from 'framer-motion';
import {
  Heart, Calendar, Layers, Calculator, Cpu, TrendingUp, Handshake,
  ShoppingBag, Users, Sparkles, Search, Truck, Brain, Code, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CONTEXT, ECONOMIA, TIMELINE, MODULOS_COMPARATIVA, TOTAL_MERCADO_CLP,
  COSTOS_OPERATIVOS, TOTAL_OPERATIVO_CLP, PLANES_PROPUESTOS, fmtCLP,
} from '@/lib/peyu-value-journey';
import JourneyChapter from '@/components/value-journey/JourneyChapter';
import ModuleCompareCard from '@/components/value-journey/ModuleCompareCard';
import TimelineMonth from '@/components/value-journey/TimelineMonth';
import ROITable from '@/components/value-journey/ROITable';
import PlanCard from '@/components/value-journey/PlanCard';
import SetupBreakdownPanel from '@/components/value-journey/SetupBreakdownPanel';

const CATEGORY_ICONS = {
  ShoppingBag, Users, Sparkles, Search, Truck, Brain, Code,
};

export default function PropuestaValorPeyu() {
  return (
    <div
      data-liquid-mode="night"
      className="min-h-screen"
      style={{ backgroundColor: '#020617', color: '#F1F5F9' }}
    >
      {/* ═══ HERO ═══ */}
      <section className="relative px-4 md:px-8 py-16 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-950/40 via-slate-950 to-violet-950/30 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/15 border border-teal-400/30 mb-6"
          >
            <Heart className="w-3.5 h-3.5 text-teal-300" />
            <span className="text-[11px] uppercase tracking-wider font-bold font-jakarta text-teal-200">
              Una conversación honesta con {CONTEXT.cliente}
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-fraunces text-4xl md:text-7xl font-medium leading-[0.95] tracking-tight text-slate-50"
          >
            Hablemos del valor real
            <br />
            <span className="font-fraunces italic text-teal-300">de lo que construimos juntos.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 md:mt-8 text-lg md:text-xl text-slate-400 font-inter leading-relaxed max-w-2xl mx-auto"
          >
            En 8 capítulos, sin atajos. Mostramos qué se construyó, cuánto vale en el mercado,
            cuánto costó realmente el setup inicial y cómo PEYU puede <strong className="text-teal-300">quedarse
            con la plataforma en propiedad</strong> pagándola en cuotas mientras la usa.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold font-jakarta px-8 h-12 gap-2"
              onClick={() => document.getElementById('cap-1')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Empezar el viaje <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
          <p className="mt-6 text-[12px] text-slate-500 font-inter">
            Tiempo de lectura: ~8 minutos · Última actualización: {CONTEXT.fecha_propuesta}
          </p>
        </div>
      </section>

      {/* ═══ CAPÍTULO 1 — Reconocimiento honesto ═══ */}
      <div id="cap-1">
        <JourneyChapter
          num="1"
          kicker="Punto de partida"
          title="Cobramos mal al principio. Punto."
          subtitle="Acordamos $250.000/mes y ustedes pagaron $750.000 por adelantado, cubriendo 3 meses. Llevamos 2 meses desde ese pago y todavía queda 1 mes cubierto. En estos 2 meses construimos TODA la plataforma con la que están conversando ahora mismo. Esta propuesta existe para definir juntos qué pasa en el mes 4 en adelante — porque el valor real de lo que tienen en sus manos no se sostiene a $250K/mes."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <KPICard
              label="Acuerdo inicial"
              value={fmtCLP(CONTEXT.cobro_inicial_mensual_clp)}
              sub="/ mes · facturado"
              tone="slate"
            />
            <KPICard
              label="Pagado por PEYU"
              value={fmtCLP(CONTEXT.pagado_hasta_ahora_clp)}
              sub={`${CONTEXT.meses_pagados} meses por adelantado`}
              tone="emerald"
            />
            <KPICard
              label="Tiempo transcurrido"
              value={`${CONTEXT.meses_transcurridos} meses`}
              sub={`Queda ${CONTEXT.meses_restantes_pagados} mes cubierto`}
              tone="amber"
            />
            <KPICard
              label="Valor del mercado"
              value={fmtCLP(TOTAL_MERCADO_CLP)}
              sub="/ mes equivalente en SaaS"
              tone="teal"
              highlight
            />
          </div>
          <div className="mt-8 bg-amber-950/30 border border-amber-500/30 rounded-2xl p-5 md:p-6">
            <p className="text-amber-100 font-inter text-[14px] md:text-base leading-relaxed">
              <strong className="font-jakarta">La verdad sin vueltas:</strong> los $250K/mes que cobramos
              al inicio no alcanzaron para cubrir lo que estábamos construyendo. Para terminar el setup
              inicial nos pasamos del presupuesto — y por eso necesitamos <strong>recotizar honestamente</strong> antes
              de seguir. Los $750K que pagaron <strong>no se pierden</strong>: se acreditan completos al setup
              inicial de la plataforma. Lo que proponemos abajo es un acuerdo justo que les dé la
              plataforma <strong>en propiedad</strong> pagando en cuotas, y desde ahí encender las campañas.
            </p>
          </div>
        </JourneyChapter>
      </div>

      {/* ═══ CAPÍTULO 2 — Línea de tiempo ═══ */}
      <JourneyChapter
        num="2"
        kicker="2 meses de construcción"
        title="Lo que construimos con los $750K que pagaron."
        subtitle="No es una sola página web. En 2 meses levantamos una plataforma operativa completa: tienda B2C, panel B2B, CRM, 6 agentes IA, logística Bluex y SEO técnico con campañas listas. Los 3 meses pagados están todos cubiertos — todavía queda 1 mes más por delante."
      >
        <div className="mt-6">
          {TIMELINE.map((entry, i) => (
            <TimelineMonth key={entry.mes} entry={entry} index={i} />
          ))}
        </div>
      </JourneyChapter>

      {/* ═══ CAPÍTULO 3 — Stack desarmado ═══ */}
      <JourneyChapter
        num="3"
        kicker="Stack desarmado"
        title="Cada pieza, su equivalente en el mercado."
        subtitle="Si tuvieran que armar este mismo sistema con SaaS conocidos (Shopify, HubSpot, Klaviyo, Semrush, Intercom…), esto es lo que pagarían al mes. Precios públicos, plan equivalente al uso real de PEYU."
      >
        <div className="space-y-10">
          {MODULOS_COMPARATIVA.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.icon] || Layers;
            const subtotal = cat.items.reduce((s, i) => s + i.precio_mercado_clp, 0);
            return (
              <div key={cat.categoria}>
                <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-${cat.color}-500/15 border border-${cat.color}-400/30 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${cat.color}-300`} />
                    </div>
                    <h3 className="font-jakarta font-extrabold text-slate-50 text-lg md:text-xl">
                      {cat.categoria}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-jakarta">
                      Subtotal categoría
                    </p>
                    <p className={`font-jakarta font-extrabold text-${cat.color}-300 text-xl`}>
                      {fmtCLP(subtotal)}<span className="text-[11px] font-medium text-slate-500 ml-1">/mes</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cat.items.map((item) => (
                    <ModuleCompareCard key={item.modulo} item={item} color={cat.color} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Suma final */}
        <div className="mt-12 bg-gradient-to-br from-teal-950/60 via-slate-900 to-cyan-950/40 border-2 border-teal-400/40 rounded-3xl p-6 md:p-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-teal-300 font-jakarta mb-3">
            Suma total si lo armaran con SaaS sueltos
          </p>
          <p className="font-fraunces text-5xl md:text-7xl font-medium text-slate-50 tracking-tight leading-none">
            {fmtCLP(TOTAL_MERCADO_CLP)}
          </p>
          <p className="text-slate-400 font-inter mt-3 text-sm md:text-base">
            CLP / mes · sumando los <strong className="text-slate-50">{MODULOS_COMPARATIVA.reduce((s, c) => s + c.items.length, 0)} módulos</strong> que hoy tienen integrados en una sola plataforma
          </p>
        </div>
      </JourneyChapter>

      {/* ═══ CAPÍTULO 4 — Costo real operativo ═══ */}
      <JourneyChapter
        num="4"
        kicker="Transparencia total"
        title="Lo que realmente cuesta tener PEYU prendido."
        subtitle="No queremos esconder nada. Estos son los costos directos mensuales que pagamos para que su plataforma funcione 24/7. Incluye LLMs, infra, integraciones y mantención humana."
      >
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-800">
            {COSTOS_OPERATIVOS.map((c) => (
              <div key={c.item} className="px-4 md:px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-jakarta font-bold text-slate-50 text-[14px] md:text-[15px]">{c.item}</p>
                  <p className="text-[12px] text-slate-400 font-inter mt-0.5">{c.detalle}</p>
                </div>
                <p className="font-jakarta font-extrabold text-slate-200 font-mono text-[14px] md:text-base whitespace-nowrap">
                  {fmtCLP(c.costo_clp)}
                </p>
              </div>
            ))}
            <div className="px-4 md:px-6 py-5 bg-slate-950/60 flex items-center justify-between gap-4">
              <p className="font-jakarta font-extrabold text-slate-50 text-base md:text-lg">
                Costo operativo real
              </p>
              <p className="font-jakarta font-extrabold text-teal-300 text-xl md:text-2xl whitespace-nowrap">
                {fmtCLP(TOTAL_OPERATIVO_CLP)}<span className="text-[11px] font-medium text-slate-500 ml-1">/mes</span>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid md:grid-cols-2 gap-3">
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-4 md:p-5">
            <p className="text-[11px] uppercase tracking-wider font-bold text-rose-300 font-jakarta mb-2">
              Brecha mensual real
            </p>
            <p className="font-jakarta font-extrabold text-2xl md:text-3xl text-rose-200">
              {fmtCLP(TOTAL_OPERATIVO_CLP - CONTEXT.cobro_inicial_mensual_clp)}
            </p>
            <p className="text-[12px] text-rose-200/80 font-inter mt-1">
              Lo que perdemos cada mes facturando $250K.
            </p>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 md:p-5">
            <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-300 font-jakarta mb-2">
              Ahorro vs. armarlo con SaaS
            </p>
            <p className="font-jakarta font-extrabold text-2xl md:text-3xl text-emerald-200">
              {fmtCLP(TOTAL_MERCADO_CLP - TOTAL_OPERATIVO_CLP)}
            </p>
            <p className="text-[12px] text-emerald-200/80 font-inter mt-1">
              Lo que PEYU se ahorra al mes con nuestro modelo integrado.
            </p>
          </div>
        </div>
      </JourneyChapter>

      {/* ═══ CAPÍTULO 5 — ROI proyección ═══ */}
      <JourneyChapter
        num="5"
        kicker="Del mes 4 en adelante"
        title="Cómo esta plataforma empieza a pagarse sola."
        subtitle="Con Google Ads gestionado por agentes IA + indexación masiva + automatizaciones, la proyección conservadora muestra ROI positivo a partir del mes 4. Estos son los números."
      >
        <ROITable />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          <InsightCard
            icon={TrendingUp}
            title="GSC ya rinde"
            metric="237 clicks · 3.328 imp · CTR 7.12%"
            description="Últimos 28 días, sin Ads. Posición promedio 8.7."
            tone="emerald"
          />
          <InsightCard
            icon={Search}
            title="107 URLs indexadas"
            metric="Bing · Yandex · Seznam"
            description="Blast IndexNow completo. Sitemap registrado en GSC."
            tone="cyan"
          />
          <InsightCard
            icon={Sparkles}
            title="100 productos optimizados"
            metric="9 keywords prioritarias"
            description="Meta tags IA aplicados al 100% del catálogo activo."
            tone="violet"
          />
        </div>
      </JourneyChapter>

      {/* ═══ CAPÍTULO 6 — Modelo económico Setup + Mantenimiento ═══ */}
      <JourneyChapter
        num="6"
        kicker="El nuevo acuerdo"
        title="Setup + mantenimiento. Y la plataforma queda suya."
        subtitle="Nosotros adelantamos el costo de construcción. PEYU lo paga en cuotas mensuales que se suman al mantenimiento. Cuando se termina de pagar, la plataforma es 100% propiedad de PEYU."
      >
        <SetupBreakdownPanel />
      </JourneyChapter>

      {/* ═══ CAPÍTULO 7 — Tres caminos para elegir ═══ */}
      <JourneyChapter
        num="7"
        kicker="Tres caminos"
        title="Elijan el que les haga más sentido."
        subtitle="No vamos a imponerles nada. Acá están las tres opciones con sus ventajas y costos. El que nosotros recomendamos está marcado."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {PLANES_PROPUESTOS.map((plan) => (
            <PlanCard key={plan.nombre} plan={plan} />
          ))}
        </div>
        <p className="mt-6 text-center text-[12px] text-slate-500 font-inter italic">
          Todos los planes son sin permanencia. Pueden cambiar de plan con aviso de 30 días.
        </p>
      </JourneyChapter>

      {/* ═══ CAPÍTULO 8 — Cierre ═══ */}
      <JourneyChapter
        num="8"
        kicker="El cierre"
        title="Construimos un Ferrari. Falta encenderlo."
        subtitle="La plataforma está lista. SEO indexado, agentes corriendo, logística conectada, campañas listas para lanzar. Lo único que falta es el acuerdo justo entre los dos para empezar a apretar el acelerador y que esto rinda en serio."
      >
        <div className="bg-gradient-to-br from-teal-950/60 via-slate-900 to-cyan-950/40 border border-teal-400/30 rounded-3xl p-6 md:p-10">
          <Handshake className="w-10 h-10 text-teal-300 mb-4" />
          <h3 className="font-fraunces text-2xl md:text-3xl font-medium text-slate-50 tracking-tight mb-3">
            Cerremos el acuerdo y encendemos el motor esta semana.
          </h3>
          <p className="text-slate-300 font-inter text-base md:text-lg leading-relaxed mb-6">
            Lo cobramos mal al inicio. Lo reconocemos. Pero lo que está construido es real, está
            corriendo, y vale lo que decimos que vale. Con el acuerdo correcto, desde el mes que
            viene encendemos Google Ads, abrimos los embudos al máximo y empieza a llegar el ROI
            que proyectamos. <strong className="text-teal-200">El Ferrari está listo — solo necesita combustible.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold font-jakarta px-8 h-12"
              asChild
            >
              <a href="https://wa.me/56912345678?text=Hola%2C%20quiero%20conversar%20sobre%20la%20propuesta%20de%20continuidad%20PEYU" target="_blank" rel="noopener noreferrer">
                Agendar reunión por WhatsApp
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-700 text-slate-200 hover:bg-slate-800 h-12"
              asChild
            >
              <a href="mailto:contacto@peyuchile.cl?subject=Propuesta%20continuidad%20PEYU">
                Responder por email
              </a>
            </Button>
          </div>
        </div>
      </JourneyChapter>

      {/* Footer */}
      <footer className="px-4 md:px-8 py-10 border-t border-slate-800 text-center">
        <p className="text-[12px] text-slate-500 font-inter">
          Documento de trabajo · {CONTEXT.fecha_propuesta} · Confidencial entre Impulsia y {CONTEXT.cliente}
        </p>
      </footer>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, tone, highlight }) {
  const TONE = {
    slate:   'border-slate-800 text-slate-300',
    emerald: 'border-emerald-500/30 text-emerald-300',
    teal:    'border-teal-500/30 text-teal-300',
  };
  return (
    <div className={`bg-slate-900 border-2 rounded-2xl p-5 md:p-6 ${TONE[tone]} ${highlight ? 'shadow-2xl shadow-teal-500/20' : ''}`}>
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-jakarta mb-2">
        {label}
      </p>
      <p className={`font-fraunces text-3xl md:text-4xl font-medium tracking-tight ${highlight ? 'text-teal-300' : 'text-slate-50'}`}>
        {value}
      </p>
      <p className="text-[12px] text-slate-400 font-inter mt-1">{sub}</p>
    </div>
  );
}

function InsightCard({ icon: Icon, title, metric, description, tone }) {
  const TONE = {
    emerald: { ring: 'border-emerald-500/30', icon: 'text-emerald-300', text: 'text-emerald-200' },
    cyan:    { ring: 'border-cyan-500/30',    icon: 'text-cyan-300',    text: 'text-cyan-200' },
    violet:  { ring: 'border-violet-500/30',  icon: 'text-violet-300',  text: 'text-violet-200' },
  };
  const t = TONE[tone] || TONE.emerald;
  return (
    <div className={`bg-slate-900 border ${t.ring} rounded-2xl p-4 md:p-5`}>
      <Icon className={`w-5 h-5 ${t.icon} mb-3`} />
      <p className="font-jakarta font-bold text-slate-50 text-[14px] mb-1">{title}</p>
      <p className={`font-mono text-[13px] ${t.text} mb-2`}>{metric}</p>
      <p className="text-[12px] text-slate-400 font-inter leading-relaxed">{description}</p>
    </div>
  );
}