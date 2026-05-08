import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, ArrowLeft, Sparkles } from 'lucide-react';
import PulseBar from '@/components/cockpit/PulseBar';
import AgentFleet from '@/components/cockpit/AgentFleet';
import MissionsInbox from '@/components/cockpit/MissionsInbox';
import BrainTerminal from '@/components/cockpit/BrainTerminal';
import NorthStarMetrics from '@/components/cockpit/NorthStarMetrics';
import ForesightPanel from '@/components/cockpit/ForesightPanel';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30 p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-poppins font-black text-white tracking-tight">Peyu Cockpit</h1>
              <span className="text-[10px] bg-gradient-to-r from-violet-500 to-cyan-500 text-white px-2 py-0.5 rounded-full font-bold tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> COPILOT v1
              </span>
            </div>
            <p className="text-xs text-violet-300/70">
              {greeting} · {now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })} · puente de mando
            </p>
          </div>
        </div>
        <Link
          to="/admin"
          className="text-xs text-violet-300/70 hover:text-violet-200 flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3 h-3" /> Centro de Comandos clásico
        </Link>
      </div>

      {/* Zona 1 · PULSE */}
      <PulseBar />

      {/* Zona 2 · NORTH STAR */}
      <NorthStarMetrics />

      {/* Zona 3 · FLEET de agentes IA */}
      <AgentFleet />

      {/* Zonas 4-5 · MISSIONS + BRAIN TERMINAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MissionsInbox />
        <BrainTerminal />
      </div>

      {/* Zona 6 · FORESIGHT */}
      <ForesightPanel />

      {/* Footer */}
      <div className="text-center text-[10px] text-white/30 pt-4 pb-2 font-mono">
        peyu_cockpit · agentic operating model · co-pilot híbrido · {now.toLocaleTimeString('es-CL')}
      </div>
    </div>
  );
}