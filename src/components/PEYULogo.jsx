export default function PEYULogo({ size = 'md', showText = true }) {
  const sizeMap = {
    xs: { container: 'w-6 h-6', text: 'text-xs' },
    sm: { container: 'w-8 h-8', text: 'text-sm' },
    md: { container: 'w-10 h-10', text: 'text-base' },
    lg: { container: 'w-12 h-12', text: 'text-lg' },
    xl: { container: 'w-16 h-16', text: 'text-2xl' },
  };

  const sizes = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes.container} bg-gradient-to-br from-[#0F8B6C] to-[#06634D] rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 p-0.5`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
          {/* Turtle silhouette - simplified version */}
          <ellipse cx="50" cy="55" rx="28" ry="32" fill="white" />
          <circle cx="50" cy="28" r="16" fill="white" />
          <ellipse cx="28" cy="72" rx="6" ry="10" fill="white" />
          <ellipse cx="72" cy="72" rx="6" ry="10" fill="white" />
          <path d="M 50 85 L 48 95 L 50 92 L 52 95 Z" fill="white" />
          {/* Head details */}
          <circle cx="45" cy="24" r="2" fill="#0F8B6C" />
          <circle cx="55" cy="24" r="2" fill="#0F8B6C" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col gap-0.5">
          <span className={`${sizes.text} font-poppins font-black text-gray-900 leading-none`}>PEYU</span>
          <span className="text-[10px] font-inter text-gray-500 leading-none">Chile</span>
        </div>
      )}
    </div>
  );
}