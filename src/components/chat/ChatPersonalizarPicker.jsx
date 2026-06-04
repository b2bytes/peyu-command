import { useState } from 'react';
import { Sparkles, Type, Palette, Upload, Loader2, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PRECIO_PERSONALIZACION } from '@/lib/personalizacion-config';

/**
 * ChatPersonalizarPicker — BLOQUE 3
 * Selector compacto de personalización láser DENTRO del chat, con las 3 opciones
 * y sus precios (gratis ≥10u). Devuelve al padre { tipo, texto, logoUrl } para
 * que se agreguen al item del carrito, igual que en la ficha de producto.
 *
 * Tipos:
 *   - frase    → texto a grabar (+$3.990 c/u)
 *   - peyu     → (no se ofrece aquí; requiere galería) — se omite por simplicidad
 *   - archivo  → sube su logo (+$7.990 c/u)
 * El grabado es GRATIS desde 10u.
 */
export default function ChatPersonalizarPicker({ moq = 10, onConfirm, onCancel, dark = true }) {
  const [tipo, setTipo] = useState(null); // 'frase' | 'archivo'
  const [texto, setTexto] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  const cardBg = dark ? 'bg-white/5 border-white/20 text-white' : 'bg-white border-gray-200 text-gray-900';
  const subtle = dark ? 'text-white/55' : 'text-gray-500';
  const inputCls = dark
    ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40'
    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400';

  const opciones = [
    { id: 'frase', icon: Type, label: 'Una frase o texto', precio: PRECIO_PERSONALIZACION.frase },
    { id: 'archivo', icon: Upload, label: 'Subir mi logo/imagen', precio: PRECIO_PERSONALIZACION.archivo },
  ];

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(res.file_url || '');
    } catch { /* silencio */ }
    finally { setSubiendo(false); }
  };

  const puedeConfirmar = (tipo === 'frase' && texto.trim()) || (tipo === 'archivo' && logoUrl);

  return (
    <div className={`mt-2 ${cardBg} border rounded-xl p-3 space-y-2.5`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Personaliza con grabado láser
        </p>
        <button onClick={onCancel} className={`p-1 rounded hover:opacity-70 ${subtle}`}><X className="w-3.5 h-3.5" /></button>
      </div>
      <p className={`text-[10px] ${subtle}`}>Gratis desde {moq} unidades · acabado permanente</p>

      {/* Opciones */}
      <div className="grid grid-cols-2 gap-2">
        {opciones.map(o => {
          const activo = tipo === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setTipo(o.id)}
              className={`p-2.5 rounded-lg border-2 text-left transition-all ${
                activo
                  ? (dark ? 'border-teal-400 bg-teal-500/15' : 'border-teal-500 bg-teal-50')
                  : (dark ? 'border-white/15 hover:border-white/30' : 'border-gray-200 hover:border-gray-300')
              }`}
            >
              <o.icon className={`w-4 h-4 mb-1 ${activo ? 'text-teal-400' : subtle}`} />
              <p className="text-[11px] font-bold leading-tight">{o.label}</p>
              <p className={`text-[10px] mt-0.5 ${subtle}`}>+${o.precio.toLocaleString('es-CL')} c/u</p>
            </button>
          );
        })}
      </div>

      {/* Input según tipo */}
      {tipo === 'frase' && (
        <input
          value={texto}
          onChange={e => setTexto(e.target.value.slice(0, 25))}
          placeholder="Tu nombre, empresa o frase…"
          className={`w-full h-9 text-xs rounded-lg px-3 ${inputCls} focus:outline-none focus:ring-1 focus:ring-teal-400/50`}
        />
      )}
      {tipo === 'archivo' && (
        logoUrl ? (
          <div className="flex items-center gap-2 text-xs">
            <img src={logoUrl} alt="" className="w-9 h-9 rounded-lg object-contain bg-white/10" />
            <span className="text-teal-400 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Logo cargado</span>
            <button onClick={() => setLogoUrl('')} className={`ml-auto ${subtle} hover:opacity-70`}><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <label className={`flex items-center justify-center gap-2 ${inputCls} border-dashed rounded-lg py-3 cursor-pointer text-xs`}>
            {subiendo
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Subiendo…</>
              : <><Upload className="w-3.5 h-3.5" /> Sube tu logo (PNG, JPG, SVG)</>}
            <input type="file" accept="image/*,.svg" onChange={handleFile} disabled={subiendo} className="hidden" />
          </label>
        )
      )}

      <button
        onClick={() => onConfirm({ tipo, texto: texto.trim(), logoUrl })}
        disabled={!puedeConfirmar}
        className="w-full text-xs font-bold rounded-lg py-2 flex items-center justify-center gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Palette className="w-3.5 h-3.5" /> Agregar con personalización
      </button>
    </div>
  );
}