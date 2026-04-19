import SEO from '@/components/SEO';
import PublicFooter from '@/components/PublicFooter';

export default function Envios() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <SEO
        title="Envíos y Despachos | PEYU Chile"
        description="Tarifas, plazos y couriers para envíos PEYU Chile: Starken, Chilexpress, Blue Express y Correos Chile."
        canonical="https://peyuchile.cl/envios"
      />
      <div className="max-w-3xl mx-auto px-5 py-14">
        <h1 className="font-poppins text-3xl font-black text-slate-900 mb-2">Envíos y Despachos</h1>
        <p className="text-sm text-slate-500 mb-8">Plazos, tarifas y cobertura nacional</p>

        <article className="prose prose-slate max-w-none text-[15px] leading-relaxed space-y-5">
          <h2 className="font-poppins font-bold text-xl mt-6">Cobertura</h2>
          <p>Enviamos a todo Chile mediante Starken, Chilexpress, Blue Express y Correos Chile. Santiago con entrega propia para pedidos B2B sobre 50 unidades.</p>

          <h2 className="font-poppins font-bold text-xl mt-6">Plazos referenciales</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Retiro en tienda</strong> (Providencia o Macul): mismo día o día siguiente.</li>
            <li><strong>Santiago</strong>: 2 a 3 días hábiles.</li>
            <li><strong>Regiones principales</strong> (V, VIII, IV): 3 a 5 días hábiles.</li>
            <li><strong>Extremos</strong> (Arica, Magallanes, Aysén): 7 a 10 días hábiles.</li>
            <li><strong>Pedidos personalizados</strong>: sume 10 a 15 días hábiles de producción.</li>
          </ul>

          <h2 className="font-poppins font-bold text-xl mt-6">Tarifas</h2>
          <p>El costo se calcula al momento del checkout según peso, volumen y destino. Envío gratuito en Santiago para compras sobre $80.000 CLP.</p>

          <h2 className="font-poppins font-bold text-xl mt-6">Seguimiento</h2>
          <p>Una vez despachado, recibirás un N° de tracking por email. Puedes consultarlo también en <a href="/seguimiento" className="text-teal-700 underline">/seguimiento</a>.</p>

          <h2 className="font-poppins font-bold text-xl mt-6">Retiro en tienda</h2>
          <p>Sin costo. Horario: lunes a viernes 10:00–19:00, sábado 11:00–14:00.</p>
        </article>
      </div>
      <PublicFooter />
    </div>
  );
}