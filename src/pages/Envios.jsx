import SEO from '@/components/SEO';
import LegalPage from '@/components/public/LegalPage';
import {
  CUTOFF_TIME,
  HANDLING_DAYS,
  SHIPPING_ZONES,
  FREE_SHIPPING_THRESHOLD_CLP,
  FLAT_SHIPPING_CLP,
  totalDeliveryRange,
} from '@/lib/delivery-promise';

const formatRange = (r) => (r.min === r.max ? `${r.min}` : `${r.min}–${r.max}`);
const formatCLP = (n) => '$' + n.toLocaleString('es-CL');

export default function Envios() {
  return (
    <>
      <SEO
        title="Envíos y Despachos | PEYU Chile"
        description="Plazos, tarifas y cobertura nacional. Envíos con BlueExpress a todo Chile. Mismas promesas de entrega que verás en Google Shopping."
        canonical="https://peyuchile.cl/envios"
      />
      <LegalPage
        eyebrow="Logística"
        title={<>Envíos a <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>todo Chile.</span></>}
        subtitle="Plazos, tarifas y cobertura nacional · BlueExpress Express"
      >
        <h2>Cobertura</h2>
        <p>Enviamos a todo Chile mediante <strong>BlueExpress Express</strong> como courier principal. También retiro presencial en nuestras tiendas de Providencia y Macul.</p>

        <h2>Hora de corte</h2>
        <p>
          <strong>{CUTOFF_TIME} hrs</strong> (hora Santiago, GMT-04:00). Pedidos pagados antes de esta hora salen el <strong>mismo día</strong>. Pedidos posteriores se despachan al día hábil siguiente.
        </p>

        <h2>Plazos por zona</h2>
        <ul>
          {SHIPPING_ZONES.map((z) => {
            const total = totalDeliveryRange(z.id);
            return (
              <li key={z.id}>
                <strong>{z.label}</strong>: {formatRange(total)} días hábiles
                <span style={{ color: 'var(--ld-fg-muted)' }}> · ({formatRange(HANDLING_DAYS)} preparación + {formatRange(z.transitDays)} tránsito)</span>
              </li>
            );
          })}
          <li><strong>Retiro en tienda</strong> (Providencia o Macul): mismo día o día siguiente.</li>
          <li><strong>Pedidos con personalización láser</strong>: sume 7 a 15 días hábiles de producción.</li>
        </ul>

        <h2>Tarifas</h2>
        <p>
          Tarifa plana de <strong>{formatCLP(FLAT_SHIPPING_CLP)}</strong> a todo Chile.{' '}
          <strong>Envío gratuito sobre {formatCLP(FREE_SHIPPING_THRESHOLD_CLP)}</strong>.
          El costo final puede variar según peso real y destino y se confirma al checkout.
        </p>

        <h2>Días hábiles de procesamiento y reparto</h2>
        <ul>
          <li><strong>Preparamos pedidos</strong>: lunes a viernes (BlueExpress no retira sábados).</li>
          <li><strong>BlueExpress entrega</strong>: lunes a sábado (no domingos ni festivos).</li>
          <li>Si tu pedido cae en festivo, la entrega estimada se ajusta automáticamente.</li>
        </ul>

        <h2>Seguimiento</h2>
        <p>Una vez despachado, recibirás un N° de tracking por email. Puedes consultarlo también en <a href="/seguimiento">/seguimiento</a> con tu N° de pedido.</p>

        <h2>Retiro en tienda</h2>
        <p>
          Sin costo. Lunes a viernes 10:00–19:00, sábados 11:00–14:00.<br />
          📍 <strong>Providencia</strong>: Av. Francisco Bilbao 3775<br />
          📍 <strong>Macul</strong>: Av. Pedro de Valdivia 6603
        </p>

        <h2>Consistencia con Google Shopping</h2>
        <p style={{ color: 'var(--ld-fg-muted)', fontSize: '0.9em' }}>
          Los plazos publicados aquí son los mismos que comunicamos a Google Shopping y Merchant Center. Si ves una promesa distinta en una ad, prevalece la información de esta página.
        </p>
      </LegalPage>
    </>
  );
}