// ============================================================================
// CarcasasMatchPanel — Panel para revisar el matching automático de imágenes
// de la carpeta "Carcasas" del Drive con cada modelo del catálogo.
// Permite previsualizar y luego aplicar (descarga + sube al CDN + actualiza productos).
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Search, CheckCircle2, AlertCircle, Smartphone, Sparkles } from 'lucide-react';

export default function CarcasasMatchPanel({ onApplied }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runPreview = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('driveMatchCarcasas', { mode: 'preview' });
      setPreview(res?.data || null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const apply = async () => {
    if (!confirm('¿Aplicar los matches? Se descargarán las imágenes del Drive, se subirán al CDN y se actualizarán los productos.')) return;
    setApplying(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('driveMatchCarcasas', { mode: 'apply', replacePrincipal: true });
      setResult(res?.data || null);
      onApplied?.();
    } catch (e) {
      setError(e.message);
    }
    setApplying(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-400/20 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-white font-poppins font-semibold flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-300" />
            Auto-asignar imágenes correctas a Carcasas
          </h3>
          <p className="text-white/60 text-xs mt-1">
            Lee la carpeta "Carcasas" del Drive y matchea cada archivo (ej: <code className="text-indigo-300">ip11promax blu.jpg</code>) con su modelo correcto del catálogo.
          </p>
        </div>
        <Button onClick={runPreview} disabled={loading} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Previsualizar matching
        </Button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-400/30 rounded-lg p-2 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {preview && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Stat label="Archivos Drive" value={preview.total_drive_files} />
            <Stat label="Productos catálogo" value={preview.total_productos_carcasas} />
            <Stat label="Matches" value={preview.total_matches} accent="text-emerald-300" />
            <Stat label="Productos asignados" value={preview.productos_con_match} accent="text-indigo-300" />
          </div>

          {preview.productos?.length > 0 && (
            <div className="bg-black/20 rounded-lg p-3 max-h-64 overflow-y-auto peyu-scrollbar-light">
              <p className="text-[11px] text-white/60 mb-2">✅ Modelos con imagen asignada:</p>
              <div className="space-y-1.5">
                {preview.productos.map(p => (
                  <div key={p.producto.id} className="text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{p.producto.nombre}</p>
                      <p className="text-white/40 text-[10px] truncate font-mono">
                        {p.files.map(f => f.name).join(' · ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview.unmatched_files?.length > 0 && (
            <details className="bg-black/20 rounded-lg p-3">
              <summary className="text-[11px] text-white/50 cursor-pointer">
                ⚠️ Archivos sin match ({preview.unmatched_files.length})
              </summary>
              <div className="mt-2 space-y-0.5 max-h-40 overflow-y-auto peyu-scrollbar-light">
                {preview.unmatched_files.map((u, i) => (
                  <p key={i} className="text-[10px] text-white/40 font-mono truncate">
                    {u.file} <span className="text-white/30">— {u.reason}</span>
                  </p>
                ))}
              </div>
            </details>
          )}

          {preview.total_matches > 0 && (
            <Button onClick={apply} disabled={applying} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Aplicar matching · {preview.total_matches} imágenes en {preview.productos_con_match} productos
            </Button>
          )}
        </div>
      )}

      {result && (
        <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-3 text-xs text-emerald-100">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <CheckCircle2 className="w-4 h-4" /> Matching aplicado
          </div>
          <p>
            {result.total_subidas_ok} imágenes subidas al CDN · {result.productos_actualizados} productos actualizados.
          </p>
        </div>
      )}
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