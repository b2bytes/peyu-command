export default function PEYULogo({ size = 'md', showText = true }) {
  const sizeMap = {
    xs: { icon: 'w-6 h-6', text: 'text-xs' },
    sm: { icon: 'w-8 h-8', text: 'text-sm' },
    md: { icon: 'w-10 h-10', text: 'text-base' },
    lg: { icon: 'w-12 h-12', text: 'text-lg' },
    xl: { icon: 'w-16 h-16', text: 'text-2xl' },
  };

  const sizes = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes.icon} bg-gradient-to-br from-[#0F8B6C] to-[#06634D] rounded-lg flex items-center justify-center shadow-lg flex-shrink-0`}>
        <svg viewBox="0 0 100 100" className="w-full h-full text-white">
          {/* Turtle head */}
          <circle cx="50" cy="35" r="15" fill="currentColor" />
          {/* Turtle eyes */}
          <circle cx="45" cy="32" r="2.5" fill="#0F2E24" />
          <circle cx="55" cy="32" r="2.5" fill="#0F2E24" />
          {/* Turtle shell - 3 segments */}
          <ellipse cx="50" cy="60" rx="22" ry="28" fill="currentColor" opacity="0.9" />
          <path d="M 35 55 Q 50 70 65 55" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M 35 70 Q 50 80 65 70" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
          {/* Turtle legs */}
          <circle cx="30" cy="75" r="4" fill="currentColor" />
          <circle cx="70" cy="75" r="4" fill="currentColor" />
          {/* Turtle tail */}
          <path d="M 50 88 L 50 95" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col gap-0.5">
          <span className={`${sizes.text} font-poppins font-bold text-gray-900 leading-none`}>PEYU</span>
          <span className={`text-[${parseInt(sizes.text) * 0.75}px] font-inter text-gray-500 leading-none`}>Chile</span>
        </div>
      )}
    </div>
  );
}