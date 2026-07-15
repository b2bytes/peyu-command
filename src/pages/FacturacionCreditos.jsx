import { useState, useEffect } from 'react';
import { Wallet, ExternalLink } from 'lucide-react';
import PlanCreditosCard from '@/components/facturacion/PlanCreditosCard';
import ConsumoIAPanel from '@/components/facturacion/ConsumoIAPanel';

// ════════════════════════════════════════════════════════════════════════
// Facturación & Créditos — panel para fundadores estilo "billing" Base44.
// Divide el fee mensual (490.000 CLP) en los créditos disponibles del plan,
// muestra consumo, restante, proyección y el uso real de IA de la app.
// La config (créditos incluidos/usados) se guarda en localStorage.
// ════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'peyu_facturacion_config_v1';
const DEFAULT_CONFIG = { feeCLP: 490000, creditosIncluidos: 100000, creditosUsados: 0 };

export default function FacturacionCreditos() {
  const [config, setConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved ? { ...DEFAULT_CONFIG, ...saved } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--ld-grad-action)' }}>
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="ld-display text-2xl text-ld-fg">Facturación & Créditos</h1>
            <p className="text-sm text-ld-fg-muted">Plan mensual, valor por crédito, consumo y proyección</p>
          </div>
        </div>
        <a
          href="https://app.base44.com"
          target="_blank"
          rel="noopener noreferrer"
          className="ld-btn-ghost inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
        >
          Panel Base44 <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <PlanCreditosCard config={config} onChange={setConfig} />
      <ConsumoIAPanel />
    </div>
  );
}