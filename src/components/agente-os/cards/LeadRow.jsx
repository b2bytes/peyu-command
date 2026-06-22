import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Trash2, CalendarDays, FileText, Eye, Loader2, Phone, Mail, MessageCircle,
  ClipboardCheck, CheckCircle2, ChevronDown, Hash, Package, ExternalLink, Building2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ActionButton from '../ActionButton';
import { fmtFechaCompleta } from '@/lib/fecha-relativa';

const fmtNum = (n) => (n != null ? Number(n).toLocaleString('es-CL') : '—');
const wa = (tel) => (tel ? `https://wa.me/${String(tel).replace(/[^0-9]/g, '')}` : null);

const ETAPA_ORDEN = { 'Nuevo': 0, 'Contactado': 1, 'En revisión': 2, 'Propuesta enviada': 3, 'Aceptado': 4, 'Perdido': 5 };
const ETAPA_STYLE = {
  'Nuevo': 'bg-ld-highlight-soft text-ld-highlight',
  'Contactado': 'bg-ld-action-soft text-ld-action',
  'En revisión': 'bg-ld-action-soft text-ld-action',
  'Propuesta enviada': 'bg-ld-action-soft text-ld-action',
  'Aceptado': 'bg-ld-action-soft text-ld-action',
  'Perdido': 'bg-ld-bg-soft text-ld-fg-muted',
};

// Botón "Ver propuesta" — busca la CorporateProposal vinculada al lead.
function VerPropuestaLead({ lead, onOpen }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const ver = async () => {
    setBusy(true); setErr('');
    try {
      const props = await base44.entities.CorporateProposal.filter({ b2b_lead_id: lead.id }, '-created_date', 1);
      const prop = props?.[0];
      if (prop?.id) onOpen({ id: prop.id, titulo: `${lead.company_name || ''}${prop.numero ? ` · ${prop.numero}` : ''}` });
      else setErr('Sin propuesta');
    } catch { setErr('Error'); }
    setBusy(false);
  };
  return (
    <button onClick={ver} disabled={busy}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ld-glass-soft text-ld-fg-soft hover:text-ld-fg hover:border-ld-action/50 transition-colors disabled:opacity-60">
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
      {err || 'Ver propuesta'}
    </button>
  );
}

