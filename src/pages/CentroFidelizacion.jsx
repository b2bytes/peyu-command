import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Tag, Gift, Mail, Users, ExternalLink } from 'lucide-react';
import CuponFormModal from '@/components/fidelizacion/CuponFormModal';
import CuponRow from '@/components/fidelizacion/CuponRow';

// ════════════════════════════════════════════════════════════════════════
// /admin/fidelizacion — Centro de Fidelización: cupones (crear/activar),
// resultados de la ruleta "Gira y gana" y estado del remarketing por email.
// ════════════════════════════════════════════════════════════════════════
const KPI = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-white border rounded-2xl p-4">
    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><Icon className="w-3.5 h-3.5" /> {label}</div>
    <p className="text-2xl font-bold">{value}</p>
    {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// Automatizaciones de remarketing existentes (informativo, viven en Secuencias)
const REMARKETING = [
  { nombre: 'Recuperación de carritos abandonados', detalle: '3 toques por email: 3h recordatorio · 22h cupón 10% · 50h último aviso', estado: 'Activa' },
  { nombre: 'Recompra post-entrega (~21 días)', detalle: 'Email de recompra a clientes que ya recibieron su pedido', estado: 'Activa' },
  { nombre: 'Secuencia post-cotización B2B', detalle: 'Recordatorios día 2, 5 y 12 a cotizaciones sin aprobar', estado: 'Revisar' },
];

export default function CentroFidelizacion() {
  const [cupones, setCupones] = useState([]);
  const [suscriptores, setSuscriptores] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const cargar = () => {
    base44.entities.Cupon.list('-created_date', 300)
      .then((rows) => { setCupones(rows || []); setLoading(false); })
      .catch(() => setLoading(false));
    base44.entities.Suscriptor.list('-created_date', 500)
      .then((rows) => setSuscriptores((rows || []).length))
      .catch(() => {});
  };
  useEffect(cargar, []);

  const manuales = useMemo(() => cupones.filter((c) => c.origen !== 'ruleta'), [cupones]);
  const ruleta = useMemo(() => cupones.filter((c) => c.origen === 'ruleta'), [cupones]);
  const ruletaUsados = useMemo(() => ruleta.filter((c) => (c.usos_actuales || 0) > 0).length, [ruleta]);

  const toggle = async (cupon) => {
    await base44.entities.Cupon.update(cupon.id, { activo: !cupon.activo });
    setCupones((prev) => prev.map((c) => (c.id === cupon.id ? { ...c, activo: !c.activo } : c)));
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Centro de Fidelización</h1>
          <p className="text-sm text-gray-500">Cupones, ruleta "Gira y gana" y remarketing por email</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-1.5" /> Nuevo cupón</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={Tag} label="Cupones activos" value={cupones.filter((c) => c.activo).length} sub={`${cupones.length} en total`} />
        <KPI icon={Gift} label="Giros de ruleta" value={ruleta.length} sub={`${ruletaUsados} canjeados en compras`} />
        <KPI icon={Users} label="Suscriptores" value={suscriptores} sub="capturados (todas las fuentes)" />
        <KPI icon={Mail} label="Conversión ruleta" value={ruleta.length ? `${Math.round((ruletaUsados / ruleta.length) * 100)}%` : '—'} sub="giros que terminaron en compra" />
      </div>

      <Tabs defaultValue="cupones">
        <TabsList>
          <TabsTrigger value="cupones">Cupones ({manuales.length})</TabsTrigger>
          <TabsTrigger value="ruleta">Ruleta ({ruleta.length})</TabsTrigger>
          <TabsTrigger value="remarketing">Remarketing</TabsTrigger>
        </TabsList>

        <TabsContent value="cupones" className="space-y-2 mt-3">
          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Cargando…</p>
          ) : manuales.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Aún no hay cupones. Crea el primero con "Nuevo cupón".</p>
          ) : (
            manuales.map((c) => <CuponRow key={c.id} cupon={c} onToggle={toggle} />)
          )}
        </TabsContent>

        <TabsContent value="ruleta" className="space-y-2 mt-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            🎡 La ruleta vive en la portada de la tienda: captura el email del visitante, el premio se decide en el servidor
            (probabilidades escalonadas) y emite un cupón personal de un solo uso, válido 7 días, con compra mínima $15.000.
          </div>
          {ruleta.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Todavía nadie ha girado la ruleta.</p>
          ) : (
            ruleta.map((c) => <CuponRow key={c.id} cupon={c} onToggle={toggle} />)
          )}
        </TabsContent>

        <TabsContent value="remarketing" className="space-y-2 mt-3">
          {REMARKETING.map((r) => (
            <div key={r.nombre} className="flex items-center gap-3 p-3 rounded-xl border bg-white">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{r.nombre}</p>
                <p className="text-xs text-gray-500">{r.detalle}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.estado === 'Activa' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {r.estado}
              </span>
            </div>
          ))}
          <Link to="/admin/secuencias" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline mt-1">
            Administrar secuencias automáticas <ExternalLink className="w-3 h-3" />
          </Link>
        </TabsContent>
      </Tabs>

      <CuponFormModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={cargar} />
    </div>
  );
}