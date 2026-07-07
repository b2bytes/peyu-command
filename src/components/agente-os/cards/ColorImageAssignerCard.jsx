import { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Palette, Search, ChevronDown, ChevronRight, Loader2, RefreshCw,
  Check, X, ImagePlus, Upload, AlertCircle,
} from 'lucide-react';
import ProductImageUploader from '../catalog/ProductImageUploader';
import { getColoresProducto } from '@/lib/color-parser';

const CATEGORIAS = ['Todas', 'Carcasas B2C', 'Escritorio', 'Hogar', 'Entretenimiento', 'Corporativo'];

// Recoge TODAS las URLs de imagen disponibles para un producto:
// imagen principal + galería + imágenes ya asignadas por color.
function getAllImageUrls(producto) {
  const set = new Set();
  if (producto.imagen_url && typeof producto.imagen_url === 'string') set.add(producto.imagen_url);
  if (Array.isArray(producto.galeria_urls)) {
    producto.galeria_urls.forEach((u) => { if (typeof u === 'string' && u.startsWith('http')) set.add(u); });
  }
  if (producto.imagenes_por_color && typeof producto.imagenes_por_color === 'object') {
    Object.values(producto.imagenes_por_color).forEach((u) => { if (typeof u === 'string' && u.startsWith('http')) set.add(u); });
  }
  return Array.from(set);
}

