import SEO from '@/components/SEO';
import LegalPage from '@/components/public/LegalPage';

export default function Terminos() {
  return (
    <>
      <SEO
        title="Términos y Condiciones | PEYU Chile"
        description="Términos y condiciones de uso de PEYU Chile SpA. Ley del Consumidor 19.496, condiciones de compra, personalización y garantía."
        canonical="https://peyuchile.cl/terminos"
      />
      <LegalPage
        eyebrow="Legal"
        title={<>Términos y <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>condiciones.</span></>}
        subtitle="Última actualización: 19 de abril de 2026"
      >
        <h2>1. Identificación del proveedor</h2>
        <p><strong>PEYU Chile SpA</strong>, dedicada a la fabricación y comercialización de productos hechos con plástico 100% reciclado, con tiendas en F. Bilbao 3775 (Providencia) y P. de Valdivia 6603 (Macul), Santiago de Chile. Contacto: ventas@peyuchile.cl · +56 9 3504 0242.</p>

        <h2>2. Aceptación</h2>
        <p>Al navegar, cotizar o comprar en peyuchile.cl, usted acepta estos términos. Esta relación se rige por la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores y demás normativa chilena aplicable.</p>

        <h2>3. Productos y disponibilidad</h2>
        <p>Todos los productos son fabricados en Chile con plástico 100% reciclado. Las imágenes son referenciales; los colores pueden variar ligeramente por tratarse de material reciclado (no es un defecto, es parte de su carácter único). La disponibilidad está sujeta a stock y a los plazos de producción indicados en cada ficha.</p>

        <h2>4. Precios y pagos</h2>
        <p>Los precios están expresados en pesos chilenos (CLP) e incluyen IVA. Para pedidos B2B sobre 50 unidades se aplica pricing corporativo según volumen. Los pagos B2B se efectúan con 50% de anticipo y 50% contra entrega, salvo acuerdo distinto. Medios: transferencia, WebPay, débito y crédito.</p>

        <h2>5. Personalización láser UV</h2>
        <p>La personalización (grabado láser UV) es gratuita desde 10 unidades. El cliente debe enviar el archivo vectorial del logo en formato SVG, AI o PDF. PEYU enviará un mockup digital de aprobación antes de producir. Una vez aprobado el mockup, no se aceptan cambios y los pedidos personalizados no son reembolsables.</p>

        <h2>6. Plazos de entrega</h2>
        <p>Productos en stock sin personalización: 2 a 5 días hábiles en Santiago, 5 a 10 días hábiles en regiones. Pedidos personalizados: 10 a 15 días hábiles desde la aprobación del mockup y el pago del anticipo. Los plazos son estimados y pueden variar por volumen o temporada.</p>

        <h2>7. Derecho de retracto y cambios</h2>
        <p>Conforme al art. 3 bis de la Ley 19.496, el consumidor tiene 10 días corridos desde la recepción para retractarse en compras a distancia, salvo productos personalizados o hechos a pedido (excluidos por su naturaleza). Ver política completa en <a href="/cambios">/cambios</a>.</p>

        <h2>8. Garantía</h2>
        <p>Todos los productos PEYU cuentan con garantía de 10 años por defectos de fábrica. No cubre mal uso, caídas, corte, quemaduras ni desgaste normal.</p>

        <h2>9. Propiedad intelectual</h2>
        <p>Los diseños, moldes, fotografías y contenidos de peyuchile.cl son propiedad de PEYU Chile SpA. El cliente es responsable de contar con los derechos de uso de los logos que solicite grabar.</p>

        <h2>10. Modificaciones y jurisdicción</h2>
        <p>PEYU podrá actualizar estos términos publicando la nueva versión en esta página. Cualquier controversia se somete a los tribunales de Santiago, sin perjuicio de los derechos del consumidor ante SERNAC.</p>
      </LegalPage>
    </>
  );
}