import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, FileText, Users, CheckCircle2, AlertTriangle } from 'lucide-react';

const aplicarVars = (texto, cliente) => (texto || '')
  .replaceAll('{{nombre}}', cliente.contacto || cliente.empresa || '')
  .replaceAll('{{empresa}}', cliente.empresa || '');

// Redacción y envío del mensaje a los clientes seleccionados de la base.
export default function WhatsAppComposePanel({ seleccionados }) {
  const [plantillas, setPlantillas] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    base44.entities.PlantillaWhatsApp.list('-updated_date', 100)
      .then((l) => setPlantillas((l || []).filter((p) => p.activo !== false)))
      .catch(() => setPlantillas([]));
  }, []);

  const enviar = async () => {
    if (!texto.trim() || seleccionados.length === 0) return;
    setEnviando(true);
    setResultado(null);
    let ok = 0;
    const fallidos = [];
    for (const c of seleccionados) {
      try {
        const r = await base44.functions.invoke('whatsappEvolutionSend', {
          telefono: c.telefono,
          texto: aplicarVars(texto, c),
        });
        if (r?.data?.ok) ok++; else fallidos.push(c.contacto || c.empresa);
      } catch {
        fallidos.push(c.contacto || c.empresa);
      }
      await new Promise((r) => setTimeout(r, 1200)); // ritmo humano, evita bloqueos
    }
    setEnviando(false);
    setResultado({ ok, fallidos });
  };

  const preview = seleccionados[0] ? aplicarVars(texto, seleccionados[0]) : texto;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-shrink-0 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <p className="text-sm font-bold text-white leading-none">Escribir mensaje</p>
        <p className="text-[10px] text-white/40 mt-1">
          {seleccionados.length === 0 ? 'Selecciona clientes de la lista' : `${seleccionados.length} destinatario${seleccionados.length > 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto peyu-scrollbar-light p-4 space-y-3.5">
        {plantillas.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-white/45 uppercase flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5" /> Plantillas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {plantillas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTexto(p.mensaje)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-bold text-white/70 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}
                >
                  {p.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={7}
            placeholder="Hola {{nombre}} 👋 Te escribo de PEYU…"
            className="w-full p-3 rounded-xl text-sm text-white bg-white/[0.06] outline-none focus:bg-white/[0.10] resize-none leading-relaxed"
            style={{ border: '1px solid rgba(255,255,255,.12)' }}
          />
          <div className="flex gap-1.5 mt-1.5">
            <button onClick={() => setTexto(`${texto}{{nombre}}`)} className="px-2 py-1 rounded-md text-[10px] font-bold text-[#25D366]" style={{ background: 'rgba(37,211,102,.12)' }}>+ nombre</button>
            <button onClick={() => setTexto(`${texto}{{empresa}}`)} className="px-2 py-1 rounded-md text-[10px] font-bold text-[#25D366]" style={{ background: 'rgba(37,211,102,.12)' }}>+ empresa</button>
          </div>
        </div>

        {texto.trim() && seleccionados[0] && (
          <div>
            <p className="text-[11px] font-bold text-white/45 uppercase mb-1.5">Vista previa</p>
            <div className="rounded-2xl rounded-tl-md px-3 py-2.5 text-sm text-white/90 whitespace-pre-wrap leading-relaxed"
              style={{ background: 'rgba(37,211,102,.16)', border: '1px solid rgba(37,211,102,.22)' }}>
              {preview}
            </div>
          </div>
        )}

        {resultado && (
          <div className="rounded-xl p-3 text-xs space-y-1"
            style={{ background: resultado.fallidos.length ? 'rgba(245,158,11,.10)' : 'rgba(37,211,102,.10)', border: '1px solid rgba(255,255,255,.10)' }}>
            <p className="flex items-center gap-1.5 font-bold text-white/85">
              {resultado.fallidos.length ? <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#FBBF24' }} /> : <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#25D366' }} />}
              {resultado.ok} enviado{resultado.ok !== 1 ? 's' : ''}
            </p>
            {resultado.fallidos.length > 0 && (
              <p className="text-white/50">No se pudo enviar a: {resultado.fallidos.join(', ')}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <button
          onClick={enviar}
          disabled={enviando || !texto.trim() || seleccionados.length === 0}
          className="w-full h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}
        >
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {enviando ? 'Enviando…' : `Enviar a ${seleccionados.length || 0}`}
        </button>
        <p className="text-[10px] text-white/30 mt-2 flex items-center gap-1.5">
          <Users className="w-3 h-3" /> Se envía uno por uno con pausas, para evitar bloqueos de WhatsApp.
        </p>
      </div>
    </div>
  );
}