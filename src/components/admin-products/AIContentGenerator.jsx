import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Check, Copy } from 'lucide-react';

/**
 * Genera descripción de producto SEO-friendly usando InvokeLLM.
 * No modifica nada hasta que el usuario haga click en "Guardar".
 */
export default function AIContentGenerator({ producto, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const generar = async () => {
    setLoading(true);
    setDraft('');
    try {
      const prompt = `Eres copywriter senior de PEYU Chile, marca chilena de productos sostenibles hechos con plástico 100% reciclado y fibra de trigo compostable.

Genera una descripción comercial para este producto, pensada tanto para B2C como B2B:

PRODUCTO:
- Nombre: ${producto.nombre}
- SKU: ${producto.sku}
- Categoría: ${producto.categoria}
- Material: ${producto.material}
- Canal: ${producto.canal}
- Garantía: ${producto.garantia_anios || 10} años
- Personalización láser gratis desde ${producto.personalizacion_gratis_desde || 10} unidades
${producto.area_laser_mm ? `- Área láser: ${producto.area_laser_mm} mm` : ''}

REQUISITOS:
1. 3 párrafos cortos (máx 60 palabras cada uno)
2. Tono cálido, profesional, foco en sostenibilidad y calidad
3. Mencionar el material y la durabilidad sin sonar técnico
4. Tercer párrafo: invitar a personalizar para regalos corporativos
5. NO uses emojis, NO uses markdown, NO uses listas
6. Devuelve SOLO el texto plano, listo para publicar`;

      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setDraft(typeof res === 'string' ? res.trim() : String(res).trim());
    } catch (e) {
      setDraft('Error al generar contenido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const guardar = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await base44.entities.Producto.update(producto.id, { descripcion: draft });
      onSaved?.(draft);
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-poppins font-semibold text-white text-sm">Descripción del producto</h3>
          <p className="text-xs text-white/50 mt-0.5">Generada con IA · SEO friendly · 3 párrafos</p>
        </div>
        <Button
          onClick={generar}
          disabled={loading}
          size="sm"
          className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {producto.descripcion ? 'Re-generar' : 'Generar con IA'}
        </Button>
      </div>

      {producto.descripcion && !draft && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Descripción actual</p>
          <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{producto.descripcion}</p>
        </div>
      )}

      {draft && (
        <div className="bg-violet-500/10 border border-violet-400/30 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-violet-300 font-bold">Borrador IA</p>
            <button onClick={copy} className="text-xs text-white/60 hover:text-white flex items-center gap-1">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-40 bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white/90 leading-relaxed resize-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={guardar}
              disabled={saving}
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar en producto
            </Button>
            <Button
              onClick={() => setDraft('')}
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Descartar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}