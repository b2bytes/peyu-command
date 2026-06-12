import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { stripTags, extractSkus, extractNavs, extractCartActions, RE_CHECKOUT } from '@/lib/vendedor-chat';
import VendedorProductCard from './VendedorProductCard';
import VendedorCartCard from './VendedorCartCard';

// Burbuja de mensaje del chat vendedor. Para el agente, parsea los tags
// [[PRODUCTO]], [[CART]], [[CHECKOUT]] y [[NAV]] y los renderiza como
// tarjetas de producto, carrito en vivo y botones — el flujo completo de
// compra vive DENTRO de la conversación.
export default function VendedorMensaje({ msg, productosBySku, isLast = false }) {
  const isUser = msg.role === 'user';
  const texto = stripTags(msg.content);
  const skus = isUser ? [] : extractSkus(msg.content);
  const navs = isUser ? [] : extractNavs(msg.content);
  const tieneCart = !isUser && extractCartActions(msg.content).length > 0;
  const tieneCheckout = !isUser && RE_CHECKOUT.test(msg.content);
  // El carrito vivo se muestra solo en el ÚLTIMO mensaje con acción de compra,
  // para no apilar carritos repetidos en el historial.
  const muestraCarrito = isLast && (tieneCart || tieneCheckout);

  if (!texto && !skus.length && !navs.length && !muestraCarrito) return null;

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

        {/* Tarjetas de producto solo si no se muestra el carrito (evita ruido) */}
        {!muestraCarrito && skus.map((sku) => (
          <VendedorProductCard key={sku} producto={productosBySku[sku]} />
        ))}

        {/* Carrito EN VIVO dentro del chat: editar, eliminar y pagar */}
        {muestraCarrito && <VendedorCartCard showCheckout />}

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