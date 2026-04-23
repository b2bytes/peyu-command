import { Globe, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SiteSelector({ sites, selected, onSelect, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[1, 2].map(i => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!sites || sites.length === 0) {
    return (
      <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 text-center text-sm text-slate-500">
        <AlertCircle className="w-5 h-5 mx-auto mb-2 text-amber-500" />
        No hay sites verificados en Search Console.
        <br />
        Verifica peyuchile.cl y peyuchile.lat en <a className="text-blue-600 underline" href="https://search.google.com/search-console" target="_blank" rel="noreferrer">search.google.com/search-console</a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {sites.map(s => {
        const isSel = s.site_url === selected;
        return (
          <button
            key={s.site_url}
            onClick={() => onSelect(s.site_url)}
            className={`p-3 rounded-xl border-2 text-left transition-all ${
              isSel
                ? 'border-teal-500 bg-teal-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Globe className={`w-4 h-4 ${isSel ? 'text-teal-600' : 'text-slate-400'}`} />
              <span className="font-semibold text-sm text-slate-900 truncate flex-1">{s.site_url}</span>
              {isSel && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
            </div>
            <p className="text-[10px] text-slate-500">{s.permission_level}</p>
          </button>
        );
      })}
    </div>
  );
}