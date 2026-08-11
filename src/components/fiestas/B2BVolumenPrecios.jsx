import { TrendingDown } from 'lucide-react';

// Precios por volumen a la vista: elimina la fricción de "pide cotización para
// saber el precio", que es donde se pierden los leads corporativos.
const TRAMOS = [
  { rango: '20 – 49 kits', desde: 25000, ahorro: '—' },
  { rango: '50 – 99 kits', desde: 22500, ahorro: '10%' },
  { rango: '100 – 249 kits', desde: 20000, ahorro: '20%' },
  { rango: '250 kits o más', desde: 17500, ahorro: '30%' },
];

export default function B2BVolumenPrecios({ onCotizar }) {
  return (
    <section className="max-w-3xl mx-auto px-5 pb-4">
      <h2 className="font-fraunces text-2xl sm:text-3xl text-center mb-3">Precios por volumen, sin misterio</h2>
      <p className="text-sm text-center mb-7" style={{ color: '#7A6050' }}>
        Referencia del Kit Corporativo Premium con grabado de tu logo incluido. Valores netos por kit.
      </p>

      <div className="rounded-3xl overflow-hidden" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
        {TRAMOS.map((t, i) => (
          <div
            key={t.rango}
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderTop: i ? '1px solid #EADFD2' : 'none' }}
          >
            <p className="flex-1 font-semibold text-sm">{t.rango}</p>
            <p className="font-fraunces text-lg">${t.desde.toLocaleString('es-CL')}</p>
            {t.ahorro !== '—' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full"
                style={{ background: 'rgba(62,142,110,.12)', color: '#3E8E6E' }}>
                <TrendingDown className="w-3 h-3" /> {t.ahorro}
              </span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onCotizar}
        className="mt-5 w-full h-13 py-3.5 rounded-2xl font-bold transition-all active:scale-[0.98]"
        style={{ background: '#2C1810', color: 'white' }}
      >
        Quiero mi precio exacto
      </button>
    </section>
  );
}