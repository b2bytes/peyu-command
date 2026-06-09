import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Upload, X, Loader2, Check } from 'lucide-react';
import { detectMockupType, MOCKUP_UI_CONFIG } from '@/lib/mockup-types';
import DisenosPeyuPicker from '@/components/personalizacion/DisenosPeyuPicker';

export default function MockupGenerator({
  open,
  onOpenChange,
  productName,
  productCategory,
  productSku,
  productImageUrl,
  initialText = '',
  initialColor = '',
  initialResultUrl = '',   // ← nuevo: muestra el mockup ya generado al re-abrir
  onGenerated,
  onLogoUploaded,
}) {
  const mockupType = useMemo(
    () => detectMockupType({ sku: productSku, nombre: productName }),
    [productSku, productName]
  );
  const config = MOCKUP_UI_CONFIG[mockupType] || MOCKUP_UI_CONFIG.logo;

  const [text, setText] = useState(initialText);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setText(initialText);
      setLogoUrl('');
      // Si ya hay un mockup generado, mostrarlo — no borrarlo
      setResultUrl(initialResultUrl || '');
      setError('');
    }
  }, [open]); // eslint-disable-line

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo supera 10MB.');
      return;
    }
    setError('');
    setLogoUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      const url = res.file_url || '';
      setLogoUrl(url);
      // 🎨 Propagamos el archivo subido al pedido APENAS se sube — sin esperar a
      // que el cliente genere el mockup IA. Garantiza que el logo SIEMPRE quede
      // guardado y visible en el panel interno, aunque cierre el modal sin generar.
      if (url) onLogoUploaded?.(url);
    } catch (err) {
      setError('No se pudo subir el archivo. Intenta de nuevo.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (config.fileRequired && !logoUrl) {
      setError(`Necesitas subir ${config.fileLabel.toLowerCase()} para continuar.`);
      return;
    }
    if (!config.fileRequired && !text.trim() && !logoUrl) {
      setError('Escribe un texto o sube tu logo.');
      return;
    }
    setError('');
    setGenerating(true);
    setResultUrl('');
    try {
      const res = await base44.functions.invoke('generateMockup', {
        productName,
        productCategory,
        sku: productSku,
        productImageUrl,
        logoUrl: logoUrl || null,
        text: text || null,
        color: initialColor || null,
        mockupType,
      });
      const url = res.data?.mockup_url;
      const ok = res.data?.success !== false && !res.data?.fallback;
      if (!url || !ok) {
        throw new Error(res.data?.error || 'No pudimos generar el mockup ahora. Intenta de nuevo en unos segundos.');
      }
      setResultUrl(url);
      onGenerated?.(url, { texto: text, logoUrl });
    } catch (err) {
      setError(err.message || 'Error al generar el mockup.');
    } finally {
      setGenerating(false);
    }
  };

  if (mockupType === 'none') return null;

  // ✅ Item G · El cliente "acepta" el mockup generado → cierra el modal
  // conservando el resultado (ya se propagó vía onGenerated al generarlo).
  const handleAccept = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[92vw] max-w-lg max-h-[90vh] overflow-y-auto peyu-scrollbar bg-slate-900 border-white/15 text-white p-4 sm:p-6 pb-24 sm:pb-6">
        {/* Botón X siempre visible (item G) — el DialogContent de shadcn ya
            incluye una X, pero la reforzamos accesible en móvil arriba-derecha. */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-poppins">
            <span className="text-xl">{config.icon}</span> {config.title}
          </DialogTitle>
          <DialogDescription className="text-white/60 text-sm">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Texto */}
          {config.showText && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80">{config.inputLabel}</label>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 40))}
                placeholder={config.inputPlaceholder}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl"
              />
            </div>
          )}

          {/* Archivo */}
          {config.showFile && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80">
                {config.fileLabel}{config.fileRequired && <span className="text-red-400 ml-1">*</span>}
              </label>
              {logoUrl ? (
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl p-3">
                  <img src={logoUrl} alt="Subido" className="w-12 h-12 object-contain rounded-lg bg-white/5" />
                  <div className="flex-1 text-xs">
                    <p className="text-green-400 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Archivo cargado</p>
                    <p className="text-white/40">Listo para generar</p>
                  </div>
                  <button
                    onClick={() => setLogoUrl('')}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/25 rounded-xl py-6 cursor-pointer transition-colors">
                  {logoUploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> <span className="text-sm">Subiendo...</span></>
                  ) : (
                    <><Upload className="w-4 h-4 text-white/60" /> <span className="text-sm text-white/60">{config.fileHint}</span></>
                  )}
                  <input
                    type="file"
                    accept="image/*,.svg"
                    onChange={handleFileUpload}
                    disabled={logoUploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* C3 · Galería de diseños PEYU — solo para grabado láser (logo) */}
          {mockupType === 'logo' && (
            <DisenosPeyuPicker selectedUrl={logoUrl} onSelect={(url) => { setLogoUrl(url); setError(''); if (url) onLogoUploaded?.(url); }} />
          )}

          {error && (
            <div className="text-xs font-semibold text-red-300 bg-red-500/15 border border-red-400/30 rounded-xl p-3">
              {error}
            </div>
          )}

          {/* Resultado */}
          {resultUrl && (
            <div className="rounded-xl overflow-hidden border border-purple-400/40 bg-black/30">
              <img src={resultUrl} alt="Mockup generado" className="w-full max-h-[40vh] object-contain mx-auto" />
              <p className="text-[10px] text-white/60 text-center py-1.5 bg-purple-500/20">
                ✨ Mockup generado con IA · referencial
              </p>
            </div>
          )}

          {/* Botón generar */}
          <Button
            onClick={handleGenerate}
            disabled={generating || logoUploading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl h-11 gap-2"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generando mockup...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {resultUrl ? 'Regenerar mockup' : 'Generar mockup con IA'}</>
            )}
          </Button>

          <p className="text-[10px] text-white/40 text-center">
            La generación toma 5-10 segundos. El mockup es referencial — el resultado final puede variar ligeramente.
          </p>
        </div>

        {/* ✅ Item G · Barra de acción STICKY en móvil cuando hay mockup generado.
            "Aceptar mockup" (cierra conservando el resultado) + "Regenerar". En
            desktop también aparece, anclada al fondo del modal. */}
        {resultUrl && (
          <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-24 sm:-mb-6 px-4 sm:px-6 py-3 bg-slate-900/95 backdrop-blur border-t border-white/15 flex items-center gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button
              onClick={handleGenerate}
              disabled={generating || logoUploading}
              variant="ghost"
              className="flex-1 h-11 rounded-xl text-white/80 hover:text-white hover:bg-white/10 font-semibold gap-2 border border-white/15"
            >
              <Sparkles className="w-4 h-4" /> Regenerar
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-[1.4] h-11 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold gap-2"
            >
              <Check className="w-4 h-4" /> Aceptar mockup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}