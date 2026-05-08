import SEO from '@/components/SEO';
import LegalPage from '@/components/public/LegalPage';

export default function Cambios() {
  return (
    <>
      <SEO
        title="Cambios y Devoluciones | PEYU Chile"
        description="Política de cambios, devoluciones, reembolsos y garantía PEYU Chile. Hasta 30 días para devolver. Cumple Ley 19.496 y Ley 21.398 Pro-Consumidor."
        canonical="https://peyuchile.cl/cambios"
      />
      <LegalPage
        eyebrow="Política de Devoluciones"
        title={<>Cambios y <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>devoluciones.</span></>}
        subtitle="30 días para devolver · Cumple Ley del Consumidor 19.496 · Pro-Consumidor 21.398"
      >
        <h2>Resumen rápido</h2>
        <ul>
          <li><strong>Plazo para devolver:</strong> 30 días corridos desde la recepción.</li>
          <li><strong>Plazo para reembolso:</strong> hasta 14 días hábiles tras recibir el producto en bodega.</li>
          <li><strong>Aceptamos:</strong> productos defectuosos y no defectuosos (arrepentimiento).</li>
          <li><strong>Cambios:</strong> sí, por talla, color, modelo o producto distinto.</li>
          <li><strong>Excepciones:</strong> productos personalizados con grabado láser y Gift Cards canjeadas.</li>
        </ul>

        <h2>1. Plazos para devolver o cambiar</h2>
        <p>Tienes <strong>30 días corridos</strong> desde la recepción de tu pedido para solicitar una devolución o cambio. Este plazo amplía lo exigido por la Ley 21.398 Pro-Consumidor (10 días) y por la Ley 19.496 (6 meses para defectos de fábrica).</p>

        <h2>2. Condiciones del producto a devolver</h2>
        <ul>
          <li>Producto <strong>sin uso</strong>, limpio y en buen estado.</li>
          <li>Empaque original conservado (caja, bolsas, tags y etiquetas).</li>
          <li>Acompañado de boleta, factura o N° de pedido como comprobante.</li>
          <li>Para productos defectuosos: foto/video del defecto en el primer contacto.</li>
        </ul>

        <h2>3. Costo del envío de retorno</h2>
        <ul>
          <li><strong>Producto defectuoso o error nuestro:</strong> PEYU asume el 100% del courier de retorno.</li>
          <li><strong>Arrepentimiento (no defectuoso):</strong> el cliente asume el costo del envío de retorno.</li>
          <li><strong>Cambio por talla/color/modelo:</strong> cliente paga retorno, PEYU paga el reenvío del nuevo producto.</li>
          <li><strong>Retiro presencial gratuito</strong> en nuestras tiendas de Providencia y Macul.</li>
        </ul>

        <h2>4. Métodos de reembolso</h2>
        <p>El reembolso se realiza por <strong>el mismo medio de pago utilizado en la compra</strong>:</p>
        <ul>
          <li><strong>WebPay / tarjeta de crédito o débito:</strong> reverso al mismo plástico (3-10 días hábiles según banco).</li>
          <li><strong>Transferencia bancaria:</strong> devolución a la cuenta original del cliente.</li>
          <li><strong>MercadoPago:</strong> reembolso a la cuenta MP o medio asociado.</li>
          <li><strong>Gift Card:</strong> emisión de nueva Gift Card por el monto devuelto.</li>
        </ul>
        <p>Plazo total: hasta <strong>14 días hábiles</strong> desde que recibimos el producto en bodega y validamos su estado.</p>

        <h2>5. Productos NO devolvibles</h2>
        <p>Por excepción legal y razones de personalización, no admiten retracto:</p>
        <ul>
          <li>Productos con <strong>grabado láser UV personalizado</strong> (logo, texto o diseño del cliente).</li>
          <li>Productos fabricados a pedido bajo brief específico del cliente.</li>
          <li><strong>Gift Cards ya canjeadas</strong> total o parcialmente.</li>
          <li>Productos higiénicos abiertos (bombillas, vasos personales sellados al recibir).</li>
        </ul>
        <p><strong>Excepción:</strong> si el grabado tiene defecto técnico o error no imputable al cliente (el mockup aprobado es la referencia oficial), aplica garantía y reposición sin costo.</p>

        <h2>6. Garantía legal y garantía extendida PEYU</h2>
        <ul>
          <li><strong>Garantía legal (Ley 19.496):</strong> 6 meses para defectos de fábrica, con triple opción a tu elección — cambio, reparación o devolución del dinero.</li>
          <li><strong>Garantía extendida PEYU:</strong> <strong>10 años</strong> contra defectos estructurales del plástico reciclado en condiciones normales de uso.</li>
        </ul>

        <h2>7. Cómo iniciar una devolución o cambio</h2>
        <ol>
          <li>Contáctanos por cualquiera de estos canales:
            <ul>
              <li>📧 Email: <a href="mailto:hola@peyuchile.cl">hola@peyuchile.cl</a></li>
              <li>📱 WhatsApp: <a href="https://wa.me/56935040242">+56 9 3504 0242</a></li>
              <li>🌐 Formulario: <a href="/soporte">/soporte</a></li>
            </ul>
          </li>
          <li>Indica en el asunto: <strong>"Devolución pedido #XXXX"</strong> o <strong>"Cambio pedido #XXXX"</strong>.</li>
          <li>Adjunta: N° de pedido, motivo, fotos del producto y producto deseado (si es cambio).</li>
          <li>Respondemos en <strong>menos de 24 hrs hábiles</strong> con instrucciones de envío o coordinación de retiro.</li>
          <li>Recibido el producto y validado su estado, procesamos el reembolso o cambio en máximo 14 días hábiles.</li>
        </ol>

        <h2>8. Canje en tiendas físicas (sin costo)</h2>
        <p>Puedes acercarte presencialmente con tu boleta o factura:</p>
        <ul>
          <li>📍 <strong>Providencia:</strong> Av. Francisco Bilbao 3775 · Lun-Vie 10:00-19:00 · Sáb 11:00-14:00.</li>
          <li>📍 <strong>Macul:</strong> Av. Pedro de Valdivia 6603 · Lun-Vie 10:00-19:00 · Sáb 11:00-14:00.</li>
        </ul>

        <h2>9. Marco legal aplicable</h2>
        <ul>
          <li><strong>Ley 19.496</strong> sobre Protección de los Derechos de los Consumidores.</li>
          <li><strong>Ley 21.398</strong> Pro-Consumidor (compras a distancia y derecho de retracto).</li>
          <li><strong>Sernac:</strong> en caso de discrepancia, puedes acudir a <a href="https://www.sernac.cl" target="_blank" rel="noopener noreferrer">www.sernac.cl</a>.</li>
        </ul>

        <p style={{ color: 'var(--ld-fg-muted)', fontSize: '0.85em', marginTop: '2rem' }}>
          Última actualización: mayo 2026. PEYU Chile · contacto@peyuchile.cl
        </p>
      </LegalPage>
    </>
  );
}