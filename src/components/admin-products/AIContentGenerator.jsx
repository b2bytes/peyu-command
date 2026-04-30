import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Check, Copy, ShieldCheck, Target, Ruler } from 'lucide-react';
import { KEYWORD_CLUSTERS } from '@/lib/seo-catalog';

/**
 * AIContentGenerator — Mejora de descripción de producto con IA.
 *
 * Lógica clave:
 * 1. LONGITUD ALINEADA: la nueva descripción mantiene aprox. ±15% de la
 *    cantidad de caracteres de la descripción actual (cuando existe).
 *    Si no hay descripción previa, apunta al rango Merchant Center
 *    recomendado (500–1500 chars).
 * 2. KEYWORDS PEYU: inyecta las 6 keywords del cluster que mejor calza
 *    con la categoría/canal del producto + 2 keywords técnicas.
 * 3. GOOGLE MERCHANT CENTER COMPLIANT:
 *    - Sin claims prohibidos ("el mejor", "100% garantizado", "milagroso")
 *    - Sin promociones/precios/CTA en la descripción (van en otros campos)
 *    - Sin URLs ni teléfonos ni emojis
 *    - Sin mayúsculas excesivas / signos repetidos
 *    - Foco en atributos del producto (material, dimensiones, uso, garantía)
 */
