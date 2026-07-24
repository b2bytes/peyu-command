import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { Rocket } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// FeatureFlagsPanel — Activación de módulos públicos desde el admin.
// Los módulos definidos aquí se crean solos (apagados) la primera vez.
// Encender el switch los hace visibles al público AL INSTANTE; apagarlo
// los oculta sin tocar código. Los próximos módulos (ej. checkout nuevo)
// se suman agregando una entrada a MODULOS.
// ════════════════════════════════════════════════════════════════════════
const MODULOS = [
  {
    clave: 'ruleta_descuento',
    nombre: 'Ruleta "Gira y gana" 🎡',
    detalle: 'Botón flotante en la portada: captura email y regala un cupón personal de un solo uso (válido 7 días, compra mínima $15.000).',
  },
  {
    clave: 'checkout_tema_verde',
    nombre: 'Checkout · plantilla Verde PEYU 💳',
    detalle: 'Nueva piel del checkout (escritorio y móvil) con la paleta de marca: fondo blanco, acción verde PEYU. Apagado = diseño actual Warm Dusk.',
  },
];

export default function FeatureFlagsPanel() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const rows = await base44.entities.FeatureFlag.list('-created_date', 100).catch(() => []);
      const byClave = Object.fromEntries((rows || []).map((r) => [r.clave, r]));
      // Auto-crea (apagados) los módulos que aún no existen
      const result = [];
      for (const m of MODULOS) {
        if (byClave[m.clave]) {
          result.push({ ...m, ...byClave[m.clave] });
        } else {
          const created = await base44.entities.FeatureFlag.create({
            clave: m.clave, nombre: m.nombre, detalle: m.detalle, activo: false,
          }).catch(() => null);
          if (created) result.push({ ...m, ...created });
        }
      }
      setFlags(result);
      setLoading(false);
    })();
  }, []);

  const toggle = async (flag) => {
    const nuevo = !flag.activo;
    setFlags((prev) => prev.map((f) => (f.id === flag.id ? { ...f, activo: nuevo } : f)));
    await base44.entities.FeatureFlag.update(flag.id, { activo: nuevo }).catch(() => {
      // revertir si falla
      setFlags((prev) => prev.map((f) => (f.id === flag.id ? { ...f, activo: flag.activo } : f)));
    });
  };

  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Rocket className="w-4 h-4 text-emerald-600" />
        <h2 className="font-bold text-sm">Activación de módulos públicos</h2>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Los módulos nuevos llegan <strong>apagados</strong>: nada se publica hasta que enciendas su switch. El cambio es inmediato en el sitio.
      </p>
      {loading ? (
        <p className="text-xs text-gray-400 py-3">Cargando…</p>
      ) : (
        <div className="space-y-2">
          {flags.map((f) => (
            <div key={f.clave} className="flex items-center gap-3 p-3 rounded-xl border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{f.nombre}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {f.activo ? 'PÚBLICO' : 'Apagado'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{f.detalle}</p>
              </div>
              <Switch checked={!!f.activo} onCheckedChange={() => toggle(f)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}