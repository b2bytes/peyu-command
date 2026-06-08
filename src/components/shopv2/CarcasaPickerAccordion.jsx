import { useState, useMemo } from 'react';
import { ChevronDown, Check, Smartphone, Sparkles } from 'lucide-react';
import { getProductImageForColor, getProductImage } from '@/utils/productImages';
import { getColoresProducto } from '@/lib/color-parser';
import { modeloDe, modelosDisponibles } from '@/lib/phone-models-v2';

// Mapa color → hex para los swatches
const COLOR_HEX = {
  negro: '#1a1a1a', black: '#1a1a1a',
  blanco: '#f5f5f0', white: '#f5f5f0',
  amarillo: '#F5C842', yellow: '#F5C842',
  rosado: '#F4A7C0', rosa: '#F4A7C0', pink: '#F4A7C0',
  turquesa: '#5ECFCF', teal: '#5ECFCF',
  azul: '#4A7FD4', blue: '#4A7FD4',
  verde: '#5B9F6B', green: '#5B9F6B',
  morado: '#8B5CF6', purple: '#8B5CF6',
  naranja: '#F4874A', orange: '#F4874A',
  gris: '#9CA3AF', gray: '#9CA3AF', grey: '#9CA3AF',
  cafe: '#8B6F47', marrón: '#8B6F47', brown: '#8B6F47',
  crema: '#EDE3D6',
};

function getColorHex(colorLabel) {
  const k = (colorLabel || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  for (const [key, val] of Object.entries(COLOR_HEX)) {
    if (k.includes(key)) return val;
  }
  return '#D4C4B0';
}

// Agrupa carcasas por modelo (iPhone 16, iPhone 15, etc.)
function agruparPorModelo(carcasas) {
  const grupos = {};
  carcasas.forEach((p) => {
    const modelo = modeloDe(p);
    const key = modelo || 'Otros';
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(p);
  });
  // Ordena por prioridad de MODELOS
  const orden = modelosDisponibles(carcasas);
  const result = orden.map((m) => ({ modelo: m, productos: grupos[m] || [] }));
  if (grupos['Otros']?.length) result.push({ modelo: 'Otros', productos: grupos['Otros'] });
  return result;
}

// Fila compacta de un producto dentro del accordion (variante + colores)
function ProductRow({ producto, selected, onSelect }) {
  const colores = useMemo(() => getColoresProducto(producto), [producto]);
  const [colorId, setColorId] = useState(colores[0]?.id || null);
  const color = colores.find((c) => c.id === colorId);

  const isSelected = selected?.productoId === producto.id;

  return (
    <div
      onClick={() => onSelect({ productoId: producto.id, producto, colorId, color })}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all ${
        isSelected
          ? 'border border-[#0F8B6C]'
          : 'border border-transparent hover:border-[#D4C4B0] hover:bg-[#F8F3ED]/60'
      }`}
      style={{ background: isSelected ? 'rgba(15,139,108,.06)' : 'transparent' }}
    >
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#2A2420] truncate leading-tight">{producto.nombre}</p>

        {/* Swatches de color inline */}
        {colores.length > 0 && (
          <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
            {colores.map((c) => (
              <button
                key={c.id}
                title={c.label}
                onClick={() => setColorId(c.id)}
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{
                  background: getColorHex(c.label),
                  border: colorId === c.id ? '2px solid #0F8B6C' : '1.5px solid rgba(0,0,0,.10)',
                  boxShadow: colorId === c.id ? '0 0 0 1.5px white, 0 0 0 2.5px #0F8B6C' : 'none',
                }}
              />
            ))}
            {color && <span className="text-[9px] text-[#A08070] ml-0.5">{color.label}</span>}
          </div>
        )}
      </div>

      {/* Precio + check */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {producto.precio_b2c && (
          <span className="text-[10px] font-bold text-[#0F8B6C]">
            ${producto.precio_b2c.toLocaleString('es-CL')}
          </span>
        )}
        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
          isSelected ? 'bg-[#0F8B6C]' : 'border border-[#D4C4B0]'
        }`}>
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>
    </div>
  );
}

// Grupo compacto expandible por modelo
function ModeloGroup({ modelo, productos, selected, onSelect, defaultOpen }) {
  const hasSelected = productos.some((p) => selected?.productoId === p.id);
  const [open, setOpen] = useState(defaultOpen || hasSelected);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #EBE3D6' }}>
      {/* Header compacto */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-[#F5EFE8]"
        style={{ background: open ? '#FDFAF7' : 'white' }}
      >
        <div className="flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5 text-[#0F8B6C] flex-shrink-0" />
          <p className="text-xs font-bold text-[#2A2420]">{modelo}</p>
          <span className="text-[10px] text-[#A08070] bg-[#F0EBE3] px-1.5 py-0.5 rounded-full">
            {productos.length}
          </span>
          {hasSelected && (
            <span className="text-[10px] font-bold text-[#0F8B6C]">✓</span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#A08070] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Contenido expandible */}
      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${open ? 'max-h-[800px]' : 'max-h-0'}`}>
        <div className="px-2 py-1.5 space-y-0.5" style={{ background: '#FDFAF7', borderTop: '1px solid #EBE3D6' }}>
          {productos.map((p) => (
            <ProductRow key={p.id} producto={p} selected={selected} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CarcasaPickerAccordion — Listado expandible por modelo para elegir carcasa
// Props: carcasas (array de Producto), onSelect (fn({ productoId, producto, colorId, color }))
// ════════════════════════════════════════════════════════════════════════
export default function CarcasaPickerAccordion({ carcasas = [], selected, onSelect }) {
  const [busqueda, setBusqueda] = useState('');

  const grupos = useMemo(() => {
    const filtradas = busqueda.trim()
      ? carcasas.filter((p) => p.nombre?.toLowerCase().includes(busqueda.toLowerCase()))
      : carcasas;
    return agruparPorModelo(filtradas);
  }, [carcasas, busqueda]);

  if (!carcasas.length) return null;

  return (
    <div>
      {/* Search box */}
      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Busca tu modelo (ej: iPhone 16, Huawei...)"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-4 pr-10 py-3 rounded-2xl text-sm font-medium outline-none transition-all"
          style={{
            background: 'white',
            border: '1.5px solid #D4C4B0',
            color: '#2A2420',
          }}
        />
        <Smartphone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A08070]" />
      </div>

      {/* Grupos */}
      <div className="space-y-2">
        {grupos.length === 0 ? (
          <p className="text-sm text-center py-6 text-[#A08070]">No se encontraron carcasas para "{busqueda}"</p>
        ) : (
          grupos.map((g, i) => (
            <ModeloGroup
              key={g.modelo}
              modelo={g.modelo}
              productos={g.productos}
              selected={selected}
              onSelect={onSelect}
              defaultOpen={false}
            />
          ))
        )}
      </div>

      {/* Hint */}
      {selected && (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-[#0F8B6C] font-semibold px-1">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Carcasa seleccionada. Ahora elige tu personalización abajo.</span>
        </div>
      )}
    </div>
  );
}