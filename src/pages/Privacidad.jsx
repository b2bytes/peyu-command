import SEO from '@/components/SEO';
import PublicFooter from '@/components/PublicFooter';

export default function Privacidad() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <SEO
        title="Política de Privacidad | PEYU Chile"
        description="Cómo PEYU Chile trata sus datos personales conforme a la Ley 19.628 sobre Protección de la Vida Privada."
        canonical="https://peyuchile.cl/privacidad"
      />
      <div className="max-w-3xl mx-auto px-5 py-14">
        <h1 className="font-poppins text-3xl font-black text-slate-900 mb-2">Política de Privacidad</h1>
        <p className="text-sm text-slate-500 mb-8">Última actualización: 19 de abril de 2026</p>

        <article className="prose prose-slate max-w-none text-[15px] leading-relaxed space-y-5">
          <h2 className="font-poppins font-bold text-xl mt-6">1. Responsable del tratamiento</h2>
          <p><strong>PEYU Chile SpA</strong>, con domicilio en F. Bilbao 3775, Providencia, Santiago. Contacto: ventas@peyuchile.cl.</p>

          <h2 className="font-poppins font-bold text-xl mt-6">2. Datos que recolectamos</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Datos de contacto: nombre, empresa, RUT, email, teléfono.</li>
            <li>Datos de envío: dirección, ciudad, comuna.</li>
            <li>Datos de compra: productos, cantidades, pagos (procesados por WebPay/MercadoPago, no almacenamos tarjetas).</li>
            <li>Archivos cargados: logos y briefs para personalización.</li>
            <li>Datos de navegación: cookies, IP, páginas visitadas (ver política de cookies).</li>
          </ul>

          <h2 className="font-poppins font-bold text-xl mt-6">3. Finalidad</h2>
          <p>Gestionar cotizaciones, ejecutar compras, producir pedidos personalizados, despachar, emitir documentos tributarios, enviar comunicaciones comerciales cuando existe consentimiento, y mejorar la experiencia del sitio.</p>

          <h2 className="font-poppins font-bold text-xl mt-6">4. Base legal</h2>
          <p>Ley N° 19.628 sobre Protección de la Vida Privada y sus modificaciones. El tratamiento se realiza con consentimiento del titular y/o porque es necesario para la ejecución del contrato.</p>

          <h2 className="font-poppins font-bold text-xl mt-6">5. Conservación</h2>
          <p>Conservamos los datos mientras exista relación comercial y por los plazos legales (documentos tributarios: mínimo 6 años según el SII).</p>

          <h2 className="font-poppins font-bold text-xl mt-6">6. Terceros</h2>
          <p>Compartimos datos estrictamente necesarios con: couriers (Starken, Chilexpress, Blue, Correos Chile), procesadores de pago (Transbank, MercadoPago), proveedores de email transaccional, y la plataforma Base44 que aloja el sitio. Ningún dato es vendido.</p>

          <h2 className="font-poppins font-bold text-xl mt-6">7. Sus derechos (ARCO)</h2>
          <p>Usted puede ejercer en cualquier momento los derechos de acceso, rectificación, cancelación y oposición enviando un correo a <a href="mailto:ventas@peyuchile.cl" className="text-teal-700 underline">ventas@peyuchile.cl</a>.</p>

          <h2 className="font-poppins font-bold text-xl mt-6">8. Seguridad</h2>
          <p>Aplicamos medidas técnicas y organizativas razonables para proteger la información. El sitio opera bajo HTTPS y los pagos se procesan en pasarelas certificadas PCI-DSS.</p>

          <h2 className="font-poppins font-bold text-xl mt-6">9. Menores</h2>
          <p>El sitio no está dirigido a menores de 14 años. Si se detecta un registro de un menor, será eliminado.</p>
        </article>
      </div>
      <PublicFooter />
    </div>
  );
}