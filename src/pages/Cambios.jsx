import SEO from '@/components/SEO';
import LegalPage from '@/components/public/LegalPage';

export default function Cambios() {
  return (
    <>
      <SEO
        title="Cambios y Devoluciones | PEYU Chile"
        description="Política de cambios, devoluciones y garantía PEYU Chile conforme a la Ley del Consumidor."
        canonical="https://peyuchile.cl/cambios"
      />
      <LegalPage
        eyebrow="Política"
        title={<>Cambios y <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>devoluciones.</span></>}
        subtitle="Plazos, condiciones y proceso paso a paso"
      >
        <h2>Derecho de retracto (10 días)</h2>
        <p>Para compras en línea, la Ley 19.496 te da 10 días corridos desde la recepción del producto para retractarte, <strong>siempre que el producto esté sin uso y en su empaque original</strong>. El costo de la devolución es a cargo del consumidor, salvo que el producto llegue defectuoso.</p>

        <h2>Garantía legal (3 meses) y garantía PEYU (10 años)</h2>
        <p>Si el producto tiene defectos de fábrica, durante los primeros 3 meses puedes elegir entre cambio, reparación o devolución del dinero (triple opción LPC). Adicionalmente, PEYU ofrece 10 años de garantía por defectos de fabricación.</p>

        <h2>Productos personalizados</h2>
        <p>Los productos con grabado láser UV o fabricados a pedido <strong>no admiten retracto</strong>, salvo defecto de fábrica o error en el grabado no imputable al cliente (el mockup aprobado es la referencia).</p>

        <h2>Cómo iniciar un cambio o devolución</h2>
        <ol>
          <li>Escríbenos a <a href="mailto:ventas@peyuchile.cl">ventas@peyuchile.cl</a> con N° de pedido, foto del producto y motivo.</li>
          <li>Respondemos en 24 hrs hábiles con el procedimiento.</li>
          <li>Si aplica devolución del dinero, se realiza por transferencia o reverso de WebPay en un plazo máximo de 10 días hábiles.</li>
        </ol>

        <h2>Canje en tiendas físicas</h2>
        <p>Puedes acercarte a F. Bilbao 3775 (Providencia) o P. de Valdivia 6603 (Macul) con tu boleta o factura.</p>
      </LegalPage>
    </>
  );
}