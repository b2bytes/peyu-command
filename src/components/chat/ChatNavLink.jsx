import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';

/**
 * Mapa de rutas conocidas del sitio público (usado por el chat para
 * navegación inteligente con contexto).
 * El agente usa [[NAV:/ruta]] o [[NAV:/ruta|Label personalizado]].
 */
export const SITE_MAP = {
  '/':                  { label: 'Inicio',                desc: 'Volver al home' },
  '/shop':              { label: 'Tienda',                desc: 'Ver todo el catálogo' },
  '/catalogo-visual':   { label: 'Catálogo visual',       desc: 'Explorar por imagen' },
  '/personalizar':      { label: 'Personalización láser', desc: 'Sube tu logo y crea tu mockup' },
  '/b2b/contacto':      { label: 'Cotización corporativa',desc: 'Volumen 50u+ con tu logo' },
  '/b2b/catalogo':      { label: 'Catálogo B2B',          desc: 'Productos corporativos' },
  '/b2b/self-service':  { label: 'Cotizador B2B',         desc: 'Arma tu cotización sólo' },
  '/nosotros':          { label: 'Nosotros',              desc: 'Conoce PEYU y su impacto' },
  '/blog':              { label: 'Blog',                  desc: 'Artículos de sostenibilidad' },
  '/seguimiento':       { label: 'Seguir pedido',         desc: 'Estado de tu orden' },
  '/soporte':           { label: 'Soporte',               desc: 'Ayuda y contacto' },
  '/faq':               { label: 'Preguntas frecuentes',  desc: 'Dudas comunes' },
  '/envios':            { label: 'Envíos',                desc: 'Cobertura y tiempos' },
  '/cambios':           { label: 'Cambios y devoluciones',desc: 'Políticas' },
  '/contacto':          { label: 'Contacto',              desc: 'Escríbenos' },
  '/cart':              { label: 'Carrito',               desc: 'Revisar tu compra' },
};

function markAgentNavigation() {
  try { localStorage.setItem('peyu_chat_agent_navigated_at', String(Date.now())); } catch {}
}

/**
 * Renderiza un botón de navegación interno sugerido por el agente.
 * Variant:
 *  - 'dark'  → usado en landing (fondo oscuro)
 *  - 'light' → usado en widget flotante
 */
export default function ChatNavLink({ to, label, variant = 'dark' }) {
  const meta = SITE_MAP[to] || { label: to, desc: 'Abrir página' };
  const displayLabel = label || meta.label;

  const styles = variant === 'dark'
    ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800';

  return (
    <Link to={to} onClick={markAgentNavigation} className="block my-1.5">
      <button className={`w-full flex items-center gap-2.5 ${styles} border text-xs font-semibold rounded-xl px-3 py-2 transition-all hover:scale-[1.01] text-left`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${variant === 'dark' ? 'bg-teal-500/30' : 'bg-teal-100'}`}>
          <Compass className={`w-3.5 h-3.5 ${variant === 'dark' ? 'text-teal-200' : 'text-teal-700'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold leading-tight truncate">{displayLabel}</p>
          <p className={`text-[10px] font-normal truncate ${variant === 'dark' ? 'text-white/50' : 'text-gray-400'}`}>
            {meta.desc}
          </p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
      </button>
    </Link>
  );
}