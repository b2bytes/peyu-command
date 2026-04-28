import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Upload, X, Loader2, Check } from 'lucide-react';
import { detectMockupType, MOCKUP_UI_CONFIG } from '@/lib/mockup-types';

export default function MockupGenerator({
  open,
  onOpenChange,
  productName,
  productCategory,
  productSku,
  productImageUrl,
  initialText = '',
  initialColor = '',
  onGenerated,
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
      setResultUrl('');
      setError('');
    }
  }, [open, initialText]);

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
      setLogoUrl(res.file_url || '');
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
      if (!url) throw new Error('No se generó la imagen.');
      setResultUrl(url);
      onGenerated?.(url, { texto: text, logoUrl });
    } catch (err) {
      setError(err.message || 'Error al generar el mockup.');
    } finally {
      setGenerating(false);
    }
  };

  if (mockupType === 'none') return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-slate-900 border-white/15 text-white">
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

          {error && (
            <div className="text-xs font-semibold text-red-300 bg-red-500/15 border border-red-400/30 rounded-xl p-3">
              {error}
            </div>
          )}

          {/* Resultado */}
          {resultUrl && (
            <div className="rounded-xl overflow-hidden border border-purple-400/40 bg-black/30">
              <img src={resultUrl} alt="Mockup generado" className="w-full h-auto" />
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
      </DialogContent>
    </Dialog>
  );
}