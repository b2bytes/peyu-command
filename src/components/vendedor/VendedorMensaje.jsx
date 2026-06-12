import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { stripTags, extractSkus, extractNavs, RE_CHECKOUT } from '@/lib/vendedor-chat';
import VendedorProductCard from './VendedorProductCard';

// Burbuja de mensaje del chat vendedor. Para el agente, parsea los tags
// [[PRODUCTO]], [[CHECKOUT]] y [[NAV]] y los renderiza como tarjetas/botones.
export default function VendedorMensaje({ msg, productosBySku }) {
  const isUser = msg.role === 'user';
  const texto = stripTags(msg.content);
  const skus = isUser ? [] : extractSkus(msg.content);
  const navs = isUser ? [] : extractNavs(msg.content);
  const tieneCheckout = !isUser && RE_CHECKOUT.test(msg.content);

  if (!texto && !skus.length && !navs.length && !tieneCheckout) return null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[88%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {texto && (
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
              isUser ? 'text-white rounded-br-md' : 'rounded-bl-md'
            }`}
            style={isUser
              ? { background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }
              : { background: 'white', border: '1px solid #E7D8C6', color: '#2C1810' }}
          >
            {texto}
          </div>
        )}

        {skus.map((sku) => (
          <VendedorProductCard key={sku} producto={productosBySku[sku]} />
        ))}

        {tieneCheckout && (
          <Link
            to="/CarritoNuevo"
            className="inline-flex items-center gap-2 text-white font-bold text-sm px-5 py-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)', boxShadow: '0 6px 18px rgba(192,120,92,.3)' }}
          >
            <ShoppingBag className="w-4 h-4" /> Ir a pagar <ArrowRight className="w-4 h-4" />
          </Link>
        )}

        {navs.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all hover:bg-[#F0E8DE]"
            style={{ border: '1.5px solid #D4C4B0', color: '#2C1810', background: 'white' }}
          >
            {n.label} <ArrowRight className="w-3 h-3" style={{ color: '#C0785C' }} />
          </Link>
        ))}
      </div>
    </div>
  );
}