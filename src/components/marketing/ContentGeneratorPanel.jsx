import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Wand2, Loader2, Image as ImageIcon, Check, RefreshCw, Copy } from 'lucide-react';
import { toast } from 'sonner';

const REDES = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'Twitter/X', 'Pinterest', 'Threads', 'YouTube'];
const TIPOS = ['Reel', 'Post Imagen', 'Carrusel', 'Story', 'Texto', 'Video largo'];
const PILARES = ['Producto', 'Sostenibilidad/ESG', 'Educativo', 'Detrás de escena', 'Testimonios', 'Promoción', 'Comunidad', 'Branding'];
const OBJETIVOS = ['Awareness', 'Engagement', 'Tráfico web', 'Leads B2B', 'Conversión B2C', 'Fidelización'];

export default function ContentGeneratorPanel({ onGenerated }) {
  const [red, setRed] = useState('Instagram');
  const [tipo, setTipo] = useState('Post Imagen');
  const [pilar, setPilar] = useState('Producto');
  const [objetivo, setObjetivo] = useState('Engagement');
  const [tema, setTema] = useState('');
  const [sku, setSku] = useState('');
  const [numVariantes, setNumVariantes] = useState(1);
  const [incluirImagen, setIncluirImagen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleGenerate = async () => {
    if (!tema.trim()) { toast.error('Ingresa un tema o idea'); return; }
    setLoading(true);
    setResultado(null);
    try {
      const res = await base44.functions.invoke('generateSocialContent', {
        red_social: red,
        tipo_post: tipo,
        pilar,
        tema,
        objetivo,
        producto_sku: sku,
        num_variantes: numVariantes,
        incluir_imagen: incluirImagen,
        auto_guardar: true,
      });
      if (res?.data?.ok) {
        setResultado(res.data);
        toast.success(`${res.data.variantes.length} post(s) generado(s) y guardado(s) en Borradores`);
        onGenerated?.();
      } else {
        toast.error(res?.data?.error || 'Error generando contenido');
      }
    } catch (e) {
      toast.error(e.message || 'Error en la generación');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-poppins font-bold text-gray-900 flex items-center gap-2">
              Generador Agéntico de Contenido
              <span className="text-[9px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">IA + IMAGEN</span>
            </h3>
            <p className="text-xs text-gray-500">Relato + Imagen real + Hashtags + CTA · Guarda en Borradores automáticamente</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select label="Red social" value={red} onChange={setRed} options={REDES} />
          <Select label="Tipo post" value={tipo} onChange={setTipo} options={TIPOS} />
          <Select label="Pilar" value={pilar} onChange={setPilar} options={PILARES} />
          <Select label="Objetivo" value={objetivo} onChange={setObjetivo} options={OBJETIVOS} />
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tema / Idea</label>
          <Input value={tema} onChange={e => setTema(e.target.value)}
            placeholder="Ej: Lanzamiento kit escritorio PRO · Día de la Tierra · Cliente BancoEstado..."
            className="mt-1 rounded-xl h-11" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">SKU (opcional)</label>
            <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="Ej: KIT-ESC-01" className="mt-1 rounded-xl h-10" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Variantes</label>
            <select value={numVariantes} onChange={e => setNumVariantes(Number(e.target.value))}
              className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm">
              <option value={1}>1 variante</option>
              <option value={2}>2 variantes</option>
              <option value={3}>3 variantes</option>
            </select>
          </div>
          <label className="flex items-center gap-2 mt-5 bg-gray-50 border border-gray-200 rounded-xl px-3 h-10 cursor-pointer hover:bg-gray-100">
            <input type="checkbox" checked={incluirImagen} onChange={e => setIncluirImagen(e.target.checked)} className="w-4 h-4 accent-purple-500" />
            <ImageIcon className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-semibold text-gray-700">Generar imagen IA</span>
          </label>
        </div>

        <Button onClick={handleGenerate} disabled={loading || !tema.trim()}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 text-white font-bold gap-2 shadow-lg">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generando con IA... (~30s)</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generar contenido completo</>
          )}
        </Button>

        {loading && (
          <div className="text-center text-xs text-gray-400 space-y-1 py-3">
            <p>⏳ 1/3 Analizando contexto y pilar...</p>
            <p>✍️ 2/3 Escribiendo relato inteligente con Claude Sonnet...</p>
            <p>🎨 3/3 Generando imagen fotorealista...</p>
          </div>
        )}
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="border-t border-gray-100 bg-gradient-to-br from-purple-50/30 to-pink-50/30 p-5 space-y-4">
          {resultado.estrategia && (
            <div className="bg-white border border-purple-200 rounded-xl p-3">
              <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-1">Estrategia del Director IA</p>
              <p className="text-sm text-gray-700 leading-relaxed">{resultado.estrategia}</p>
            </div>
          )}

          <div className="space-y-4">
            {resultado.variantes.map((v, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {v.imagen_url && (
                  <div className="relative aspect-square bg-gray-100">
                    <img src={v.imagen_url} alt={v.titulo_interno} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> IA generada
                    </div>
                    {v.score_predicho && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        {v.score_predicho}/10
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-poppins font-bold text-sm text-gray-900">{v.titulo_interno}</h4>
                    {v.post_id && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-teal-600">
                        <Check className="w-3 h-3" /> Guardado en Borradores
                      </span>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 relative group">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{v.copy}</p>
                    <button onClick={() => copy(v.copy)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-white border border-gray-200 rounded-lg p-1.5 hover:bg-gray-100">
                      <Copy className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-mono">{v.hashtags}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-amber-50 rounded-lg px-3 py-2">
                      <span className="text-amber-600 font-bold uppercase text-[10px]">CTA</span>
                      <p className="text-gray-700 mt-0.5">{v.cta}</p>
                    </div>
                    {v.hora_optima && (
                      <div className="bg-teal-50 rounded-lg px-3 py-2">
                        <span className="text-teal-600 font-bold uppercase text-[10px]">Hora óptima</span>
                        <p className="text-gray-700 mt-0.5">{v.hora_optima}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={handleGenerate} disabled={loading} className="w-full rounded-xl gap-2">
            <RefreshCw className="w-4 h-4" /> Generar otra variante
          </Button>
        </div>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:ring-2 focus:ring-purple-500/30">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}