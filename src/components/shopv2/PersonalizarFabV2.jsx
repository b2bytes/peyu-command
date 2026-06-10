import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// PersonalizarFabV2 — Botón "Personalizar" PERMANENTE en la home: aparece al
// hacer scroll (cuando el hero con sus CTAs ya no se ve) y queda fijo abajo
// a la derecha, sobre la barra de tabs móvil. Da continuidad a la acción
// principal sin importar cuánto contenido venga después.
// ════════════════════════════════════════════════════════════════════════
export default function PersonalizarFabV2() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Link
      to="/personalizar"
      className={`fixed right-4 sm:right-6 bottom-20 lg:bottom-6 z-40 inline-flex items-center gap-2 text-white font-bold text-sm px-5 py-3.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      style={{
        background: 'linear-gradient(135deg,#C0785C,#A86440)',
        boxShadow: '0 10px 30px rgba(192,120,92,.45)',
      }}
      aria-label="Personalizar un producto"
    >
      <Sparkles className="w-4 h-4" strokeWidth={1.75} />
      Personalizar
    </Link>
  );
}