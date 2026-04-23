// Logo oficial PEYU — tortuga + tipografía "PEYU" integrada en la imagen.
// El logo es horizontal (ratio ~4:1) y ya incluye el texto, por lo que no
// añadimos label de texto al lado. Mantenemos la prop showText para
// compatibilidad, pero no tiene efecto visual.
export default function PEYULogo({ size = 'md', invert = true }) {
  const sizeMap = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
  };
  const heightClass = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex items-center flex-shrink-0">
      <img
        src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
        alt="PEYU"
        className={`${heightClass} w-auto object-contain select-none`}
        style={invert ? { filter: 'invert(1) brightness(1.1)' } : undefined}
        draggable={false}
        loading="eager"
      />
    </div>
  );
}