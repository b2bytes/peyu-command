import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { stripTags, extractSkus, extractNavs, extractCartActions, extractQuoteRequests, RE_CHECKOUT } from '@/lib/vendedor-chat';
import VendedorMarkdown from './VendedorMarkdown';
import VendedorProductGrid from './VendedorProductGrid';
import VendedorCartCard from './VendedorCartCard';
import VendedorQuoteCard from './VendedorQuoteCard';

// Burbuja de mensaje del chat vendedor. Para el agente, parsea los tags
// [[PRODUCTO]], [[CART]], [[CHECKOUT]] y [[NAV]] y los renderiza como
// tarjetas de producto, carrito en vivo y botones — el flujo completo de
// compra vive DENTRO de la conversación. El texto se renderiza con formato
// real (negritas, listas) en vez del markdown crudo.
export default function VendedorMensaje({ msg, productosBySku, isLast = false }) {
  const isUser = msg.role === 'user';
  const texto = stripTags(msg.content);
  const skus = isUser ? [] : extractSkus(msg.content);
  const navs = isUser ? [] : extractNavs(msg.content);
  const tieneCart = !isUser && extractCartActions(msg.content).length > 0;
  const tieneCheckout = !isUser && RE_CHECKOUT.test(msg.content);
  const quotes = isUser ? [] : extractQuoteRequests(msg.content);
  // El carrito vivo se muestra solo en el ÚLTIMO mensaje con acción de compra,
  // para no apilar carritos repetidos en el historial.
  const muestraCarrito = isLast && (tieneCart || tieneCheckout);
  const productos = skus.map((s) => productosBySku[s]).filter(Boolean);

  if (!texto && !productos.length && !navs.length && !muestraCarrito && !quotes.length) return null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${isUser ? 'max-w-[85%] items-end' : 'max-w-[92%] lg:max-w-[88%] items-start'} space-y-2 flex flex-col w-full`}>
        {texto && (
          <div
            className={`rounded-2xl px-3.5 py-2.5 ${isUser ? 'rounded-br-md' : 'rounded-bl-md shadow-sm'}`}
            style={isUser
              ? { background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }
              : { background: 'white', border: '1px solid #E7D8C6' }}
          >
            <VendedorMarkdown isUser={isUser}>{texto}</VendedorMarkdown>
          </div>
        )}

        {/* Tarjetas de producto solo si no se muestra el carrito (evita ruido) */}
        {!muestraCarrito && productos.length > 0 && (
          <VendedorProductGrid productos={productos} />
        )}

        {/* Carrito EN VIVO dentro del chat: editar, eliminar y pagar */}
        {muestraCarrito && <VendedorCartCard showCheckout />}

        {/* Propuesta PDF B2B: genera y entrega la cotización formal en el chat */}
        {quotes.map((q, qi) => (
          <VendedorQuoteCard key={`${q.sku}-${qi}`} req={q} />
        ))}

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