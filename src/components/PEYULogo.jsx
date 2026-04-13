export default function PEYULogo({ size = 'md', showText = true }) {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
    xl: 'text-4xl',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        viewBox="0 0 200 200"
        className={`${sizes[size]} fill-current text-black`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Tortuga PEYU */}
        {/* Caparazón */}
        <ellipse cx="100" cy="70" rx="55" ry="50" />
        {/* Cabeza */}
        <circle cx="100" cy="25" r="18" />
        {/* Ojo */}
        <circle cx="105" cy="22" r="3" fill="white" />
        {/* Patas delanteras */}
        <ellipse cx="60" cy="100" rx="12" ry="22" transform="rotate(-30 60 100)" />
        <ellipse cx="140" cy="100" rx="12" ry="22" transform="rotate(30 140 100)" />
        {/* Patas traseras */}
        <ellipse cx="50" cy="130" rx="12" ry="24" transform="rotate(-20 50 130)" />
        <ellipse cx="150" cy="130" rx="12" ry="24" transform="rotate(20 150 130)" />
        {/* Cola */}
        <rect x="93" y="115" width="14" height="35" rx="7" />
      </svg>
      {showText && <span className={`font-poppins font-bold ${textSizes[size]} text-black`}>PEYU</span>}
    </div>
  );
}