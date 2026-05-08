import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Sparkles, Radio } from 'lucide-react';
import PulseBar from '@/components/cockpit/PulseBar';
import AgentFleet from '@/components/cockpit/AgentFleet';
import MissionsInbox from '@/components/cockpit/MissionsInbox';
import BrainTerminal from '@/components/cockpit/BrainTerminal';
import NorthStarMetrics from '@/components/cockpit/NorthStarMetrics';
import ForesightPanel from '@/components/cockpit/ForesightPanel';
import StatusFooter from '@/components/cockpit/StatusFooter';

/**
 * Peyu Cockpit — el puente de mando único para los fundadores.
 *
 * Filosofía 2026+: el founder no opera dashboards pasivos, opera una
 * flota de agentes IA que proponen, analizan y ejecutan. Co-pilot híbrido:
 *  - Bajo riesgo → automático (responder consultas, scoring leads, mockups)
 *  - Alto riesgo → propuesta del agente + aprobación humana 1-click
 *
 * Layout: 6 zonas inspiradas en cockpits NASA + Bloomberg Terminal.
 *  1) PULSE — heartbeat empresa
 *  2) NORTH STAR — métricas del trimestre
 *  3) FLEET — flota de agentes IA como empleados sintéticos
 *  4) MISSIONS — inbox priorizado de decisiones humanas
 *  5) BRAIN TERMINAL — chat directo con Peyu Brain
 *  6) FORESIGHT — predicciones / lookahead
 */
export default function Cockpit() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const greeting = (() => {
    const h = now.getHours();
    if (h < 6) return 'Buena madrugada';
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative">
      {/* Grid pattern de fondo (sutil, estilo cockpit) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Glow ambient */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative p-3 lg:p-5 space-y-3 pb-20">
        {/* Header compacto */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#0a0e1a] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-poppins font-black text-white tracking-tight leading-none">PEYU COCKPIT</h1>
                <span className="text-[9px] bg-gradient-to-r from-violet-500 to-cyan-500 text-white px-1.5 py-0.5 rounded-full font-bold tracking-widest flex items-center gap-1">
                  <Sparkles className="w-2 h-2" /> COPILOT
                </span>
              </div>
              <p className="text-[10px] text-violet-300/60 leading-tight mt-0.5 flex items-center gap-1.5">
                <Radio className="w-2.5 h-2.5 text-emerald-400" />
                {greeting} · {now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <Link
              to="/admin"
              className="text-violet-300/60 hover:text-violet-200 transition px-2 py-1 rounded-md hover:bg-white/5"
            >
              dashboard clásico ↗
            </Link>
          </div>
        </div>

        {/* Zona 1 · PULSE — heartbeat compacto */}
        <PulseBar />

        {/* Zona 2 · NORTH STAR + FORESIGHT lado a lado */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <div className="xl:col-span-2"><NorthStarMetrics /></div>
          <ForesightPanel />
        </div>

        {/* Zona 3 · FLEET de agentes IA */}
        <AgentFleet />

        {/* Zonas 4-5 · MISSIONS + BRAIN TERMINAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <MissionsInbox />
          <BrainTerminal />
        </div>

        {/* Status footer */}
        <StatusFooter now={now} />
      </div>
    </div>
  );
}