export default function AIContentGenerator({ producto, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── 1. Longitud objetivo ──────────────────────────────────────────
  const targetLength = useMemo(() => {
    const current = (producto.descripcion || '').trim().length;
    if (current === 0) {
      // Sin descripción previa → apuntar a sweet spot Merchant Center
      return { min: 500, max: 1200, source: 'merchant_default' };
    }
    // ±15% de la longitud actual, con mínimos de seguridad
    const min = Math.max(300, Math.round(current * 0.85));
    const max = Math.max(min + 150, Math.round(current * 1.15));
    return { min, max, source: 'current' };
  }, [producto.descripcion]);

  // ── 2. Keywords PEYU según categoría/canal ────────────────────────
  const keywordsForProduct = useMemo(() => {
    const cat = (producto.categoria || '').toLowerCase();
    const canal = (producto.canal || '').toLowerCase();
    let cluster = KEYWORD_CLUSTERS.coreB2B;
    if (cat.includes('corporativo') || canal.includes('b2b')) cluster = KEYWORD_CLUSTERS.coreB2B;
    else if (cat.includes('escritorio')) cluster = KEYWORD_CLUSTERS.rrhh;
    else if (cat.includes('hogar')) cluster = KEYWORD_CLUSTERS.coreB2B;
    else if (cat.includes('entretenimiento')) cluster = KEYWORD_CLUSTERS.eventos;
    else if (cat.includes('carcasa')) cluster = KEYWORD_CLUSTERS.tecnica;
    // Mezcla: 4 del cluster + 2 técnicas (siempre relevantes)
    return [...cluster.slice(0, 4), ...KEYWORD_CLUSTERS.tecnica.slice(0, 2)];
  }, [producto.categoria, producto.canal]);

  const generar = async () => {
    setLoading(true);
    setDraft('');
    try {
      const isCompostable = (producto.material || '').toLowerCase().includes('trigo');
      const materialDescriptivo = isCompostable
        ? 'fibra de trigo compostable (origen agrícola, biodegradable)'
        : 'plástico 100% reciclado post-consumo (origen Chile, economía circular)';

      const prompt = `Eres copywriter senior SEO de PEYU Chile (peyuchile.cl), marca chilena de productos sostenibles. Vas a redactar la descripción comercial de un producto que será publicada en la ficha pública del sitio Y enviada al feed de Google Merchant Center, por lo que debe cumplir las políticas de Google Shopping.

═══════════════════════════════════
PRODUCTO
═══════════════════════════════════
- Nombre: ${producto.nombre}
- SKU: ${producto.sku}
- Categoría: ${producto.categoria}
- Material: ${materialDescriptivo}
- Canal de venta: ${producto.canal}
- Garantía: ${producto.garantia_anios || 10} años
- Personalización láser UV gratis desde ${producto.personalizacion_gratis_desde || 10} unidades
${producto.area_laser_mm ? `- Área de grabado láser: ${producto.area_laser_mm} mm` : ''}
${producto.precio_b2c ? `- Precio referencial B2C: $${producto.precio_b2c.toLocaleString('es-CL')} CLP` : ''}

═══════════════════════════════════
DESCRIPCIÓN ACTUAL (${(producto.descripcion || '').trim().length} chars) — ÚSALA COMO BASE Y MEJÓRALA
═══════════════════════════════════
${producto.descripcion?.trim() || '(El producto no tiene descripción previa. Crea una desde cero respetando los requisitos.)'}

═══════════════════════════════════
LONGITUD OBJETIVO (CRÍTICO)
═══════════════════════════════════
La nueva descripción debe tener entre ${targetLength.min} y ${targetLength.max} caracteres ${
        targetLength.source === 'current'
          ? '(mantenemos ±15% del largo actual para preservar el ritmo editorial del catálogo).'
          : '(rango óptimo Google Merchant Center para fichas de producto).'
      } Cuenta los caracteres antes de devolver el texto.

═══════════════════════════════════
KEYWORDS PEYU A INTEGRAR (SEO)
═══════════════════════════════════
Integra naturalmente, sin keyword stuffing, AL MENOS 4 de las siguientes frases (puedes flexionarlas/conjugarlas):
${keywordsForProduct.map(k => `• ${k}`).join('\n')}

═══════════════════════════════════
POLÍTICAS GOOGLE MERCHANT CENTER (OBLIGATORIO CUMPLIR)
═══════════════════════════════════
✓ DEBE: Describir SOLO el producto (qué es, de qué está hecho, cómo se usa, qué incluye, dimensiones si aplican).
✓ DEBE: Tono profesional, oraciones completas, ortografía perfecta en español de Chile.
✓ DEBE: Mencionar atributos verificables del producto (material, garantía, personalización).

✗ NO incluyas: precios, ofertas, descuentos, "envío gratis", códigos de cupón.
✗ NO incluyas: URLs, dominios, teléfonos, emails, redes sociales, CTAs ("compra ahora", "haz clic").
✗ NO incluyas: emojis, símbolos decorativos, listas con bullets, markdown (**, #, -, *).
✗ NO incluyas: claims absolutos prohibidos ("el mejor", "el único", "100% garantizado", "milagroso", "exclusivo").
✗ NO incluyas: comparaciones con competidores ni menciones de otras marcas.
✗ NO incluyas: MAYÚSCULAS sostenidas, signos repetidos (!!!, ???), capitalización ALL CAPS.
✗ NO incluyas: información de stock, disponibilidad, plazos de entrega, métodos de pago.

═══════════════════════════════════
ESTRUCTURA RECOMENDADA
═══════════════════════════════════
Párrafo 1 — Qué es y de qué material: nombre del producto, función principal, material reciclado/compostable, fabricación en Chile.
Párrafo 2 — Atributos y experiencia de uso: durabilidad, garantía, contexto de uso (escritorio/hogar/oficina), personalización láser UV disponible para empresas.
Párrafo 3 — Propuesta sostenible y casos de uso B2B: economía circular, idoneidad para regalos corporativos, kits de bienvenida, gifting empresarial.

Separa los párrafos con UNA línea en blanco. Texto plano. Sin títulos. Sin firma.

═══════════════════════════════════
DEVUELVE
═══════════════════════════════════
SOLO el texto plano de la descripción, listo para copiar-pegar en el feed de Merchant Center y en la ficha de peyuchile.cl. Nada más.`;

      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      const text = (typeof res === 'string' ? res : String(res)).trim();
      setDraft(text);
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

  // Validación visual del borrador (UX para detectar incumplimientos)
  const draftStats = useMemo(() => {
    if (!draft) return null;
    const chars = draft.length;
    const inRange = chars >= targetLength.min && chars <= targetLength.max;
    const hasEmoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(draft);
    const hasUrl = /(https?:\/\/|www\.)/i.test(draft);
    const hasPhone = /\+?56\s?9?\s?\d{4}\s?\d{4}/.test(draft);
    const hasPrice = /\$\s?\d|CLP|clp/.test(draft);
    const hasAllCaps = /\b[A-ZÁÉÍÓÚÑ]{6,}\b/.test(draft);
    const hasBangs = /(!{2,}|\?{2,})/.test(draft);
    const kwHits = keywordsForProduct.filter(kw =>
      draft.toLowerCase().includes(kw.toLowerCase().split(' ').slice(0, 2).join(' '))
    ).length;
    return {
      chars,
      inRange,
      hasEmoji,
      hasUrl,
      hasPhone,
      hasPrice,
      hasAllCaps,
      hasBangs,
      kwHits,
      compliant: !hasEmoji && !hasUrl && !hasPhone && !hasPrice && !hasAllCaps && !hasBangs,
    };
  }, [draft, targetLength, keywordsForProduct]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-poppins font-semibold text-white text-sm">Descripción del producto</h3>
          <p className="text-xs text-white/50 mt-0.5">
            IA · Alineada al largo actual · Keywords PEYU · Google Merchant compliant
          </p>
        </div>
        <Button
          onClick={generar}
          disabled={loading}
          size="sm"
          className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {producto.descripcion ? 'Mejorar con IA' : 'Generar con IA'}
        </Button>
      </div>

      {/* Briefing IA — qué considerará */}
      <div className="grid grid-cols-3 gap-2">
        <BriefCard
          icon={Ruler}
          label="Largo objetivo"
          value={`${targetLength.min}–${targetLength.max} chars`}
          hint={
            targetLength.source === 'current'
              ? `±15% del actual (${(producto.descripcion || '').length})`
              : 'Rango óptimo Merchant'
          }
        />
        <BriefCard
          icon={Target}
          label="Keywords PEYU"
          value={`${keywordsForProduct.length} frases`}
          hint="Categoría + técnicas"
        />
        <BriefCard
          icon={ShieldCheck}
          label="Compliance"
          value="Merchant"
          hint="Sin claims, sin precios"
        />
      </div>

      {/* Descripción actual (referencia) */}
      {producto.descripcion && !draft && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wider text-white/40">Descripción actual</p>
            <span className="text-[10px] font-mono text-white/40">
              {producto.descripcion.length} chars
            </span>
          </div>
          <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
            {producto.descripcion}
          </p>
        </div>
      )}

      {/* Borrador IA + validador en vivo */}
      {draft && (
        <div className="bg-violet-500/10 border border-violet-400/30 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-violet-300 font-bold">
              Borrador IA
            </p>
            <button
              onClick={copy}
              className="text-xs text-white/60 hover:text-white flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-48 bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white/90 leading-relaxed resize-none"
          />

          {/* Validador */}
          {draftStats && (
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <ValidationBadge
                ok={draftStats.inRange}
                label={`${draftStats.chars} chars · objetivo ${targetLength.min}–${targetLength.max}`}
              />
              <ValidationBadge
                ok={draftStats.kwHits >= 4}
                label={`${draftStats.kwHits}/${keywordsForProduct.length} keywords PEYU`}
              />
              <ValidationBadge ok={!draftStats.hasEmoji} label="Sin emojis" />
              <ValidationBadge ok={!draftStats.hasUrl} label="Sin URLs" />
              <ValidationBadge ok={!draftStats.hasPhone} label="Sin teléfonos" />
              <ValidationBadge ok={!draftStats.hasPrice} label="Sin precios" />
              <ValidationBadge ok={!draftStats.hasAllCaps} label="Sin ALL CAPS" />
              <ValidationBadge ok={!draftStats.hasBangs} label="Sin signos repetidos" />
            </div>
          )}

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

function BriefCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/50 mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-sm font-poppins font-bold text-white truncate">{value}</div>
      <div className="text-[10px] text-white/40 truncate">{hint}</div>
    </div>
  );
}

function ValidationBadge({ ok, label }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full font-medium ${
        ok
          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
          : 'bg-rose-500/15 text-rose-300 border border-rose-400/30'
      }`}
    >
      {ok ? '✓' : '✗'} {label}
    </span>
  );
}