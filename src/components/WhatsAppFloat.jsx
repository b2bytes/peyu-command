import { useLocation } from 'react-router-dom';

export default function WhatsAppFloat() {
  const { pathname } = useLocation();
  // Ocultar en checkout (Amazon/Shopify best practice — sin distracciones del CTA)
  if (pathname.startsWith('/cart') || pathname.startsWith('/gracias')) return null;

  return (
    <a
      href="https://wa.me/56935040242?text=Hola%2C%20me%20interesa%20información%20sobre%20regalos%20corporativos%20sostenibles"
      target="_blank"
      rel="noreferrer"
      className="fixed right-4 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 hover:scale-110 active:scale-95 transition-transform"
      style={{
        backgroundColor: '#25D366',
        bottom: 'calc(env(safe-area-inset-bottom) + 7rem)',
      }}
      title="Chatear por WhatsApp"
    >
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.091.538 4.059 1.481 5.771L0 24l6.388-1.461A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.361-.213-3.724.851.877-3.622-.233-.375A9.818 9.818 0 012.182 12C2.182 6.566 6.566 2.182 12 2.182S21.818 6.566 21.818 12 17.434 21.818 12 21.818z"/>
      </svg>
    </a>
  );
}