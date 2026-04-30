import SEO from '@/components/SEO';

export default function Cookies() {
  return (
    <div className="bg-white text-slate-800 pb-20 lg:pb-0">
      <SEO
        title="Política de Cookies | PEYU Chile"
        description="Uso de cookies en peyuchile.cl: cookies técnicas, analíticas y de marketing."
        canonical="https://peyuchile.cl/cookies"
      />
      <div className="max-w-3xl mx-auto px-5 py-14">
        <h1 className="font-poppins text-3xl font-black text-slate-900 mb-2">Política de Cookies</h1>
        <p className="text-sm text-slate-500 mb-8">Última actualización: 19 de abril de 2026</p>

        <article className="prose prose-slate max-w-none text-[15px] leading-relaxed space-y-5">
          <p>Peyuchile.cl utiliza cookies y tecnologías similares (localStorage) para ofrecer una mejor experiencia. Al continuar navegando, usted acepta su uso.</p>

          <h2 className="font-poppins font-bold text-xl mt-6">1. Qué son</h2>
          <p>Las cookies son pequeños archivos que se almacenan en su dispositivo para recordar preferencias, mantener sesiones y analizar el uso del sitio.</p>

          <h2 className="font-poppins font-bold text-xl mt-6">2. Tipos que usamos</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Técnicas (imprescindibles):</strong> carrito de compras, sesión del usuario, preferencias del chat Peyu.</li>
            <li><strong>Analíticas:</strong> medir páginas vistas y comportamiento (Google Analytics).</li>
            <li><strong>Marketing:</strong> campañas en Meta Ads, Google Ads y remarketing.</li>
          </ul>

          <h2 className="font-poppins font-bold text-xl mt-6">3. Cómo rechazarlas</h2>
          <p>Puede bloquear o eliminar cookies desde la configuración de su navegador (Chrome, Safari, Firefox, Edge). El bloqueo de cookies técnicas puede afectar funcionalidades como el carrito o el chat.</p>

          <h2 className="font-poppins font-bold text-xl mt-6">4. Duración</h2>
          <p>Las cookies de sesión se eliminan al cerrar el navegador. Las cookies persistentes duran entre 30 días y 2 años según su finalidad.</p>
        </article>
      </div>
    </div>
  );
}