// Fila de un lead B2B: cabecera con la info clave + expandible con TODO el
// contacto real (email, teléfono/WhatsApp, RUT, producto) y la ficha completa
// en el embudo. Antes el contacto venía en los datos pero nunca se mostraba.
export default function LeadRow({ lead: l, onDone, onVerPropuesta }) {
  const [open, setOpen] = useState(false);
  const etapa = ETAPA_ORDEN[l.status] ?? 0;
  const tienePropuesta = etapa >= 3;
  const sinContacto = !l.email && !l.phone;

  return (
    <div className="rounded-xl bg-ld-bg-soft/60 border border-ld-border overflow-hidden">
      {/* Cabecera — clic para expandir el detalle del lead */}
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-medium text-ld-fg truncate">{l.company_name || 'Sin empresa'}</div>
            <div className="text-[11px] text-ld-fg-muted truncate">
              {l.contact_name || 'N/A'}{l.qty_estimate ? ` · ${fmtNum(l.qty_estimate)}u` : ''}{l.product_interest ? ` · ${l.product_interest}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {l.lead_score != null && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${l.lead_score >= 70 ? 'bg-ld-highlight-soft text-ld-highlight' : 'bg-ld-action-soft text-ld-action'}`}>
                🔥 {l.lead_score}
              </span>
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ETAPA_STYLE[l.status] || 'bg-ld-bg-soft text-ld-fg-muted'}`}>{l.status}</span>
            <ChevronDown className={`w-4 h-4 text-ld-fg-muted transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
        {l.created_date && (
          <div className="text-[10px] text-ld-fg-subtle mt-1.5 flex items-center gap-1">
            <CalendarDays className="w-2.5 h-2.5" /> Llegó {fmtFechaCompleta(l.created_date)}{l.source ? ` · ${l.source}` : ''}
          </div>
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-ld-border">
          {/* Contacto real — lo que el founder pedía ver, cliente por cliente */}
          <div className="space-y-1.5 text-xs pt-2">
            {l.email && (
              <a href={`mailto:${l.email}`} className="flex items-center gap-2 text-ld-fg-soft hover:text-ld-action transition-colors min-h-[28px]">
                <Mail className="w-3.5 h-3.5 text-ld-fg-muted flex-shrink-0" /> <span className="truncate">{l.email}</span>
              </a>
            )}
            {l.phone && (
              <a href={wa(l.phone)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-ld-fg-soft hover:text-ld-action transition-colors min-h-[28px]">
                <Phone className="w-3.5 h-3.5 text-ld-fg-muted flex-shrink-0" /> <span className="truncate">{l.phone}</span>
                <MessageCircle className="w-3.5 h-3.5 text-ld-action ml-auto flex-shrink-0" />
              </a>
            )}
            {l.rut && (
              <div className="flex items-center gap-2 text-ld-fg-soft">
                <Hash className="w-3.5 h-3.5 text-ld-fg-muted flex-shrink-0" /> {l.rut}
              </div>
            )}
            {l.product_interest && (
              <div className="flex items-center gap-2 text-ld-fg-soft">
                <Package className="w-3.5 h-3.5 text-ld-fg-muted flex-shrink-0" />
                <span className="truncate">{l.product_interest}{l.qty_estimate ? ` · ${fmtNum(l.qty_estimate)}u` : ''}</span>
              </div>
            )}
            {sinContacto && (
              <p className="text-[11px] text-ld-fg-muted italic">
                Este lead no tiene email ni teléfono registrado. Ábrelo en el embudo para completar su contacto.
              </p>
            )}
          </div>

          {/* Accesos directos al contacto */}
          {(l.phone || l.email) && (
            <div className="flex gap-2">
              {l.phone && (
                <a href={wa(l.phone)} target="_blank" rel="noopener noreferrer"
                  className="flex-1 ld-btn-primary rounded-xl py-2 text-center text-xs font-bold inline-flex items-center justify-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
              {l.email && (
                <a href={`mailto:${l.email}`}
                  className="flex-1 ld-btn-ghost rounded-xl py-2 text-center text-xs font-bold text-ld-fg-soft inline-flex items-center justify-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
              )}
            </div>
          )}

          {/* Ficha completa en el embudo B2B */}
          <Link to={`/admin/pipeline?lead=${l.id}`}
            className="w-full ld-btn-ghost rounded-xl py-2 text-center text-xs font-bold text-ld-fg-soft inline-flex items-center justify-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Ver ficha en embudo B2B <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Acción CONTEXTUAL según la etapa del embudo */}
      <div className="flex items-center gap-1.5 px-3 pb-3 flex-wrap">
        {etapa === 0 && (
          <ActionButton action="updateLeadEstado" payload={{ id: l.id, status: 'Contactado' }} label="Marcar contactado" icon={Phone} confirm={false} onDone={onDone} />
        )}
        {etapa === 1 && (
          <ActionButton action="updateLeadEstado" payload={{ id: l.id, status: 'En revisión' }} label="Pasar a revisión" icon={ClipboardCheck} confirm={false} onDone={onDone} />
        )}
        {etapa === 2 && (
          <ActionButton action="autoCotizarLead" payload={{ id: l.id }} label="Generar propuesta" icon={FileText} variant="primary" confirm={true} onDone={onDone} />
        )}
        {tienePropuesta && (
          <>
            <VerPropuestaLead lead={l} onOpen={onVerPropuesta} />
            {l.status === 'Propuesta enviada' && (
              <ActionButton action="updateLeadEstado" payload={{ id: l.id, status: 'Aceptado' }} label="Marcar aceptado" icon={CheckCircle2} confirm={true} onDone={onDone} />
            )}
          </>
        )}
        <ActionButton action="eliminarLead" payload={{ id: l.id }} label="Eliminar" icon={Trash2} confirm={true} onDone={onDone} className="ml-auto bg-ld-highlight-soft text-ld-highlight hover:text-ld-highlight" />
      </div>
    </div>
  );
}