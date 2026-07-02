// Slide del Manual de Marca de Peyu — replica el lenguaje del manual de
// referencia: lienzo horizontal, fondo verde profundo, anillos decorativos,
// label de sección y logo anclado arriba a la derecha.
import { LOGO_OFICIAL } from '@/lib/peyu-brand-manual';

export default function ManualSlide({ label, children, dark = true, num, center = false }) {
  return (
    <section
      className="relative w-full rounded-[2rem] overflow-hidden shadow-2xl"
      style={{
        background: dark
          ? 'linear-gradient(160deg, #0B4634 0%, #083428 55%, #062A20 100%)'
          : '#F8F3ED',
        color: dark ? '#F8F3ED' : '#2C1810',
        minHeight: 'min(62vw, 620px)',
      }}
    >
      {/* Anillos decorativos (esquinas) */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full border-[14px] pointer-events-none" style={{ borderColor: dark ? 'rgba(255,255,255,.06)' : 'rgba(44,24,16,.05)' }} />
      <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full border-[10px] pointer-events-none" style={{ borderColor: dark ? 'rgba(255,255,255,.05)' : 'rgba(44,24,16,.04)' }} />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full border-[14px] pointer-events-none" style={{ borderColor: dark ? 'rgba(255,255,255,.06)' : 'rgba(44,24,16,.05)' }} />

      {/* Header del slide */}
      {(label || num) && (
        <div className="relative flex items-start justify-between px-6 sm:px-10 pt-6 sm:pt-8">
          <div>
            {label && (
              <>
                <p className="font-jakarta font-extrabold text-sm sm:text-lg tracking-wide uppercase">{label}</p>
                <span className="block w-14 h-1 rounded-full mt-1.5" style={{ background: '#0F8B6C' }} />
              </>
            )}
          </div>
          <span className="flex-shrink-0 rounded-xl px-3 py-2" style={{ background: '#F8F3ED' }}>
            <img src={LOGO_OFICIAL} alt="PEYU" className="h-6 sm:h-8 w-auto" draggable={false} />
          </span>
        </div>
      )}

      <div className={`relative px-6 sm:px-10 py-6 sm:py-8 ${center ? 'flex flex-col items-center justify-center text-center' : ''}`}>
        {children}
      </div>

      {/* Footer */}
      <div className="relative flex items-center justify-between px-6 sm:px-10 pb-4 mt-auto">
        <span className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: dark ? '#A7D9C9' : '#A08070' }}>
          Manual de Marca · Peyu la Tortuga
        </span>
        {num && <span className="text-xs font-bold" style={{ color: dark ? '#A7D9C9' : '#A08070' }}>{String(num).padStart(2, '0')}</span>}
      </div>
    </section>
  );
}