// Preview realista de un Search Ad en Google Search (desktop look).
// Recibe headlines[], descriptions[], landing url + sitelinks.

export default function SearchAdPreview({ headlines = [], descriptions = [], landingUrl = '', sitelinks = [], path1 = '', path2 = '' }) {
  // Google muestra hasta 3 headlines (separadas por "|") y 2 descriptions
  const h = headlines.slice(0, 3);
  const d = descriptions.slice(0, 2);
  let domain = 'peyuchile.cl';
  try { domain = new URL(landingUrl).hostname.replace(/^www\./, ''); } catch {}
  const breadcrumb = [domain, path1, path2].filter(Boolean).join(' › ');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm font-arial max-w-xl">
      {/* Sponsored label */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[13px] font-bold text-gray-900">Patrocinado</span>
      </div>
      {/* URL bar */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">P</div>
        <div className="flex flex-col min-w-0">
          <span className="text-[12px] text-gray-800 truncate">{domain}</span>
          <span className="text-[11px] text-gray-500 truncate">{breadcrumb}</span>
        </div>
      </div>
      {/* Headline */}
      <h3 className="text-[20px] leading-tight text-[#1a0dab] hover:underline cursor-pointer mt-1 font-normal">
        {h.length > 0 ? h.join(' | ') : 'Tu titular aparecerá aquí'}
      </h3>
      {/* Description */}
      <p className="text-[14px] text-gray-700 leading-snug mt-1">
        {d.join(' ') || 'Tu descripción aparecerá aquí. Google rotará los headlines y descripciones automáticamente para maximizar el CTR.'}
      </p>
      {/* Sitelinks */}
      {sitelinks.length > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-2.5 pt-2.5 border-t border-gray-100">
          {sitelinks.slice(0, 4).map((sl, i) => (
            <div key={i}>
              <div className="text-[13px] text-[#1a0dab] hover:underline cursor-pointer">{sl.text}</div>
              {sl.description1 && <div className="text-[11px] text-gray-600 leading-tight">{sl.description1}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}