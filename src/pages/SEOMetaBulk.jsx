import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles, Loader2, CheckCircle2, AlertCircle, Search, Wand2, Save, RefreshCw,
} from 'lucide-react';
import SEOSuggestionRow from '@/components/seo-bulk/SEOSuggestionRow';

/**
 * SEOMetaBulk
 * ------------
 * Pantalla admin para generar y aplicar meta-tags SEO con IA en masa.
 * Flujo: configurar filtros → Generar preview con IA → revisar/editar → Aplicar.
 */
export default function SEOMetaBulk() {
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState({}); // { [id]: true }
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setSuggestions([]);
    setSelected({});
    try {
      const res = await base44.functions.invoke('generateSEOMetaBulk', {
        action: 'preview',
        only_missing: onlyMissing,
        limit,
      });
      const list = res?.data?.suggestions || [];
      setSuggestions(list);
      // Seleccionar todos por defecto
      const sel = {};
      list.forEach(s => { sel[s.id] = true; });
      setSelected(sel);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const updateSuggestion = (id, patch) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const handleApply = async () => {
    const toApply = suggestions.filter(s => selected[s.id] && s.meta_title && s.meta_description);
    if (toApply.length === 0) {
      setResult({ error: 'Selecciona al menos un producto para aplicar.' });
      return;
    }
    setApplying(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('generateSEOMetaBulk', {
        action: 'apply',
        suggestions: toApply.map(s => ({
          id: s.id,
          meta_title: s.meta_title,
          meta_description: s.meta_description,
          focus_keyword: s.focus_keyword,
        })),
      });
      setResult(res?.data || { ok: true });
      if (res?.data?.ok) {
        // Limpiar las sugerencias aplicadas
        const appliedIds = new Set(toApply.map(s => s.id));
        setSuggestions(prev => prev.filter(s => !appliedIds.has(s.id)));
        setSelected({});
      }
    } catch (e) {
      setResult({ error: e.message });
    }
    setApplying(false);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return suggestions;
    return suggestions.filter(s =>
      s.nombre?.toLowerCase().includes(q) || s.sku?.toLowerCase().includes(q)
    );
  }, [suggestions, search]);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const allSelected = suggestions.length > 0 && selectedCount === suggestions.length;
  const toggleAll = () => {
    if (allSelected) setSelected({});
    else {
      const sel = {};
      suggestions.forEach(s => { sel[s.id] = true; });
      setSelected(sel);
    }
  };

  return (
    <div className="min-h-screen p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-poppins font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-violet-400" />
            SEO Meta Tags · Generación Masiva
          </h1>
          <p className="text-white/60 text-xs lg:text-sm mt-1">
            La IA analiza título, descripción y categoría de cada producto activo y genera meta-títulos
            (50-60 chars) y meta-descriptions (150-160 chars) optimizados. Revisá y aplicá en un click.
          </p>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-white/80">
          <input
            type="checkbox"
            checked={onlyMissing}
            onChange={e => setOnlyMissing(e.target.checked)}
            className="accent-violet-500 w-4 h-4"
          />
          Sólo productos sin meta tags
        </label>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-white/50">Máx. a procesar</label>
          <Input
            type="number"
            value={limit}
            onChange={e => setLimit(Math.max(1, Math.min(100, parseInt(e.target.value) || 25)))}
            className="w-24 h-9 bg-white/5 border-white/10 text-white"
            min={1}
            max={100}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {loading ? 'Generando con IA…' : 'Generar sugerencias'}
        </Button>

        {suggestions.length > 0 && (
          <Button
            onClick={handleApply}
            disabled={applying || selectedCount === 0}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white ml-auto"
          >
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Aplicar a {selectedCount} producto{selectedCount === 1 ? '' : 's'}
          </Button>
        )}
      </div>

      {/* Resultado */}
      {result && (
        <div className={`px-4 py-3 rounded-xl border flex items-start gap-2 text-sm ${
          result.error
            ? 'bg-rose-500/10 border-rose-400/30 text-rose-300'
            : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
        }`}>
          {result.error
            ? <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            : <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <div>
            {result.error
              ? <>Error: {result.error}</>
              : <>✓ {result.applied || 0} producto{result.applied === 1 ? '' : 's'} actualizado{result.applied === 1 ? '' : 's'} con meta tags SEO.
                  {result.errors?.length > 0 && <> · {result.errors.length} con error.</>}</>
            }
          </div>
        </div>
      )}

      {/* Lista */}
      {suggestions.length > 0 && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filtrar por SKU o nombre…"
                className="pl-9 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <button
              onClick={toggleAll}
              className="text-xs text-white/70 hover:text-white px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10"
            >
              {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'} ({selectedCount}/{suggestions.length})
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="text-xs text-white/70 hover:text-white px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Re-generar
            </button>
          </div>

          <div className="space-y-2">
            {filtered.map(s => (
              <SEOSuggestionRow
                key={s.id}
                suggestion={s}
                selected={!!selected[s.id]}
                onToggle={() => setSelected(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                onChange={(patch) => updateSuggestion(s.id, patch)}
              />
            ))}
          </div>
        </>
      )}

      {!loading && suggestions.length === 0 && !result && (
        <div className="text-center py-16 text-white/50">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Configurá los filtros y presioná <strong className="text-white/80">Generar sugerencias</strong> para que la IA cree los meta tags.</p>
        </div>
      )}
    </div>
  );
}