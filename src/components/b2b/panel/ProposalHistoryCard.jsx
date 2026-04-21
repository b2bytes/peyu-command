import { Link } from 'react-router-dom';
import { FileText, Download, RotateCcw, Calendar, Package, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_STYLES = {
  'Aceptada': 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  'Enviada': 'bg-blue-500/20 text-blue-300 border-blue-400/40',
  'Borrador': 'bg-gray-500/20 text-gray-300 border-gray-400/40',
  'Rechazada': 'bg-red-500/20 text-red-300 border-red-400/40',
  'Vencida': 'bg-amber-500/20 text-amber-300 border-amber-400/40',
};

export default function ProposalHistoryCard({ proposal, onRepeat, onDownload, downloading, repeating }) {
  const statusClass = STATUS_STYLES[proposal.status] || 'bg-white/10 text-white/60 border-white/20';
  const items = proposal.items || [];

  return (
    <div className="bg-white/5 border border-white/15 rounded-2xl p-4 backdrop-blur-sm hover:border-white/30 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-white text-sm">{proposal.numero || `#${proposal.id.slice(-6)}`}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusClass}`}>{proposal.status}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-white/50">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {proposal.fecha_envio?.slice(0, 10) || '—'}</span>
            <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {items.length} ítem{items.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-poppins font-bold text-white text-lg leading-none">
            ${(proposal.total || 0).toLocaleString('es-CL')}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">Lead time: {proposal.lead_time_dias || '—'}d</p>
        </div>
      </div>

      {/* Items preview */}
      {items.length > 0 && (
        <div className="space-y-1 mb-3 pl-1">
          {items.slice(0, 3).map((it, i) => (
            <div key={i} className="flex justify-between text-[11px] text-white/60">
              <span className="truncate pr-2">{it.cantidad || it.qty}× {it.nombre || it.name}</span>
              <span className="font-mono text-white/40 flex-shrink-0">${((it.precio_unitario || 0) * (it.cantidad || it.qty || 0)).toLocaleString('es-CL')}</span>
            </div>
          ))}
          {items.length > 3 && (
            <p className="text-[10px] text-white/30 italic">+{items.length - 3} ítem(s) más</p>
          )}
        </div>
      )}

      {proposal.mockup_urls?.[0] && (
        <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
          <img src={proposal.mockup_urls[0]} alt="Mockup" className="w-full h-32 object-cover" loading="lazy" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10">
        <Link to={`/b2b/propuesta?id=${proposal.id}`} className="col-span-1">
          <Button variant="outline" size="sm" className="w-full h-9 rounded-lg border-white/20 text-white hover:bg-white/10 text-xs gap-1">
            <FileText className="w-3.5 h-3.5" /> Ver
          </Button>
        </Link>
        <Button onClick={() => onDownload(proposal.id, proposal.numero)} disabled={downloading} variant="outline" size="sm"
          className="h-9 rounded-lg border-white/20 text-white hover:bg-white/10 text-xs gap-1">
          {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
        </Button>
        <Button onClick={() => onRepeat(proposal)} disabled={repeating} size="sm"
          className="h-9 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold gap-1">
          {repeating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Repetir
          <ArrowRight className="w-3 h-3 hidden sm:inline" />
        </Button>
      </div>
    </div>
  );
}