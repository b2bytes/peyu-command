import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, Database, Search, Zap, CheckCircle2, AlertCircle, Loader2, Sparkles, Package, FileText, Palette, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const NS_META = {
  products:       { icon: Package,  label: 'Productos',      color: '#0F8B6C' },
  policies_faq:   { icon: FileText, label: 'FAQ / Políticas', color: '#0EA5E9' },
  brand_voice:    { icon: Palette,  label: 'Brand Voice',    color: '#8B5CF6' },
  sustainability: { icon: Leaf,     label: 'Sostenibilidad', color: '#10B981' },
  customers:      { icon: Database, label: 'Clientes 360°',  color: '#F59E0B' },
  conversations:  { icon: Brain,    label: 'Memoria Chat',   color: '#EC4899' },
};

export default function PineconeBrain() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);
  const [log, setLog] = useState([]);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const addLog = (type, msg) => setLog(prev => [...prev, { t: Date.now(), type, msg }]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('pineconeStatus', {});
      setStatus(res.data);
    } catch (e) {
      addLog('error', e.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadStatus(); }, []);

  const handleInit = async () => {
    setAction('init');
    addLog('info', '⚙️ Creando índice peyu-brain...');
    try {
      const res = await base44.functions.invoke('pineconeInit', {});
      addLog('success', res.data?.message || 'Índice creado');
      setTimeout(loadStatus, 2000);
    } catch (e) {
      addLog('error', e.message);
    }
    setAction(null);
  };

  const handleSeed = async () => {
    setAction('seed');
    addLog('info', '🌱 Vectorizando productos, FAQ, brand voice y ESG...');
    try {
      const res = await base44.functions.invoke('pineconeSeedAll', {});
      addLog('success', res.data?.message || 'Seed completo');
      if (res.data?.summary) {
        Object.entries(res.data.summary).forEach(([ns, n]) => addLog('info', `  · ${ns}: ${n} vectores`));
      }
      loadStatus();
    } catch (e) {
      addLog('error', e.message);
    }
    setAction(null);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await base44.functions.invoke('askPeyuBrain', { query, top_k: 5 });
      setSearchResults(res.data?.hits || []);
    } catch (e) {
      addLog('error', e.message);
    }
    setSearching(false);
  };

  const namespaces = status?.stats?.namespaces || {};
  const totalVectors = Object.values(namespaces).reduce((s, n) => s + (n?.vector_count || 0), 0);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            Peyu Brain · Pinecone
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Memoria vectorial AGI-grade · multilingual-e5-large (1024 dims)
          </p>
        </div>
        <Button onClick={loadStatus} variant="outline" size="sm">
          <Loader2 className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </Button>
      </div>

      {/* Status card */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold opacity-80">Estado del índice</p>
            <p className="text-2xl font-poppins font-black">peyu-brain</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-poppins font-black">{totalVectors.toLocaleString()}</p>
            <p className="text-xs opacity-80">vectores totales</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Consultando...</>
          ) : !status?.exists ? (
            <><AlertCircle className="w-4 h-4" /> Índice no creado</>
          ) : status?.ready ? (
            <><CheckCircle2 className="w-4 h-4" /> Ready · {status?.model} · {status?.dimension} dims</>
          ) : (
            <><Loader2 className="w-4 h-4 animate-spin" /> Provisionando (puede tardar 1 min)...</>
          )}
        </div>
      </div>

      {/* Namespaces grid */}
      {status?.exists && status?.ready && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(NS_META).map(([ns, meta]) => {
            const data = namespaces[ns];
            const Icon = meta.icon;
            const count = data?.vector_count || 0;
            return (
              <div key={ns} className="bg-white rounded-xl p-4 border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: meta.color }} />
                  <span className="font-semibold text-sm">{meta.label}</span>
                </div>
                <p className="font-poppins font-black text-2xl" style={{ color: meta.color }}>
                  {count.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  vectores · {ns}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
        <h2 className="font-poppins font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Acciones de administración
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          <ActionCard
            title="1️⃣ Inicializar índice"
            desc="Crea el índice peyu-brain serverless en Pinecone (solo una vez)."
            onClick={handleInit}
            disabled={action === 'init' || status?.exists}
            loading={action === 'init'}
            done={status?.exists}
            cta="Crear índice"
          />
          <ActionCard
            title="2️⃣ Vectorizar conocimiento"
            desc="Seed de productos, FAQ, brand voice y claims ESG. Idempotente."
            onClick={handleSeed}
            disabled={action === 'seed' || !status?.ready}
            loading={action === 'seed'}
            cta={totalVectors > 0 ? 'Re-sembrar (actualizar)' : 'Sembrar ahora'}
          />
        </div>
      </div>

      {/* Semantic playground */}
      {status?.ready && totalVectors > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
          <h2 className="font-poppins font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Playground · prueba tu Brain
          </h2>
          <div className="flex gap-2 mb-3">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Ej: regalo navidad empresa 200 unidades con logo..."
              className="h-10"
            />
            <Button onClick={handleSearch} disabled={searching || !query.trim()} className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white">
              <Search className="w-4 h-4" />
              {searching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {searchResults && searchResults.length > 0 && (
            <div className="space-y-2 mt-3">
              {searchResults.map((hit, i) => (
                <div key={hit.id + i} className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wide font-bold" style={{ color: NS_META[hit.namespace]?.color || '#666' }}>
                      {NS_META[hit.namespace]?.label || hit.namespace}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      score: {(hit.score || 0).toFixed(3)}
                    </span>
                  </div>
                  <p className="text-sm">{hit.chunk_text}</p>
                  {hit.sku && <p className="text-[11px] text-muted-foreground mt-1">SKU: {hit.sku}</p>}
                </div>
              ))}
            </div>
          )}
          {searchResults && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground italic">Sin resultados.</p>
          )}
        </div>
      )}

      {/* Activity log */}
      {log.length > 0 && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 text-xs font-mono max-h-64 overflow-y-auto">
          {log.slice().reverse().map(l => (
            <div key={l.t} className={
              l.type === 'error' ? 'text-red-400' :
              l.type === 'success' ? 'text-emerald-400' :
              'text-slate-300'
            }>
              [{new Date(l.t).toLocaleTimeString()}] {l.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionCard({ title, desc, onClick, disabled, loading, done, cta }) {
  return (
    <div className="border border-border rounded-xl p-3.5 bg-muted/20">
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 mb-3">{desc}</p>
      <Button onClick={onClick} disabled={disabled} size="sm" className="w-full gap-1.5">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
        {done ? 'Ya existe' : cta}
      </Button>
    </div>
  );
}