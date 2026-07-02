// Avatar oficial del chat según el Manual de Marca de Peyu:
// isotipo crema (PNG transparente, generado del trazo original) flotando
// sobre el círculo verde degradado — como la lámina "Widget de chat".
import { useEffect, useState } from 'react';
import { buildLogoVariant } from '@/lib/logo-variants';

let isoCache = null;

export default function PeyuChatAvatar({ size = 40, className = '' }) {
  const [iso, setIso] = useState(isoCache);

  useEffect(() => {
    if (isoCache) return;
    let alive = true;
    buildLogoVariant('#F8F3ED', 'isotipo')
      .then((u) => { isoCache = u; if (alive) setIso(u); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <span
      className={`rounded-full flex items-center justify-center flex-shrink-0 pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(145deg,#0F8B6C,#0B4634)',
        border: '2px solid rgba(255,255,255,.25)',
      }}
    >
      {iso && (
        <img
          src={iso}
          alt="Peyu"
          className="object-contain"
          style={{ width: size * 0.62, height: size * 0.62 }}
          draggable={false}
        />
      )}
    </span>
  );
}