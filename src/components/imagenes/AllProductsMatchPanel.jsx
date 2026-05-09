// ============================================================================
// AllProductsMatchPanel — análisis Drive ↔ catálogo completo (NO-carcasas).
// Recorre todas las subcarpetas del Drive y propone qué producto le corresponde
// a cada una basándose en keyword matching contra nombre + descripción + categoría.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Search, AlertCircle, FolderTree, ListChecks } from 'lucide-react';
import AllProductsReviewModal from './AllProductsReviewModal';

export default function AllProductsMatchPanel({ onApplied }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const runPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('driveMatchAllProducts', { mode: 'preview' });
      setPreview(res?.data || null);
      setReviewOpen(true);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-400/20 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-white font-poppins font-semibold flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-emerald-300" />
            Auto-asignar imágenes del Drive · catálogo completo
          </h3>
          <p className="text-white/60 text-xs mt-1 max-w-2xl">
            Recorre todas las subcarpetas del Drive (Hogar, Escritorio, Corporativos, Entretenimiento) y propone qué <span className="text-white/80">producto del catálogo</span> le corresponde a cada una usando matching de palabras clave del nombre + descripción + categoría. Confirmá fila por fila antes de aplicar.
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
          <Button onClick={runPreview} disabled={loading} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
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
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          <Stat label="Carpetas Drive" value={preview.total_folders_scanned} />
          <Stat label="Con sugerencia" value={preview.total_folders_with_match} accent="text-emerald-300" />
          <Stat label="Sin match" value={preview.total_folders_without_match} accent="text-amber-300" />
        </div>
      )}

      <AllProductsReviewModal
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