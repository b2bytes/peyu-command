import SEO from '@/components/SEO';
import PublicFooter from '@/components/PublicFooter';

export default function Cambios() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <SEO
        title="Cambios y Devoluciones | PEYU Chile"
        description="Política de cambios, devoluciones y garantía PEYU Chile conforme a la Ley del Consumidor."
        canonical="https://peyuchile.cl/cambios"
      />
      <div className="max-w-3xl mx-auto px-5 py-14">
        <h1 className="font-poppins text-3xl font-black text-slate-900 mb-2">Cambios y Devoluciones</h1>
        <p className="text-sm text-slate-500 mb-8">Plazos, condiciones y proceso paso a paso</p>

        <article className="prose prose-slate max-w-none text-[15px] leading-relaxed space-y-5">
          <h2 className="font-poppins font-bold text-xl mt-6">Derecho de retracto (10 días)</h2>
          <p>Para compras en línea, la Ley 19.496 te da 10 días corridos desde la recepción del producto para retractarte, <strong>siempre que el producto esté sin uso y en su empaque original</strong>. El costo de la devolución es a cargo del consumidor, salvo que el producto llegue defectuoso.</p>

          <h2 className="font-poppins font-bold text-xl mt-6">Garantía legal (3 meses) y garantía PEYU (10 años)</h2>
          <p>Si el producto tiene defectos de fábrica, durante los primeros 3 meses puedes elegir entre cambio, reparación o devolución del dinero (triple opción LPC). Adicionalmente, PEYU ofrece 10 años de garantía por defectos de fabricación.</p>

          <h2 className="font-poppins font-bold text-xl mt-6">Productos personalizados</h2>
          <p>Los productos con grabado láser UV o fabricados a pedido <strong>no admiten retracto</strong>, salvo defecto de fábrica o error en el grabado no imputable al cliente (el mockup aprobado es la referencia).</p>

          <h2 className="font-poppins font-bold text-xl mt-6">Cómo iniciar un cambio o devolución</h2>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Escríbenos a <a href="mailto:ventas@peyuchile.cl" className="text-teal-700 underline">ventas@peyuchile.cl</a> con N° de pedido, foto del producto y motivo.</li>
            <li>Respondemos en 24 hrs hábiles con el procedimiento.</li>
            <li>Si aplica devolución del dinero, se realiza por transferencia o reverso de WebPay en un plazo máximo de 10 días hábiles.</li>
          </ol>

          <h2 className="font-poppins font-bold text-xl mt-6">Canje en tiendas físicas</h2>
          <p>Puedes acercarte a F. Bilbao 3775 (Providencia) o P. de Valdivia 6603 (Macul) con tu boleta o factura.</p>
        </article>
      </div>
      <PublicFooter />
    </div>
  );
}