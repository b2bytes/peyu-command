import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ShoppingCart, X } from 'lucide-react';

/**
 * Toast global que escucha el evento `peyu:cart-added` y muestra
 * una confirmación con link directo al carrito. Se auto-oculta a los 4s.
 */
export default function ChatCartToast() {
  const [item, setItem] = useState(null);

  useEffect(() => {
    const onAdded = (e) => {
      setItem(e.detail);
      const t = setTimeout(() => setItem(null), 4000);
      return () => clearTimeout(t);
    };
    window.addEventListener('peyu:cart-added', onAdded);
    return () => window.removeEventListener('peyu:cart-added', onAdded);
  }, []);

  if (!item) return null;

  return (
    <div className="fixed bottom-44 right-6 z-[60] animate-in slide-in-from-right-5 fade-in duration-300">
      <div className="bg-white border border-green-200 shadow-2xl rounded-2xl p-3 pr-4 flex items-center gap-3 max-w-xs">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
          <Check className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 truncate">Agregado al carrito</p>
          <p className="text-[11px] text-gray-500 truncate">{item.nombre}</p>
          <Link to="/cart" className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 mt-0.5">
            <ShoppingCart className="w-3 h-3" /> Ver carrito
          </Link>
        </div>
        <button onClick={() => setItem(null)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}