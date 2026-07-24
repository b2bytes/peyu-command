import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Type, Loader2, Search, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import TextoEditRow from './TextoEditRow';

// Editor de textos del sitio embebido en el chat del Agente OS.
// El founder edita cualquier texto de las páginas públicas (Nosotros, FAQ,
// Envíos, etc.) sin salir de la conversación. Misma fuente que /admin/textos.
export default function TextosManagerCard() {
  const [textos, setTextos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [pagina, setPagina] = useState('Todas');

  const load = async () => {
    const rows = await base44.entities.TextoPagina.list('orden', 500).catch(() => []);
    setTextos(rows || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const paginas = [...new Set(textos.map((t) => t.pagina || 'otros'))].sort();
  const filtrados = textos.filter((t) => {
    if (pagina !== 'Todas' && (t.pagina || 'otros') !== pagina) return false;
    if (q.trim()) {
      const s = q.toLowerCase().trim();
      return [t.etiqueta, t.clave, t.valor, t.pagina].some((v) => (v || '').toLowerCase().includes(s));
    }
    return true;
  });

  return (
    <div className="ld-card rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="w-9 h-9 rounded-xl bg-ld-action-soft flex items-center justify-center flex-shrink-0">
          <Type className="w-4 h-4 text-ld-action" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ld-fg leading-tight">Textos del sitio</p>
          <p className="text-[11px] text-ld-fg-muted">{textos.length} textos editables · los cambios se ven al instante en la web</p>
        </div>
        <Link
          to="/admin/textos"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold ld-btn-ghost"
          title="Abrir el editor completo"
        >
          <ExternalLink className="w-3 h-3" /> Editor completo
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ld-fg-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar texto (ej. título, hero, envíos)…"
            className="w-full h-8 pl-8 pr-3 rounded-xl ld-input text-xs"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {['Todas', ...paginas].map((p) => (
            <button
              key={p}
              onClick={() => setPagina(p)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap capitalize ${
                pagina === p ? 'ld-btn-primary text-white' : 'ld-btn-ghost'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-ld-fg-muted text-xs">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando textos…
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-xs text-ld-fg-muted text-center py-8">
          {textos.length === 0 ? 'Aún no hay textos editables registrados.' : 'Sin resultados para este filtro.'}
        </p>
      ) : (
        <div className="space-y-2 max-h-[440px] overflow-y-auto peyu-scrollbar pr-1">
          {filtrados.slice(0, 60).map((t) => (
            <TextoEditRow key={t.id} texto={t} onSaved={load} />
          ))}
          {filtrados.length > 60 && (
            <p className="text-[10px] text-ld-fg-muted text-center py-1">Mostrando 60 de {filtrados.length} — afina la búsqueda para ver el resto.</p>
          )}
        </div>
      )}
    </div>
  );
}