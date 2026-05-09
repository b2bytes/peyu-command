// ============================================================================
// CarcasasMatchPanel — Panel para previsualizar el matching automático Drive↔Producto
// y abrir el modal de revisión confirmable antes de aplicar masivamente.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Search, AlertCircle, Smartphone, ListChecks } from 'lucide-react';
import CarcasasReviewModal from './CarcasasReviewModal';

export default function CarcasasMatchPanel({ onApplied }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const runPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('driveMatchCarcasas', { mode: 'preview' });
      setPreview(res?.data || null);
      setReviewOpen(true);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-400/20 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-white font-poppins font-semibold flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-300" />
            Auto-asignar imágenes correctas a Carcasas
          </h3>
          <p className="text-white/60 text-xs mt-1 max-w-2xl">
            Lee la carpeta <span className="text-white/80">Carcasas</span> del Drive, compara los nombres de los archivos contra el SKU/modelo de cada producto y te muestra un panel para
            <span className="text-white/80"> confirmar o reasignar fila por fila</span> antes de aplicar masivamente.
          </p>
        </div>
        <div className="flex gap-2">
          {preview && !reviewOpen && (
            <Button
              size="sm"
              onClick={() => setReviewOpen(true)}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2"
            >
              <ListChecks className="w-3.5 h-3.5" />
              Reabrir revisión
            </Button>
          )}
          <Button onClick={runPreview} disabled={loading} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Analizar Drive
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-3 bg-rose-500/10 border border-rose-400/30 rounded-lg p-2 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {preview && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          <Stat label="Archivos Drive" value={preview.total_drive_files} />
          <Stat label="Productos catálogo" value={preview.total_productos_carcasas} />
          <Stat label="Sugerencias auto" value={preview.total_matches} accent="text-emerald-300" />
          <Stat label="Productos cubiertos" value={preview.productos_con_match} accent="text-indigo-300" />
        </div>
      )}

      <CarcasasReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        preview={preview}
        onApplied={onApplied}
      />
    </div>
  );
}

function Stat({ label, value, accent = 'text-white' }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
      <p className="text-[10px] text-white/50">{label}</p>
      <p className={`text-lg font-poppins font-bold ${accent}`}>{value}</p>
    </div>
  );
}