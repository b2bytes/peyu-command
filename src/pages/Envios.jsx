import SEO from '@/components/SEO';
import LegalPage from '@/components/public/LegalPage';

export default function Envios() {
  return (
    <>
      <SEO
        title="Envíos y Despachos | PEYU Chile"
        description="Tarifas, plazos y couriers para envíos PEYU Chile: Starken, Chilexpress, Blue Express y Correos Chile."
        canonical="https://peyuchile.cl/envios"
      />
      <LegalPage
        eyebrow="Logística"
        title={<>Envíos a <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>todo Chile.</span></>}
        subtitle="Plazos, tarifas y cobertura nacional"
      >
        <h2>Cobertura</h2>
        <p>Enviamos a todo Chile mediante Starken, Chilexpress, Blue Express y Correos Chile. Santiago con entrega propia para pedidos B2B sobre 50 unidades.</p>

        <h2>Plazos referenciales</h2>
        <ul>
          <li><strong>Retiro en tienda</strong> (Providencia o Macul): mismo día o día siguiente.</li>
          <li><strong>Santiago</strong>: 2 a 3 días hábiles.</li>
          <li><strong>Regiones principales</strong> (V, VIII, IV): 3 a 5 días hábiles.</li>
          <li><strong>Extremos</strong> (Arica, Magallanes, Aysén): 7 a 10 días hábiles.</li>
          <li><strong>Pedidos personalizados</strong>: sume 10 a 15 días hábiles de producción.</li>
        </ul>

        <h2>Tarifas</h2>
        <p>El costo se calcula al momento del checkout según peso, volumen y destino. Envío gratuito en Santiago para compras sobre $80.000 CLP.</p>

        <h2>Seguimiento</h2>
        <p>Una vez despachado, recibirás un N° de tracking por email. Puedes consultarlo también en <a href="/seguimiento">/seguimiento</a>.</p>

        <h2>Retiro en tienda</h2>
        <p>Sin costo. Horario: lunes a viernes 10:00–19:00, sábado 11:00–14:00.</p>
      </LegalPage>
    </>
  );
}