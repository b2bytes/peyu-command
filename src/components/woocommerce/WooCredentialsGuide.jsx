import { ChevronRight, ExternalLink, KeyRound } from 'lucide-react';

export default function WooCredentialsGuide() {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <KeyRound className="w-5 h-5 text-amber-700" />
        <h3 className="font-bold text-amber-900">Cómo generar las credenciales de WooCommerce</h3>
      </div>
      <ol className="space-y-2.5 text-sm text-amber-900">
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center">1</span>
          <span>Entra a <b>peyuchile.cl/wp-admin</b> como administrador.</span>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center">2</span>
          <span>Menú lateral → <b>WooCommerce</b> → <b>Ajustes</b> → pestaña <b>Avanzado</b> → <b>API REST</b>.</span>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center">3</span>
          <span>Click en <b>"Añadir clave"</b>. Descripción: <code className="bg-white px-1.5 py-0.5 rounded text-[11px]">Base44 PEYU</code>. Usuario: tu admin. Permisos: <b>Lectura</b>.</span>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center">4</span>
          <span>Click en <b>"Generar clave de API"</b>. <b>Copia las dos claves al instante</b> — solo se muestran una vez.</span>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center">5</span>
          <span>
            Entra a los <a href="#" onClick={(e) => { e.preventDefault(); window.open('about:blank', '_blank'); }} className="underline font-semibold inline-flex items-center gap-0.5">Secrets de Base44 <ExternalLink className="w-3 h-3" /></a> y pega:
            <code className="block bg-white mt-1 px-2 py-1 rounded text-[11px] leading-relaxed">
              WOOCOMMERCE_URL = https://peyuchile.cl<br/>
              WOOCOMMERCE_CONSUMER_KEY = ck_xxx...<br/>
              WOOCOMMERCE_CONSUMER_SECRET = cs_xxx...
            </code>
          </span>
        </li>
        <li className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center">6</span>
          <span>Vuelve acá y aprieta <b>"Probar conexión"</b>. <ChevronRight className="w-4 h-4 inline" /></span>
        </li>
      </ol>
    </div>
  );
}