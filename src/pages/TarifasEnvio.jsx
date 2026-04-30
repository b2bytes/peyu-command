import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Truck, Search, Upload, RefreshCw, Loader2, Zap, Rocket, MapPin, Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cotizarEnvioAmbos } from '@/lib/bluex-shipping';

const TRAMOS = [
  { key: 'tarifa_base', label: '0 – 0.5 kg' },
  { key: 'tarifa_2kg', label: '0.5 – 1.5 kg' },
  { key: 'tarifa_3kg', label: '1.5 – 3 kg' },
  { key: 'tarifa_5kg', label: '3 – 6 kg' },
  { key: 'tarifa_10kg', label: '6 – 10 kg' },
  { key: 'tarifa_15kg', label: '10 – 16 kg' },
  { key: 'tarifa_25kg', label: '16 – 60 kg' },
];

export default function TarifasEnvio() {
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [servicio, setServicio] = useState('EXPRESS');
  const [reimporting, setReimporting] = useState(false);

  // Calculadora rápida
  const [calcComuna, setCalcComuna] = useState('Las Condes');
  const [calcPeso, setCalcPeso] = useState(0.5);
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.TarifaBluex.filter({ servicio }, 'comuna', 500);
    setTarifas(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [servicio]);

  const filtered = useMemo(() => {
    if (!search) return tarifas;
    const q = search.toLowerCase();
    return tarifas.filter(t =>
      t.comuna?.toLowerCase().includes(q) ||
      t.region?.toLowerCase().includes(q)
    );
  }, [tarifas, search]);

  const handleCotizar = async () => {
    setCalcLoading(true);
    try {
      const res = await cotizarEnvioAmbos({ comuna: calcComuna, pesoKg: parseFloat(calcPeso) || 0.5 });
      setCalcResult(res);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleReimportar = async (servicioImport, fileUrl) => {
    setReimporting(true);
    try {
      const res = await base44.functions.invoke('importBluexTarifas', {
        file_url: fileUrl,
        servicio: servicioImport,
        replace: true,
      });
      if (res.data?.ok) {
        toast.success(`${servicioImport} re-importado · ${res.data.registros_creados} comunas`);
        load();
      } else {
        toast.error(res.data?.error || 'Error al importar');
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setReimporting(false);
    }
  };

  const stats = useMemo(() => {
    const conTarifa = tarifas.filter(t => t.tarifa_base > 0).length;
    const totalRegiones = new Set(tarifas.map(t => t.region).filter(Boolean)).size;
    const promedio = tarifas.filter(t => t.tarifa_base > 0).reduce((s, t) => s + t.tarifa_base, 0) / (conTarifa || 1);
    return { total: tarifas.length, conTarifa, totalRegiones, promedio: Math.round(promedio) };
  }, [tarifas]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-7 h-7 text-blue-600" /> Tarifas de Envío · BlueExpress
            </h1>
            <p className="text-sm text-gray-600">Tarifario oficial por comuna importado desde Excel. Usado en checkout B2C/B2B.</p>
          </div>
          <Button onClick={load} variant="outline" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat icon={MapPin} label="Comunas registradas" value={stats.total} color="blue" />
          <Stat icon={Zap} label="Con tarifa activa" value={stats.conTarifa} color="green" />
          <Stat icon={MapPin} label="Regiones cubiertas" value={stats.totalRegiones} color="purple" />
          <Stat icon={Calculator} label="Tarifa promedio (0.5kg)" value={`$${stats.promedio.toLocaleString('es-CL')}`} color="amber" />
        </div>

        {/* Calculadora rápida */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600" /> Calculadora rápida
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Comuna destino</label>
              <Input value={calcComuna} onChange={e => setCalcComuna(e.target.value)} placeholder="Ej: Las Condes" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Peso (kg)</label>
              <Input type="number" step="0.1" value={calcPeso} onChange={e => setCalcPeso(e.target.value)} />
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button onClick={handleCotizar} disabled={calcLoading} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                {calcLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                Cotizar envío
              </Button>
            </div>
          </div>
          {calcResult && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <CalcResultCard servicio="EXPRESS" data={calcResult.express} icon={Zap} color="teal" />
              <CalcResultCard servicio="PRIORITY" data={calcResult.priority} icon={Rocket} color="purple" />
            </div>
          )}
        </div>

        {/* Selector servicio + búsqueda + reimport */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={servicio} onValueChange={setServicio}>
            <SelectTrigger className="w-44 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPRESS">EXPRESS</SelectItem>
              <SelectItem value="PRIORITY">PRIORITY</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por comuna o región..." className="pl-9 bg-white" />
          </div>
          <Button
            onClick={() => handleReimportar('EXPRESS', 'https://media.base44.com/files/public/69d99b9d61f699701129c103/5e9d3e950_Tarifarios_Ecommerce_EXPRESS_Personalizado1.xlsx')}
            disabled={reimporting} variant="outline" size="sm" className="gap-2">
            <Upload className="w-3.5 h-3.5" /> Re-importar EXPRESS
          </Button>
          <Button
            onClick={() => handleReimportar('PRIORITY', 'https://media.base44.com/files/public/69d99b9d61f699701129c103/86acc435f_Tarifarios_Ecommerce_PRIORITY_Personalizado5.xlsx')}
            disabled={reimporting} variant="outline" size="sm" className="gap-2">
            <Upload className="w-3.5 h-3.5" /> Re-importar PRIORITY
          </Button>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-bold text-gray-700">Región</th>
                  <th className="text-left p-3 font-bold text-gray-700">Comuna</th>
                  {TRAMOS.map(t => (
                    <th key={t.key} className="text-right p-3 font-bold text-gray-700 whitespace-nowrap">{t.label}</th>
                  ))}
                  <th className="text-center p-3 font-bold text-gray-700">Promesa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={10} className="p-8 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Cargando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-gray-400">Sin resultados</td></tr>
                ) : filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{t.region}</td>
                    <td className="p-3 font-semibold text-gray-900">{t.comuna}</td>
                    {TRAMOS.map(tr => (
                      <td key={tr.key} className="p-3 text-right tabular-nums">
                        {t[tr.key] > 0 ? (
                          <span className="text-gray-900">${t[tr.key].toLocaleString('es-CL')}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                    <td className="p-3 text-center text-xs text-gray-500">
                      {t.lead_time_dias ? `${t.lead_time_dias}d` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Mostrando {filtered.length} de {tarifas.length} comunas · Servicio {servicio}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-fuchsia-500',
    amber: 'from-amber-500 to-orange-500',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${colors[color]} text-white flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function CalcResultCard({ servicio, data, icon: Icon, color }) {
  const tones = {
    teal: 'from-teal-50 to-cyan-50 border-teal-200 text-teal-700',
    purple: 'from-purple-50 to-fuchsia-50 border-purple-200 text-purple-700',
  };
  if (!data) {
    return (
      <div className={`bg-gradient-to-br ${tones[color]} border rounded-xl p-4`}>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4" />
          <span className="font-bold text-sm">{servicio}</span>
        </div>
        <p className="text-xs text-gray-500">Sin tarifa para esa comuna</p>
      </div>
    );
  }
  return (
    <div className={`bg-gradient-to-br ${tones[color]} border rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="font-bold text-sm">{servicio}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">${data.costo.toLocaleString('es-CL')}</p>
      <p className="text-xs text-gray-600 mt-1">{data.comuna} · {data.region}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">Tramo: {data.tramo} · {data.peso_kg}kg</p>
    </div>
  );
}