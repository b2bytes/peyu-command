import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Gift, Recycle, Mail, Clock, Shield } from 'lucide-react';
import SEO from '@/components/SEO';
import FlowSelector from '@/components/giftcard/FlowSelector';
import GiftCardB2CFlow from '@/components/giftcard/GiftCardB2CFlow';
import GiftCardB2BForm from '@/components/giftcard/GiftCardB2BForm';

export default function RegalarGiftCard() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initialFlow = params.get('flow') === 'b2b' ? 'b2b' : 'b2c';
  const [flow, setFlow] = useState(initialFlow);

  // Sincroniza flow con la URL para que sea linkeable / compartible
  useEffect(() => {
    if (params.get('flow') !== flow) {
      const next = new URLSearchParams(params);
      next.set('flow', flow);
      setParams(next, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow]);

  const isB2B = flow === 'b2b';

  return (
    <>
      <SEO
        title={isB2B
          ? 'Gift Cards Corporativas PEYU · Regalos B2B Sostenibles para Empresas'
          : 'Regala una Gift Card PEYU · Regalo Sostenible 100% Reciclado'}
        description={isB2B
          ? 'Gift Cards corporativas para tu equipo, clientes y partners. Volumen, packaging branded, descuentos hasta 15%. Propuesta en menos de 24h.'
          : 'Regala sostenibilidad con una Gift Card PEYU. Entrega digital inmediata por email, válida 12 meses en toda la tienda. Desde $5.000 CLP.'}
        canonical={`https://peyuchile.cl/regalar-giftcard${isB2B ? '?flow=b2b' : ''}`}
      />
      <div className="flex-1 overflow-auto py-10 px-4">
        <div className="max-w-6xl mx-auto">

          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>

          {/* Hero */}
          <div className="text-center mb-8">
            <div className={`inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4 shadow-2xl transition-all ${
              isB2B
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30'
                : 'bg-gradient-to-br from-[#D96B4D] to-[#0F8B6C] shadow-emerald-500/20'
            }`}>
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-poppins font-bold text-white mb-2">
              {isB2B ? 'Gift Cards Corporativas PEYU' : 'Regala una Gift Card PEYU'}
            </h1>
            <p className="text-white/60 max-w-lg mx-auto text-sm sm:text-base">
              {isB2B
                ? 'Para tu equipo, clientes y partners. Volumen, packaging branded y descuentos por escala.'
                : 'El regalo perfecto: sostenible, único y entregado al instante por email.'}
            </p>
          </div>

          {/* Flow selector — siempre visible para cambiar de tipo */}
          <FlowSelector value={flow} onChange={setFlow} />

          {/* Trust badges (B2C) / Stats (B2B) */}
          {!isB2B ? (
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-8 text-[11px] text-white/50">
              <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-emerald-400" /> Entrega por email</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-400" /> Vigencia 12 meses</span>
              <span className="inline-flex items-center gap-1.5"><Recycle className="w-3.5 h-3.5 text-emerald-400" /> 100% digital, 0 plástico</span>
              <span className="inline-flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Código único</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
              {[
                ['💼', '120+', 'empresas confían'],
                ['📈', 'Hasta 15%', 'descuento volumen'],
                ['⚡', '<24h', 'propuesta'],
                ['🌱', '100%', 'sostenible'],
              ].map(([e, n, l]) => (
                <div key={l} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-xl mb-0.5">{e}</div>
                  <div className="text-sm font-bold text-white">{n}</div>
                  <div className="text-[10px] text-white/50">{l}</div>
                </div>
              ))}
            </div>
          )}

          {/* Render según flujo */}
          {isB2B ? <GiftCardB2BForm /> : <GiftCardB2CFlow />}
        </div>
      </div>
    </>
  );
}