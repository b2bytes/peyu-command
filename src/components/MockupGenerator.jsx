import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sparkles, Upload, X, Download, Check, Loader2 } from 'lucide-react';

/**
 * Modal reutilizable para generar un mockup real con IA sobre cualquier producto Peyu.
 * - Si se entrega `jobId`, la función backend actualiza el PersonalizationJob.
 * - onGenerated(mockupUrl) se dispara cuando el mockup está listo para que el caller lo use
 *   (ej: guardarlo en el B2BLead.mockup_urls o prellenar el form de personalización).
 */
export default function MockupGenerator({
  open,
  onOpenChange,
  productName,
  productCategory,
  productSku,
  initialText = '',
  initialColor = '',
  jobId = null,
  onGenerated = () => {},
}) {
  const [texto, setTexto] = useState(initialText);
  const [archivo, setArchivo] = useState(null);
  const [color, setColor] = useState(initialColor);
  const [loading, setLoading] = useState(false);
  const [mockupUrl, setMockupUrl] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setMockupUrl('');
    setError('');
    setArchivo(null);
    setTexto(initialText);
  };

  const handleGenerate = async () => {
    if (!texto && !archivo) {
      setError('Agrega un texto o sube tu logo para generar el mockup.');
      return;
    }
    setLoading(true);
    setError('');
    setMockupUrl('');

    try {
      let logoUrl = '';
      if (archivo) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: archivo });
        logoUrl = file_url;
      }

      const res = await base44.functions.invoke('generateMockup', {
        productName,
        productCategory,
        sku: productSku,
        logoUrl,
        text: texto,
        color,
        jobId,
      });

      const url = res?.data?.mockup_url;
      if (!url) throw new Error(res?.data?.error || 'No se pudo generar el mockup');
      setMockupUrl(url);
      onGenerated(url, { logoUrl, texto });
    } catch (e) {
      setError(e.message || 'Error generando mockup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-poppins">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Mockup con IA — {productName}
          </DialogTitle>
          <DialogDescription>
            Sube tu logo o escribe un texto. Generamos una simulación fotorrealista del grabado láser UV sobre tu producto en segundos.
          </DialogDescription>
        </DialogHeader>

        {!mockupUrl && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Texto a grabar</label>
              <Input
                value={texto}
                onChange={(e) => setTexto(e.target.value.slice(0, 40))}
                placeholder="Tu marca, frase o nombre"
                className="mt-1.5 h-11 rounded-xl"
                disabled={loading}
              />
              <p className="text-[10px] text-gray-400 mt-1 text-right">{texto.length}/40</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">o</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div
              onClick={() => !loading && document.getElementById('mockup-gen-logo').click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${archivo ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-teal-400'}`}
            >
              <Upload className={`w-6 h-6 mx-auto mb-2 ${archivo ? 'text-teal-500' : 'text-gray-400'}`} />
              {archivo ? (
                <>
                  <p className="text-sm font-semibold text-teal-700 truncate">✓ {archivo.name}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setArchivo(null); }}
                    className="text-[11px] text-gray-500 hover:text-gray-700 underline mt-1"
                  >Cambiar</button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">Sube tu logo</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG o SVG · máx 10MB</p>
                </>
              )}
              <input
                id="mockup-gen-logo" type="file" className="hidden"
                accept=".png,.jpg,.jpeg,.svg,.webp"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2">{error}</div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={loading || (!texto && !archivo)}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generando mockup con IA...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generar mockup realista</>
              )}
            </Button>
            <p className="text-[10px] text-gray-400 text-center">Tarda ~10-15 segundos. El resultado es referencial.</p>
          </div>
        )}

        {mockupUrl && (
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
              <img src={mockupUrl} alt="Mockup generado" className="w-full h-auto" />
            </div>
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2 text-xs text-teal-800">
              <Check className="w-4 h-4" />
              <span>Mockup guardado. Se incluirá en tu propuesta final.</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={reset} className="rounded-xl">
                <X className="w-4 h-4 mr-1.5" /> Generar otro
              </Button>
              <a href={mockupUrl} target="_blank" rel="noreferrer" download>
                <Button className="w-full rounded-xl bg-gray-900 hover:bg-gray-800">
                  <Download className="w-4 h-4 mr-1.5" /> Descargar
                </Button>
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}