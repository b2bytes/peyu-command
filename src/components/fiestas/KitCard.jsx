import { Link } from 'react-router-dom';
import { Check, MessageCircle, Briefcase } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';
import { waLinkKit } from '@/lib/fiestas-kits';

// Card de un kit de regalo de Fiestas Patrias. Sin sombras en botones —
// diseño plano Warm Dusk con acentos patrios.
export default function KitCard({ kit }) {
  const esEmpresa = kit.tag === 'Empresa';

  return (
    <div
      className="flex flex-col rounded-3xl overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{ background: 'white', border: `1.5px solid ${kit.destacado ? '#C0785C' : '#D4C4B0'}` }}
    >
      {kit.destacado && (
        <div className="text-center text-[10px] font-bold uppercase tracking-[0.15em] py-1.5 text-white" style={{ background: '#C0785C' }}>
          El más pedido
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-3xl">{kit.emoji}</span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: esEmpresa ? 'rgba(15,61,145,.08)' : 'rgba(168,68,58,.08)', color: esEmpresa ? '#0F3D91' : '#A8443A' }}>
            {kit.tag}
          </span>
        </div>
        <h3 className="font-fraunces text-xl leading-tight mb-1">{kit.nombre}</h3>
        <p className="text-xs mb-3" style={{ color: '#7A6050' }}>{kit.desc}</p>

        <ul className="space-y-1.5 mb-4 flex-1">
          {kit.incluye.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs" style={{ color: '#2C1810' }}>
              <Check className="w-3.5 h-3.5 flex-shrink-0 mt-px" style={{ color: '#8BAD8A' }} />
              {item}
            </li>
          ))}
        </ul>

        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] font-semibold" style={{ color: '#A08070' }}>
              {kit.porUnidad ? `Por unidad · mín. ${kit.minimo}u` : 'Precio del kit'}
            </p>
            <p className="font-poppins font-extrabold text-xl" style={{ color: '#C0785C' }}>{fmtCLP(kit.precio)}</p>
          </div>
        </div>

        {esEmpresa ? (
          <Link
            to="/fiestas-patrias/empresas"
            className="w-full h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:brightness-110"
            style={{ background: '#2C1810' }}
          >
            <Briefcase className="w-4 h-4" /> Cotizar para mi empresa
          </Link>
        ) : (
          <a
            href={waLinkKit(kit)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:brightness-110"
            style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}
          >
            <MessageCircle className="w-4 h-4" /> Lo quiero
          </a>
        )}
      </div>
    </div>
  );
}