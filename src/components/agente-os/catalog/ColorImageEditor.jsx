import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Palette, Plus, X, Check, ImagePlus, Loader2, ChevronDown } from 'lucide-react';
import ProductImageUploader from './ProductImageUploader';
import { PEYU_COLORS } from '@/lib/color-parser';

// Editor de colores e imágenes embebido en ProductEditPanel.
// Permite al founder asignar MANUALMENTE qué foto corresponde a cada color,
// agregar/quitar colores y subir fotos nuevas — todo sin IA, 100% control.
export default function ColorImageEditor({ producto, onSaved }) {
  const [colores, setColores] = useState(Array.isArray(producto.colores) ? [...producto.colores] : []);
  const [mapa, setMapa] = useState(
    (producto.imagenes_por_color && typeof producto.imagenes_por_color === 'object')
      ? { ...producto.imagenes_por_color } : {}
  );
  const [pickingColor, setPickingColor] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const call = (action, payload) => base44.functions.invoke('catalogManager', { action, payload });

  const allImages = useMemo(() => {
    const set = new Set();
    if (producto.imagen_url?.startsWith('http')) set.add(producto.imagen_url);
    if (Array.isArray(producto.galeria_urls)) producto.galeria_urls.forEach((u) => u.startsWith('http') && set.add(u));
    Object.values(mapa).forEach((u) => typeof u === 'string' && u.startsWith('http') && set.add(u));
    return Array.from(set);
  }, [producto, mapa]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const asignar = async (color, url) => {
    setSaving(true);
    try {
      await call('setColorImage', { id: producto.id, color, imagen_url: url });
      setMapa((p) => ({ ...p, [color]: url }));
      setPickingColor(null);
      flash(`✓ ${color} asignado`);
      onSaved?.();
    } catch (e) { flash(e?.response?.data?.error || e.message); }
    setSaving(false);
  };

  const quitarImagen = async (color) => {
    setSaving(true);
    try {
      await call('removeColorImage', { id: producto.id, color });
      setMapa((p) => { const c = { ...p }; delete c[color]; return c; });
      flash(`✓ Imagen de ${color} quitada`);
      onSaved?.();
    } catch (e) { flash(e?.response?.data?.error || e.message); }
    setSaving(false);
  };

  const agregarColor = async (colorLabel) => {
    if (colores.includes(colorLabel)) { setShowColorPicker(false); return; }
    setSaving(true);
    try {
      const nuevos = [...colores, colorLabel];
      await call('setColores', { id: producto.id, colores: nuevos });
      setColores(nuevos);
      setShowColorPicker(false);
      flash(`✓ ${colorLabel} agregado`);
      onSaved?.();
    } catch (e) { flash(e?.response?.data?.error || e.message); }
    setSaving(false);
  };

  const quitarColor = async (color) => {
    if (!confirm(`¿Quitar el color "${color}" del producto?`)) return;
    setSaving(true);
    try {
      const nuevos = colores.filter((c) => c !== color);
      await call('setColores', { id: producto.id, colores: nuevos });
      setColores(nuevos);
      if (mapa[color]) {
        const newMapa = { ...mapa }; delete newMapa[color]; setMapa(newMapa);
        await call('removeColorImage', { id: producto.id, color }).catch(() => {});
      }
      flash(`✓ ${color} quitado`);
      onSaved?.();
    } catch (e) { flash(e?.response?.data?.error || e.message); }
    setSaving(false);
  };

  const hexFor = (label) => PEYU_COLORS.find((c) => c.label.toLowerCase() === String(label).toLowerCase())?.hex || '#ccc';

  return (
    <div className="rounded-xl border border-ld-border bg-ld-bg-soft/30 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-ld-fg-muted flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" /> Colores e imágenes ({colores.length})
        </span>
        <span className="text-[10px] text-ld-fg-subtle">Control manual · sin IA</span>
      </div>

      {msg && <p className="text-[11px] font-semibold text-ld-action bg-ld-action-soft/40 rounded px-2 py-1">{msg}</p>}

      {/* Lista de colores */}
      <div className="space-y-2">
        {colores.map((color) => {
          const imgUrl = mapa[color];
          const isPicking = pickingColor === color;
          return (
            <div key={color} className={`rounded-lg border-2 p-2 transition-colors ${isPicking ? 'border-ld-action bg-ld-action-soft/20' : 'border-ld-border/60 bg-ld-bg-soft/20'}`}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border border-ld-border flex-shrink-0" style={{ backgroundColor: hexFor(color) }} />
                <span className="text-xs font-semibold text-ld-fg flex-1 truncate">{color}</span>
                {imgUrl
                  ? <img src={imgUrl} alt={color} className="w-10 h-10 rounded-lg object-cover border border-ld-border flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-lg border border-dashed border-ld-border flex items-center justify-center flex-shrink-0"><ImagePlus className="w-3.5 h-3.5 text-ld-fg-subtle" /></div>}
                {imgUrl && <button onClick={() => quitarImagen(color)} disabled={saving} className="p-1 text-red-400 hover:bg-red-500/10 rounded" title="Quitar imagen"><X className="w-3 h-3" /></button>}
                <button onClick={() => setPickingColor(isPicking ? null : color)} disabled={saving} className={`px-2 py-1 rounded text-[10px] font-bold ${isPicking ? 'ld-btn-primary' : 'ld-btn-ghost text-ld-fg-soft'}`}>{imgUrl ? 'Cambiar' : 'Asignar'}</button>
                <button onClick={() => quitarColor(color)} disabled={saving} className="p-1 text-red-400 hover:bg-red-500/10 rounded" title="Quitar color"><X className="w-3 h-3" /></button>
              </div>
              {isPicking && (
                <div className="mt-2 rounded-lg border border-ld-action/40 bg-ld-bg-soft/40 p-2">
                  <p className="text-[10px] font-bold text-ld-action mb-1.5">Elige foto para "{color}"</p>
                  {allImages.length === 0
                    ? <p className="text-[10px] text-ld-fg-muted text-center py-2">Sin imágenes. Sube una abajo.</p>
                    : <div className="grid grid-cols-5 gap-1.5">
                        {allImages.map((url) => (
                          <button key={url} onClick={() => asignar(color, url)} disabled={saving} className="relative rounded-lg overflow-hidden border-2 border-ld-border hover:border-ld-action">
                            <img src={url} alt="" className="w-full aspect-square object-cover" />
                            {mapa[color] === url && <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-ld-action flex items-center justify-center"><Check className="w-2 h-2 text-white" strokeWidth={3} /></span>}
                          </button>
                        ))}
                      </div>}
                  <div className="mt-2 pt-2 border-t border-ld-border">
                    <ProductImageUploader onUploaded={(url) => asignar(color, url)} label="Subir foto para este color" size="sm" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Agregar color */}
      {showColorPicker ? (
        <div className="rounded-lg border border-ld-border bg-ld-bg-soft/40 p-2">
          <div className="flex flex-wrap gap-1.5">
            {PEYU_COLORS.filter((c) => !colores.includes(c.label)).map((c) => (
              <button key={c.id} onClick={() => agregarColor(c.label)} disabled={saving} className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border border-ld-border hover:border-ld-action text-ld-fg-soft">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} /> {c.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowColorPicker(false)} className="mt-2 text-[10px] text-ld-fg-muted hover:text-ld-fg">Cancelar</button>
        </div>
      ) : (
        <button onClick={() => setShowColorPicker(true)} disabled={saving} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-ld-border text-[11px] font-semibold text-ld-fg-muted hover:border-ld-action hover:text-ld-action transition-colors">
          <Plus className="w-3.5 h-3.5" /> Agregar color
        </button>
      )}

      {colores.length === 0 && !showColorPicker && (
        <p className="text-[10px] text-ld-fg-muted text-center py-1">Este producto no tiene colores cargados. Agrega colores para que el cliente pueda elegir en la tienda.</p>
      )}
    </div>
  );
}