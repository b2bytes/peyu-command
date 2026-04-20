import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Search, Download, RefreshCw, Link2, TrendingUp, Star, Newspaper, Instagram as IgIcon } from 'lucide-react';
import BacklinkCard from '@/components/backlinks/BacklinkCard';

const TIPOS = ['Todos', 'Prensa / Medio', 'Sitio Propio', 'Instagram', 'TikTok', 'Facebook', 'YouTube', 'LinkedIn', 'Mención', 'Otro'];

export default function Backlinks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('Todos');

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.Backlink.list('-created_date', 500);
    setItems(list || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSeed = async () => {
    setSeeding(true);
    await base44.functions.invoke('seedBacklinks', {});
    await load();
    setSeeding(false);
  };

  const handleExportCSV = () => {
    const headers = ['url', 'titulo', 'dominio', 'tipo', 'categoria', 'autoridad', 'dofollow', 'fecha_publicacion', 'estado', 'engagement', 'extracto'];
    const rows = [headers.join(',')];
    filtered.forEach(it => {
      const row = headers.map(h => `"${String(it[h] ?? '').replace(/"/g, '""')}"`).join(',');
      rows.push(row);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `peyu_backlinks_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (tipo !== 'Todos' && it.tipo !== tipo) return false;
      if (q) {
        const haystack = `${it.titulo || ''} ${it.url || ''} ${it.extracto || ''} ${it.dominio || ''}`.toLowerCase();
        if (!haystack.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, tipo, q]);

  const stats = useMemo(() => {
    const total = items.length;
    const dominios = new Set(items.map(i => i.dominio)).size;
    const prensa = items.filter(i => i.tipo === 'Prensa / Medio').length;
    const redes = items.filter(i => ['Instagram', 'TikTok', 'Facebook', 'YouTube', 'LinkedIn'].includes(i.tipo)).length;
    const alta = items.filter(i => i.autoridad === 'Alta (Emol, T13, BioBio, gov)').length;
    return { total, dominios, prensa, redes, alta };
  }, [items]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-poppins font-bold text-2xl text-gray-900">Backlinks & Menciones</h1>
          </div>
          <p className="text-sm text-gray-500 ml-11">Mapa completo de presencia de PEYU en internet</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSeed} disabled={seeding} variant="outline" className="rounded-xl gap-2">
            <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Importando...' : 'Importar encontrados en la web'}
          </Button>
          <Button onClick={handleExportCSV} className="rounded-xl gap-2 bg-gray-900 hover:bg-gray-800">
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total enlaces', val: stats.total, icon: Link2, color: 'from-teal-500 to-cyan-500' },
          { label: 'Dominios únicos', val: stats.dominios, icon: Globe, color: 'from-purple-500 to-pink-500' },
          { label: 'Prensa / Medios', val: stats.prensa, icon: Newspaper, color: 'from-amber-500 to-orange-500' },
          { label: 'Redes sociales', val: stats.redes, icon: IgIcon, color: 'from-pink-500 to-rose-500' },
          { label: 'Autoridad alta', val: stats.alta, icon: Star, color: 'from-yellow-400 to-amber-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-2 shadow`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-2xl font-poppins font-bold text-gray-900">{s.val}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar por título, dominio, extracto..."
            className="pl-10 h-10 rounded-xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map(t => (
            <button key={t} onClick={() => setTipo(t)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${tipo === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              {t} {t !== 'Todos' && `(${items.filter(i => i.tipo === t).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state / Seed */}
      {!loading && items.length === 0 && (
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-dashed border-teal-200 rounded-3xl p-10 text-center">
          <TrendingUp className="w-12 h-12 text-teal-500 mx-auto mb-3" />
          <h3 className="font-poppins font-bold text-lg text-gray-900 mb-1">Aún no hay backlinks cargados</h3>
          <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
            Ya hice una búsqueda exhaustiva en internet y encontré <strong>25+ enlaces reales</strong> de PEYU: prensa (Emol),
            Instagram (217K followers), TikTok, Facebook, menciones de BancoEstado y CNN Chile. Haz clic abajo para importarlos todos.
          </p>
          <Button onClick={handleSeed} disabled={seeding} className="rounded-xl gap-2 bg-gradient-to-r from-teal-500 to-cyan-500">
            <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Importando...' : 'Importar 25+ backlinks encontrados'}
          </Button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">Cargando...</p>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(it => <BacklinkCard key={it.id} item={it} />)}
        </div>
      ) : items.length > 0 && (
        <p className="text-center text-gray-400 py-10">No se encontraron resultados con los filtros actuales.</p>
      )}
    </div>
  );
}