import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Save, Check, FileText, Plus, RotateCcw, Newspaper, LayoutTemplate } from 'lucide-react';
import BlogEditorPanel from '@/components/textos/BlogEditorPanel';

// ════════════════════════════════════════════════════════════════════════
// /admin/textos — Editor de contenido de páginas públicas (founders).
// ------------------------------------------------------------------------
// Dos pestañas:
//   · Páginas — textos editables (entidad TextoPagina) por página, con
//     fallback al copy del código. Si una página no tiene textos sembrados,
//     el botón "Cargar textos por defecto" crea las claves base.
//   · Blog — gestión completa de artículos (entidad BlogPost).
// ════════════════════════════════════════════════════════════════════════

// Textos por defecto por página (espejo del copy del código). Se siembran una
// vez; luego los founders los editan libremente. Solo cubrimos los textos de
// cabecera/hero y párrafos editables — las listas legales viven en el código.
const DEFAULTS = {
  nosotros: [
    { clave: 'nosotros.hero.linea1', etiqueta: 'Hero · Línea 1', valor: 'Desde una terraza' },
    { clave: 'nosotros.hero.linea2', etiqueta: 'Hero · Línea 2 (destacada)', valor: 'hasta una fábrica' },
    { clave: 'nosotros.hero.linea3', etiqueta: 'Hero · Línea 3', valor: 'con 6 inyectoras.' },
    { clave: 'nosotros.hero.subtitulo', etiqueta: 'Hero · Subtítulo', valor: 'Peyu nació de una idea simple: el plástico que botamos puede convertirse en el regalo más bonito de la oficina. Hoy somos la plataforma líder en gifting corporativo sostenible de Chile.', multilinea: true },
    { clave: 'nosotros.historia.parrafo1', etiqueta: 'Historia · Párrafo 1', valor: 'Todo comenzó en 2019, cuando Joaquín Nilo empezó a fundir botellas plásticas de su barrio en la terraza. El primer prototipo era feo. Pero la idea era perfecta: el plástico que ya existe es la mejor materia prima del mundo.', multilinea: true },
    { clave: 'nosotros.historia.parrafo2', etiqueta: 'Historia · Párrafo 2', valor: 'Carlos Moscoso se sumó con su visión comercial: empresas chilenas necesitan regalos corporativos con propósito ESG. Juntos crearon Peyu — la tortuga marina que navega lento pero llega siempre.', multilinea: true },
  ],
  faq: [
    { clave: 'faq.hero.eyebrow', etiqueta: 'Hero · Etiqueta superior', valor: 'Soporte' },
    { clave: 'faq.hero.titulo', etiqueta: 'Hero · Título', valor: 'Preguntas' },
    { clave: 'faq.hero.titulo_destacado', etiqueta: 'Hero · Título (palabra destacada)', valor: 'frecuentes.' },
    { clave: 'faq.hero.subtitulo', etiqueta: 'Hero · Subtítulo', valor: 'Todo lo que necesitas saber antes de comprar.', multilinea: true },
  ],
  envios: [
    { clave: 'envios.hero.eyebrow', etiqueta: 'Hero · Etiqueta superior', valor: 'Logística' },
    { clave: 'envios.hero.titulo', etiqueta: 'Hero · Título', valor: 'Envíos a' },
    { clave: 'envios.hero.titulo_destacado', etiqueta: 'Hero · Título (palabra destacada)', valor: 'todo Chile.' },
    { clave: 'envios.hero.subtitulo', etiqueta: 'Hero · Subtítulo', valor: 'Plazos, tarifas y cobertura nacional · BlueExpress Express', multilinea: true },
  ],
  cambios: [
    { clave: 'cambios.hero.eyebrow', etiqueta: 'Hero · Etiqueta superior', valor: 'Política de Devoluciones' },
    { clave: 'cambios.hero.titulo', etiqueta: 'Hero · Título', valor: 'Cambios y' },
    { clave: 'cambios.hero.titulo_destacado', etiqueta: 'Hero · Título (palabra destacada)', valor: 'devoluciones.' },
    { clave: 'cambios.hero.subtitulo', etiqueta: 'Hero · Subtítulo', valor: '30 días para devolver · Cumple Ley del Consumidor 19.496 · Pro-Consumidor 21.398', multilinea: true },
  ],
  contacto: [
    { clave: 'contacto.hero.eyebrow', etiqueta: 'Hero · Etiqueta superior', valor: 'Contacto' },
    { clave: 'contacto.hero.titulo', etiqueta: 'Hero · Título', valor: 'Hablemos.' },
    { clave: 'contacto.hero.titulo_destacado', etiqueta: 'Hero · Título (palabra destacada)', valor: 'De verdad.' },
    { clave: 'contacto.hero.subtitulo', etiqueta: 'Hero · Subtítulo', valor: 'Estamos aquí para ayudarte. Respondemos en menos de 24 horas hábiles.', multilinea: true },
  ],
};

const PAGINAS = [
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'faq', label: 'FAQ' },
  { id: 'envios', label: 'Envíos' },
  { id: 'cambios', label: 'Cambios' },
  { id: 'contacto', label: 'Contacto' },
];

const C = {
  bg: '#F8F3ED', surface: '#FFFFFF', border: '#D4C4B0',
  fg: '#2C1810', fgSoft: '#7A6050', fgMuted: '#A08070', action: '#0F8B6C',
};

