// ────────────────────────────────────────────────────────────────────────
// FloatingActionDock · UI trend 2030
// ────────────────────────────────────────────────────────────────────────
// Reemplaza el solapamiento entre WhatsAppFloat + AsistenteChat FAB con
// una pieza única: un "dock líquido" vertical (glass morphism + Liquid
// Dual tokens) que agrupa los dos canales de contacto en una sola
// arquitectura visual sofisticada.
//
// Comportamiento:
//   • Es SOLO el botón flotante / dock (NO renderiza el panel del chat —
//     eso lo sigue manejando AsistenteChat con su props open/onOpen).
//   • Click en Peyu IA → llama `onOpenChat()` (delegado al padre, que
//     abre el panel existente del AsistenteChat).
//   • Click en WhatsApp → abre wa.me en nueva pestaña.
//   • En `/` (landing) y `/cart`, `/gracias` → no se monta (los esconde
//     el padre vía route gating).
//
// Diseño trend 2030:
//   • Vidrio líquido (`ld-glass-strong`) con borde luminoso suave.
//   • Halo pulsante "en línea" en el botón principal.
//   • Hover: dock se "estira", revela labels editoriales.
//   • Status dot animado, tooltips sutiles.
//   • Respeta safe-area iOS.
// ────────────────────────────────────────────────────────────────────────
import { useState } from 'react';

// SVG WhatsApp oficial (mismo que tenía WhatsAppFloat).
const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.091.538 4.059 1.481 5.771L0 24l6.388-1.461A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.361-.213-3.724.851.877-3.622-.233-.375A9.818 9.818 0 012.182 12C2.182 6.566 6.566 2.182 12 2.182S21.818 6.566 21.818 12 17.434 21.818 12 21.818z" />
  </svg>
);

export default function FloatingActionDock({
  onOpenChat,
  hasUnread = false,
  unreadCount = 0,
  hideWhatsApp = false,
  whatsAppHref = 'https://wa.me/56935040242?text=Hola%2C%20me%20interesa%20información%20sobre%20regalos%20corporativos%20sostenibles',
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="fixed right-3 sm:right-4 z-[95] flex flex-col items-end gap-2"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ─── Acción secundaria: WhatsApp (solo desktop) ──────────────── */}
      {!hideWhatsApp && (
        <DockButton
          href={whatsAppHref}
          target="_blank"
          rel="noreferrer"
          ariaLabel="Chatear por WhatsApp"
          label="WhatsApp"
          hovered={hovered}
          accentBg="#25D366"
          accentGlow="rgba(37, 211, 102, 0.45)"
          icon={<WhatsAppIcon className="w-[22px] h-[22px] fill-white" />}
        />
      )}

      {/* ─── Acción principal: Peyu IA ───────────────────────────────── */}
      <DockButton
        onClick={onOpenChat}
        ariaLabel={hasUnread ? `Abrir chat con Peyu · ${unreadCount} mensajes` : 'Abrir chat con Peyu'}
        label={hasUnread ? 'Sigue tu chat' : 'Habla con Peyu'}
        sublabel={hasUnread ? `${unreadCount} mensajes` : 'En línea · te respondo al toque'}
        hovered={hovered}
        primary
        badge={hasUnread ? unreadCount : null}
        icon={
          <span className="relative flex items-center justify-center text-2xl leading-none">
            🐢
            {/* Status dot — verde vivo */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white shadow" />
          </span>
        }
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// DockButton · pieza atómica del dock con vidrio líquido + hover expand
// ────────────────────────────────────────────────────────────────────────
function DockButton({
  onClick,
  href,
  target,
  rel,
  ariaLabel,
  label,
  sublabel,
  icon,
  hovered,
  primary = false,
  badge = null,
  accentBg,
  accentGlow,
}) {
  // Renderizamos como <a> si hay href, sino <button>. Misma API visual.
  const Tag = href ? 'a' : 'button';
  const tagProps = href ? { href, target, rel } : { onClick, type: 'button' };

  return (
    <Tag
      {...tagProps}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="group relative flex items-center gap-2.5 transition-all duration-300 ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 rounded-full"
      style={{
        // Halo blur ambient (efecto trend 2030 — luz que respira)
        filter: hovered ? 'drop-shadow(0 12px 28px rgba(15, 139, 108, 0.35))' : 'drop-shadow(0 6px 16px rgba(15, 139, 108, 0.22))',
      }}
    >
      {/* Label que se expande al hacer hover en el dock (desktop only) */}
      <span
        className={`hidden sm:flex flex-col items-end pr-2 pl-3.5 py-1.5 rounded-l-full leading-tight transition-all duration-300 ease-out ld-glass-strong border border-ld-border ${
          hovered
            ? 'opacity-100 translate-x-0 max-w-[240px]'
            : 'opacity-0 translate-x-2 max-w-0 pointer-events-none border-transparent'
        } overflow-hidden whitespace-nowrap`}
      >
        <span className="text-[12px] font-bold text-ld-fg">{label}</span>
        {sublabel && (
          <span className="text-[10px] text-ld-fg-muted font-medium flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            {sublabel}
          </span>
        )}
      </span>

      {/* Botón circular — primary = gradient acción, secondary = color sólido */}
      <span
        className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.06] group-active:scale-95 border"
        style={{
          background: primary
            ? 'var(--ld-grad-action)'
            : accentBg || 'var(--ld-glass-strong)',
          borderColor: 'rgba(255, 255, 255, 0.25)',
          boxShadow: primary
            ? 'inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 24px -8px rgba(15, 139, 108, 0.5)'
            : `inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 24px -8px ${accentGlow || 'rgba(0,0,0,0.25)'}`,
        }}
      >
        {/* Halo pulsante sutil (solo primary) — la pieza viva del dock */}
        {primary && (
          <span
            className="absolute inset-0 rounded-full opacity-60 group-hover:opacity-90 animate-pulse pointer-events-none"
            style={{ boxShadow: '0 0 0 4px rgba(15, 139, 108, 0.18)' }}
          />
        )}

        <span className="relative text-white">{icon}</span>

        {/* Badge contador (si hay unread) */}
        {badge && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full flex items-center justify-center text-white ring-2 ring-white shadow"
            style={{ background: 'var(--ld-highlight, #D96B4D)' }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
    </Tag>
  );
}