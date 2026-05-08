import SEO from '@/components/SEO';
import LegalPage from '@/components/public/LegalPage';

export default function Cookies() {
  return (
    <>
      <SEO
        title="Política de Cookies | PEYU Chile"
        description="Uso de cookies en peyuchile.cl: cookies técnicas, analíticas y de marketing."
        canonical="https://peyuchile.cl/cookies"
      />
      <LegalPage
        eyebrow="Legal"
        title={<>Política de <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>cookies.</span></>}
        subtitle="Última actualización: 19 de abril de 2026"
      >
        <p>Peyuchile.cl utiliza cookies y tecnologías similares (localStorage) para ofrecer una mejor experiencia. Al continuar navegando, usted acepta su uso.</p>

        <h2>1. Qué son</h2>
        <p>Las cookies son pequeños archivos que se almacenan en su dispositivo para recordar preferencias, mantener sesiones y analizar el uso del sitio.</p>

        <h2>2. Tipos que usamos</h2>
        <ul>
          <li><strong>Técnicas (imprescindibles):</strong> carrito de compras, sesión del usuario, preferencias del chat Peyu.</li>
          <li><strong>Analíticas:</strong> medir páginas vistas y comportamiento (Google Analytics).</li>
          <li><strong>Marketing:</strong> campañas en Meta Ads, Google Ads y remarketing.</li>
        </ul>

        <h2>3. Cómo rechazarlas</h2>
        <p>Puede bloquear o eliminar cookies desde la configuración de su navegador (Chrome, Safari, Firefox, Edge). El bloqueo de cookies técnicas puede afectar funcionalidades como el carrito o el chat.</p>

        <h2>4. Duración</h2>
        <p>Las cookies de sesión se eliminan al cerrar el navegador. Las cookies persistentes duran entre 30 días y 2 años según su finalidad.</p>
      </LegalPage>
    </>
  );
}