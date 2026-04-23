// Logo oficial PEYU — tortuga verde sobre fondo blanco (imagen de marca real).
export default function PEYULogo({ size = 'md', showText = true }) {
  const sizeMap = {
    xs: { container: 'w-8 h-8',  text: 'text-sm',  sub: 'text-[9px]' },
    sm: { container: 'w-10 h-10', text: 'text-sm',  sub: 'text-[10px]' },
    md: { container: 'w-12 h-12', text: 'text-base', sub: 'text-[10px]' },
    lg: { container: 'w-14 h-14', text: 'text-lg',  sub: 'text-xs' },
    xl: { container: 'w-20 h-20', text: 'text-2xl', sub: 'text-xs' },
  };
  const sizes = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes.container} rounded-full bg-white flex items-center justify-center shadow-md ring-1 ring-black/5 flex-shrink-0 overflow-hidden`}>
        <img
          src="https://media.base44.com/images/public/69d99b9d61f699701129c103/d5f5c4e63_logopeyu.png"
          alt="PEYU"
          className="w-full h-full object-contain p-0.5"
          loading="eager"
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${sizes.text} font-poppins font-black text-white drop-shadow-sm tracking-tight`}>PEYU</span>
          <span className={`${sizes.sub} font-inter text-white/75 mt-0.5`}>Chile</span>
        </div>
      )}
    </div>
  );
}