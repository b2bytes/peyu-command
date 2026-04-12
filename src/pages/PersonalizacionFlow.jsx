import { useState } from "react";
import { Upload, X, Eye, Check, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PersonalizacionFlow({ pedidoId, onClose, onSave }) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Confirm
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [texto, setTexto] = useState('');
  const [position, setPosition] = useState('center');
  const [saving, setSaving] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB max
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => setLogoPreview(evt.target.result);
      reader.readAsDataURL(file);
      setStep(2);
    } else {
      alert('Máximo 5MB. Sube PNG, JPG o SVG');
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      // Aquí subirías la personalización
      await onSave({
        logo_recibido: true,
        texto_personalizacion: texto,
        logo_url: logoPreview,
      });
      setSaving(false);
      onClose();
    } catch (err) {
      setSaving(false);
      alert('Error: ' + err.message);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-poppins">Personalización del Pedido</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Progress */}
          <div className="flex gap-1">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex-1 h-2 rounded-full ${s <= step ? 'bg-peyu-green' : 'bg-muted'}`} />
            ))}
          </div>

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-8 border-2 border-dashed border-border rounded-xl text-center hover:bg-muted/30 transition-colors cursor-pointer">
                <label className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="font-semibold text-foreground">Sube tu logo</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG o SVG · Máx 5MB</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">O escribe un texto</label>
                <input
                  type="text"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Ej: EMPRESA ACME 2025"
                  maxLength={50}
                  className="w-full mt-2 px-3 py-2 border border-input rounded-lg text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">{texto.length}/50 caracteres</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!logoFile && !texto}
                  style={{ background: '#0F8B6C' }}
                  className="text-white"
                >
                  Ver vista previa
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-xl p-8 text-center border border-border">
                <p className="text-xs text-muted-foreground mb-4">Vista Previa del Producto</p>
                <div className="bg-white rounded-lg inline-block p-8 shadow-lg border border-border relative w-48 h-48 flex items-center justify-center">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="font-bold text-xl text-center text-gray-400">{texto}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Posición</label>
                <div className="flex gap-2 mt-2">
                  {['top', 'center', 'bottom'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPosition(p)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                        position === p
                          ? 'border-peyu-green bg-green-50 text-peyu-green'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {p === 'top' ? '↑ Arriba' : p === 'center' ? '◉ Centro' : '↓ Abajo'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>← Volver</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                  <Button
                    onClick={() => setStep(3)}
                    style={{ background: '#0F8B6C' }}
                    className="text-white"
                  >
                    Confirmar →
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold">Personalización lista para procesar</p>
                  <p className="text-xs mt-0.5">Se guardará en el pedido y enviará a producción</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold">Lead time con personalizacion</p>
                  <p className="text-xs mt-0.5">Se agregará a la orden de producción (revisión + grabado)</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setStep(2)}>← Editar</Button>
                <Button
                  onClick={handleConfirm}
                  disabled={saving}
                  style={{ background: '#0F8B6C' }}
                  className="text-white"
                >
                  {saving ? 'Guardando...' : '✓ Guardar Personalización'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}