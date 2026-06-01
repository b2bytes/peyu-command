import { Check, AlertTriangle, Package, Tag, Image as ImageIcon } from 'lucide-react';

const fmtCLP = (n) => (n == null ? '—' : `$${Number(n).toLocaleString('es-CL')}`);

// Tarjeta de un producto del Maestro (PDF) con su match real y duplicados.
export default function MaestroMatchCard({ item, busy, onArchive, onFixPrice }) {
  const { nombre_oficial, categoria, incluye, colores, precio_unitario_clp, match, candidatos_extra = [] } = item;
  const dupsActivos = candidatos_extra.filter((d) => d.activo);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header oficial PDF */}
      <div className="px-4 py-3 bg-[#0F8B6C]/5 border-b border-[#0F8B6C]/10">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#0F8B6C]">{categoria} · PDF oficial</span>
            <h3 className="text-sm font-bold text-slate-800 truncate">{nombre_oficial}</h3>
          </div>
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{fmtCLP(precio_unitario_clp)} <span className="text-slate-400 font-normal">unit</span></span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{incluye}</p>
        {colores?.length > 0 && (
          <div className="flex gap-1 mt-1.5">
            {colores.map((c) => <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{c}</span>)}
          </div>
        )}
      </div>

      {/* Match real */}
      <div className="p-4">
        {match ? (
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {match.imagen_url
                ? <img src={match.imagen_url} alt={match.nombre} className="w-full h-full object-cover" />
                : <ImageIcon className="w-6 h-6 text-slate-300" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#0F8B6C]" />
                <span className="text-[10px] font-semibold text-[#0F8B6C]">Enlazado</span>
                {!match.activo && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">inactivo</span>}
              </div>
              <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">{match.nombre}</p>
              <p className="text-[10px] text-slate-400 font-mono">{match.sku} · {match.gal} fotos</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-slate-600">B2C: {fmtCLP(match.precio_b2c)}</span>
                {match.precio_b2c != null && Math.abs(match.precio_b2c - precio_unitario_clp) > 100 && (
                  <button
                    onClick={() => onFixPrice(item)}
                    disabled={busy}
                    className="text-[10px] font-semibold text-[#D96B4D] underline disabled:opacity-50"
                  >
                    fijar PDF ({fmtCLP(precio_unitario_clp)})
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Sin producto enlazado — falta crear</span>
          </div>
        )}

        {/* Duplicados */}
        {candidatos_extra.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                {candidatos_extra.length} posibles duplicados ({dupsActivos.length} activos)
              </span>
            </div>
            <div className="space-y-1.5">
              {candidatos_extra.map((d) => (
                <div key={d.id} className="flex items-center gap-2 text-[11px]">
                  <div className="w-7 h-7 rounded-md bg-slate-100 overflow-hidden flex-shrink-0">
                    {d.imagen_url && <img src={d.imagen_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <span className="truncate flex-1 text-slate-600">{d.nombre}</span>
                  <span className="font-mono text-slate-400 text-[9px]">{d.sku}</span>
                  {d.activo
                    ? <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">ON</span>
                    : <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400">off</span>}
                  {d.activo && (
                    <button
                      onClick={() => onArchive(d)}
                      disabled={busy}
                      className="text-[10px] font-semibold text-[#D96B4D] hover:underline disabled:opacity-50"
                    >
                      archivar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}