function TextoRow({ texto, onSaved }) {
  const [valor, setValor] = useState(texto.valor || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = valor !== (texto.valor || '');

  useEffect(() => { setValor(texto.valor || ''); }, [texto.id, texto.valor]);

  const guardar = async () => {
    setSaving(true);
    await base44.entities.TextoPagina.update(texto.id, { valor });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
    onSaved?.();
  };

  return (
    <div className="rounded-2xl p-4 transition-all" style={{ background: C.surface, border: `1.5px solid ${dirty ? C.action : C.border}` }}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className="text-xs font-bold" style={{ color: C.fg }}>{texto.etiqueta || texto.clave}</p>
        <code className="text-[10px] flex-shrink-0" style={{ color: C.fgMuted }}>{texto.clave}</code>
      </div>
      {texto.multilinea ? (
        <textarea
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          rows={3}
          className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-y leading-relaxed"
          style={{ border: `1.5px solid ${C.border}`, color: C.fg, background: '#FBF8F3' }}
        />
      ) : (
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-sm outline-none"
          style={{ border: `1.5px solid ${C.border}`, color: C.fg, background: '#FBF8F3' }}
        />
      )}
      <div className="flex justify-end mt-2">
        <button
          onClick={guardar}
          disabled={!dirty || saving}
          className="flex items-center gap-1.5 px-4 h-9 rounded-xl text-white font-bold text-xs transition-all disabled:opacity-40"
          style={{ background: saved ? '#5B7D5A' : C.action }}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

function PaginasTab() {
  const [pagina, setPagina] = useState('nosotros');
  const [textos, setTextos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sembrando, setSembrando] = useState(false);

  const cargar = async () => {
    setLoading(true);
    const rows = await base44.entities.TextoPagina.filter({ pagina }, 'orden').catch(() => []);
    setTextos(rows || []);
    setLoading(false);
  };
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [pagina]);

  // Siembra las claves que faltan (idempotente: nunca duplica las existentes).
  const sembrar = async () => {
    setSembrando(true);
    const base = DEFAULTS[pagina] || [];
    const existentes = new Set(textos.map((t) => t.clave));
    const nuevos = base
      .filter((d) => !existentes.has(d.clave))
      .map((d, i) => ({ ...d, pagina, orden: i, multilinea: !!d.multilinea }));
    if (nuevos.length) await base44.entities.TextoPagina.bulkCreate(nuevos);
    setSembrando(false);
    cargar();
  };

  const faltantes = (DEFAULTS[pagina] || []).filter((d) => !textos.some((t) => t.clave === d.clave)).length;

  return (
    <>
      {/* Selector de página */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {PAGINAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPagina(p.id)}
            className="px-4 h-9 rounded-xl text-sm font-bold transition-all"
            style={{
              background: pagina === p.id ? C.action : C.surface,
              color: pagina === p.id ? 'white' : C.fgSoft,
              border: `1.5px solid ${pagina === p.id ? C.action : C.border}`,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: C.action }} /></div>
      ) : textos.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
          <p className="text-sm mb-4" style={{ color: C.fgSoft }}>Esta página aún no tiene textos editables cargados.</p>
          <button
            onClick={sembrar}
            disabled={sembrando}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl text-white font-bold text-sm disabled:opacity-50"
            style={{ background: C.action }}
          >
            {sembrando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Cargar textos por defecto
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {textos.map((t) => <TextoRow key={t.id} texto={t} onSaved={cargar} />)}
          {faltantes > 0 && (
            <button
              onClick={sembrar}
              disabled={sembrando}
              className="w-full flex items-center justify-center gap-2 px-4 h-11 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{ border: `1.5px dashed ${C.border}`, color: C.fgSoft }}
            >
              {sembrando ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Cargar {faltantes} texto{faltantes > 1 ? 's' : ''} nuevo{faltantes > 1 ? 's' : ''} de esta página
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default function EditorTextos() {
  const [tab, setTab] = useState('paginas');

  return (
    <div className="min-h-screen font-inter p-4 sm:p-8" style={{ background: C.bg, color: C.fg }}>
      <div className={`mx-auto transition-all ${tab === 'blog' ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <div className="flex items-center gap-2.5 mb-1">
          <FileText className="w-5 h-5" style={{ color: C.action }} />
          <h1 className="font-fraunces text-2xl">Contenido del sitio</h1>
        </div>
        <p className="text-sm mb-5" style={{ color: C.fgSoft }}>
          Edita los textos de las páginas públicas y los artículos del blog. Los cambios se publican al guardar.
        </p>

        {/* Pestañas Páginas / Blog */}
        <div className="flex gap-2 mb-6 p-1 rounded-2xl w-fit" style={{ background: '#EFE6D9', border: `1.5px solid ${C.border}` }}>
          {[
            { id: 'paginas', label: 'Páginas', icon: LayoutTemplate },
            { id: 'blog', label: 'Blog', icon: Newspaper },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-bold transition-all"
                style={{ background: active ? C.surface : 'transparent', color: active ? C.fg : C.fgMuted, boxShadow: active ? '0 1px 6px rgba(44,24,16,.08)' : 'none' }}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'paginas' ? <PaginasTab /> : <BlogEditorPanel />}
      </div>
    </div>
  );
}