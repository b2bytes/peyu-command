import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Building2, User, Calendar, Package, FileText, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const FIELDS = [
  { key: 'nombre', label: 'Nombre', icon: User },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'telefono', label: 'Teléfono', icon: Phone },
  { key: 'empresa', label: 'Empresa', icon: Building2 },
  { key: 'rut', label: 'RUT', icon: FileText },
  { key: 'cantidad_estimada', label: 'Cantidad', icon: Package },
  { key: 'fecha_requerida', label: 'Fecha', icon: Calendar },
];

export default function ChatLeadDrawer({ lead, open, onOpenChange }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !lead?.conversation_id) return;
    setLoading(true);
    base44.functions
      .invoke('getChatConversation', { conversation_id: lead.conversation_id })
      .then(res => setMessages(res?.data?.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [open, lead?.conversation_id]);

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-slate-900 text-white">{lead.tipo}</Badge>
            <Badge variant="outline">{lead.estado}</Badge>
            <span className="text-sm text-slate-500">Score: {lead.score || 0}/100</span>
          </SheetTitle>
        </SheetHeader>

        {/* Datos capturados */}
        <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-3">
            Datos capturados
          </p>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(f => (
              <div key={f.key} className="flex items-start gap-2">
                <f.icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase text-slate-400">{f.label}</p>
                  <p className="text-sm text-slate-800 truncate">
                    {lead[f.key] || <span className="text-slate-300">—</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {lead.page_origen && (
            <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-200">
              Origen: <span className="font-mono">{lead.page_origen}</span>
            </p>
          )}
        </div>

        {/* Conversación */}
        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-3">
            Conversación ({lead.mensajes_count || 0} mensajes)
          </p>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No hay mensajes disponibles.
            </p>
          ) : (
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'bg-slate-100 border border-slate-200 ml-6'
                      : 'bg-emerald-50 border border-emerald-100 mr-6'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1 text-slate-500">
                    {m.role === 'user' ? '👤 Cliente' : '🐢 Peyu'}
                  </p>
                  <div className="prose prose-sm max-w-none prose-p:my-1 text-slate-800">
                    <ReactMarkdown>{m.content || ''}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="mt-5 flex gap-2 flex-wrap pt-4 border-t border-slate-200">
          {lead.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${lead.email}`}>📧 Email</a>
            </Button>
          )}
          {lead.telefono && (
            <Button variant="outline" size="sm" asChild>
              <a href={`https://wa.me/${lead.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                💬 WhatsApp
              </a>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}