// Tarjeta del Agente OS para asignar MANUALMENTE qué foto corresponde a cada
// color del producto. Reemplaza el matching por IA (que se equivoca en 1-2 de
// cada 4 colores) por control total del founder: ve todas las imágenes
// disponibles, hace click, listo.
export default function ColorImageAssignerCard() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoria, setCategoria] = useState('Carcasas B2C');
  const [expandedId, setExpandedId] = useState(null);
  const [pickingForColor, setPickingForColor] = useState(null); // { productoId, color }
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('catalogManager', { action: 'list', payload: { categoria } });
      setProductos(res?.data?.productos || []);
    } finally {
      setLoading(false);
    }
  }, [categoria]);

  useEffect(() => { cargar(); }, [cargar]);

  // Solo productos que tienen colores reales (parseados o explícitos).
  const visibles = useMemo(() => {
    return productos.filter((p) => {
      const colores = getColoresProducto(p);
      if (colores.length === 0) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (p.nombre || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
    });
  }, [productos, query]);

  const call = (action, payload) => base44.functions.invoke('catalogManager', { action, payload });

  const asignar = async (productoId, color, imagenUrl) => {
    setSaving(true);
    setMsg('');
    try {
      await call('setColorImage', { id: productoId, color, imagen_url: imagenUrl });
      // Refresca el producto en el estado local (sin recargar todo).
      setProductos((prev) => prev.map((p) => {
        if (p.id !== productoId) return p;
        const mapa = (p.imagenes_por_color && typeof p.imagenes_por_color === 'object') ? { ...p.imagenes_por_color } : {};
        mapa[color] = imagenUrl;
        return { ...p, imagenes_por_color: mapa };
      }));
      setPickingForColor(null);
      setMsg(`✓ ${color} asignado`);
      setTimeout(() => setMsg(''), 2500);
    } catch (e) {
      setMsg(e?.response?.data?.error || e.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const quitar = async (productoId, color) => {
    setSaving(true);
    try {
      await call('removeColorImage', { id: productoId, color });
      setProductos((prev) => prev.map((p) => {
        if (p.id !== productoId) return p;
        const mapa = (p.imagenes_por_color && typeof p.imagenes_por_color === 'object') ? { ...p.imagenes_por_color } : {};
        delete mapa[color];
        return { ...p, imagenes_por_color: mapa };
      }));
      setMsg(`✓ ${color} quitado`);
      setTimeout(() => setMsg(''), 2500);
    } catch (e) {
      setMsg(e?.response?.data?.error || e.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Palette className="w-4 h-4 text-ld-action" />
          </span>
          <div>
            <span className="text-sm font-semibold text-ld-fg block leading-tight">Asignar imagen por color</span>
            <span className="text-[10px] text-ld-fg-muted">Control manual · sin IA</span>
          </div>
        </div>
        <button onClick={cargar} className="w-8 h-8 rounded-lg hover:bg-ld-bg-elevated flex items-center justify-center text-ld-fg-muted" title="Refrescar">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ld-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o SKU…"
            className="w-full bg-ld-bg-soft/60 border border-ld-border rounded-full pl-9 pr-3 py-1.5 text-sm text-ld-fg focus:outline-none focus:border-ld-action"
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
        {CATEGORIAS.map((c) => (
          <button
            key={c}
            onClick={() => setCategoria(c)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${categoria === c ? 'ld-btn-primary' : 'ld-btn-ghost text-ld-fg-soft'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Estado de guardado */}
      {msg && (
        <div className="mb-2 text-xs font-semibold text-ld-action bg-ld-action-soft/50 rounded-lg px-3 py-1.5">
          {msg}
        </div>
      )}

      {/* Lista de productos */}
      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-ld-fg-muted">
          <Loader2 className="w-4 h-4 animate-spin" /> <span className="text-sm">Cargando catálogo…</span>
        </div>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-ld-fg-muted py-4 text-center">
          No hay productos con colores en esta categoría.
        </p>
      ) : (
        <div className="space-y-1.5">
          {visibles.map((p) => {
            const colores = getColoresProducto(p);
            const imagenes = getAllImageUrls(p);
            const mapa = (p.imagenes_por_color && typeof p.imagenes_por_color === 'object') ? p.imagenes_por_color : {};
            const asignados = colores.filter((c) => mapa[c.label] || mapa[c.id]);
            const expandido = expandedId === p.id;

            return (
              <div key={p.id} className="rounded-xl border border-ld-border bg-ld-bg-soft/40 overflow-hidden">
                {/* Fila del producto */}
                <button
                  onClick={() => { setExpandedId(expandido ? null : p.id); setPickingForColor(null); }}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-ld-bg-elevated/40 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-ld-bg-elevated overflow-hidden flex-shrink-0 border border-ld-border">
                    {p.imagen_url
                      ? <img src={p.imagen_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-ld-fg-subtle"><Palette className="w-4 h-4" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ld-fg truncate">{p.nombre}</div>
                    <div className="text-[11px] text-ld-fg-muted">
                      {p.sku} · {colores.length} colores · {asignados.length}/{colores.length} con foto
                    </div>
                  </div>
                  {asignados.length < colores.length && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-ld-highlight bg-ld-highlight-soft/40 px-2 py-0.5 rounded-full flex-shrink-0">
                      <AlertCircle className="w-3 h-3" /> {colores.length - asignados.length} sin foto
                    </span>
                  )}
                  {expandido
                    ? <ChevronDown className="w-4 h-4 text-ld-fg-muted flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-ld-fg-muted flex-shrink-0" />}
                </button>

                {/* Panel expandido: asignación color → imagen */}
                {expandido && (
                  <div className="border-t border-ld-border p-3 space-y-3">
                    {/* Grid de colores */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {colores.map((c) => {
                        const imgUrl = mapa[c.label] || mapa[c.id];
                        const isPicking = pickingForColor?.productoId === p.id && (pickingForColor?.color === c.label || pickingForColor?.color === c.id);
                        return (
                          <div
                            key={c.id}
                            className={`rounded-xl border-2 p-2.5 transition-colors ${
                              isPicking
                                ? 'border-ld-action bg-ld-action-soft/30'
                                : imgUrl
                                  ? 'border-ld-border/60 bg-ld-bg-soft/30'
                                  : 'border-dashed border-ld-border bg-ld-bg-soft/20'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Swatch del color */}
                              <div className="w-7 h-7 rounded-full border border-ld-border flex-shrink-0" style={{ backgroundColor: c.hex || '#ccc' }} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-ld-fg truncate">{c.label}</p>
                                <p className="text-[10px] text-ld-fg-muted">{imgUrl ? '✓ Foto asignada' : 'Sin foto'}</p>
                              </div>
                              {/* Imagen asignada actual */}
                              {imgUrl ? (
                                <div className="relative flex-shrink-0">
                                  <img src={imgUrl} alt={c.label} className="w-12 h-12 rounded-lg object-cover border border-ld-border" />
                                  {isPicking && (
                                    <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-ld-action flex items-center justify-center">
                                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-lg border border-dashed border-ld-border bg-ld-bg-soft/40 flex items-center justify-center flex-shrink-0">
                                  <ImagePlus className="w-4 h-4 text-ld-fg-subtle" />
                                </div>
                              )}
                            </div>
                            {/* Acciones del color */}
                            <div className="flex items-center gap-1.5 mt-2">
                              <button
                                onClick={() => setPickingForColor(isPicking ? null : { productoId: p.id, color: c.label })}
                                disabled={saving}
                                className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 ${
                                  isPicking ? 'ld-btn-primary' : 'ld-btn-ghost text-ld-fg-soft'
                                }`}
                              >
                                {isPicking ? <Check className="w-3 h-3" /> : <ImagePlus className="w-3 h-3" />}
                                {isPicking ? 'Listo · elige foto abajo' : imgUrl ? 'Cambiar' : 'Asignar'}
                              </button>
                              {imgUrl && (
                                <button
                                  onClick={() => quitar(p.id, c.label)}
                                  disabled={saving}
                                  className="inline-flex items-center justify-center px-2 py-1.5 rounded-lg text-[11px] font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                                  title="Quitar asignación"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pool de imágenes disponibles — aparece cuando hay un color seleccionado */}
                    {pickingForColor?.productoId === p.id && (
                      <div className="rounded-xl border border-ld-action/40 bg-ld-bg-soft/40 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-ld-action">
                            Elige la foto para "{pickingForColor.color}"
                          </p>
                          <button
                            onClick={() => setPickingForColor(null)}
                            className="text-[11px] text-ld-fg-muted hover:text-ld-fg"
                          >
                            Cancelar
                          </button>
                        </div>
                        {imagenes.length === 0 ? (
                          <p className="text-xs text-ld-fg-muted text-center py-3">
                            No hay imágenes subidas para este producto. Sube una abajo.
                          </p>
                        ) : (
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                            {imagenes.map((url) => {
                              const enUso = colores.some((c) => (mapa[c.label] || mapa[c.id]) === url);
                              return (
                                <button
                                  key={url}
                                  onClick={() => asignar(p.id, pickingForColor.color, url)}
                                  disabled={saving}
                                  className="relative group rounded-lg overflow-hidden border-2 border-ld-border hover:border-ld-action transition-colors disabled:opacity-50"
                                >
                                  <img src={url} alt="" className="w-full aspect-square object-cover" />
                                  {enUso && (
                                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-ld-action flex items-center justify-center">
                                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                    </span>
                                  )}
                                  <span className="absolute inset-0 bg-ld-action/0 group-hover:bg-ld-action/20 transition-colors flex items-center justify-center">
                                    <Check className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg" strokeWidth={3} />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {/* Subir imagen nueva directamente al color */}
                        <div className="mt-2.5 pt-2.5 border-t border-ld-border">
                          <ProductImageUploader
                            onUploaded={(url) => asignar(p.id, pickingForColor.color, url)}
                            label="Subir foto nueva para este color"
                            size="sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Nota educativa */}
      <p className="text-[11px] text-ld-fg-muted mt-3 leading-relaxed">
        💡 Esta herramienta reemplaza el matching automático por IA. Asigna la foto correcta a cada color con un click —
        el cliente verá la imagen exacta al elegir el color en la tienda.
      </p>
    </div>
  );
}