// ════════════════════════════════════════════════════════════════════════
// ChatQuoteCard — Tarjeta premium para descargar cotización PDF generada
// desde el chat. Aparece cuando el agente emite [[QUOTE_PDF:sku:qty]].
// ────────────────────────────────────────────────────────────────────────
// Diseño: glass-morphic verde PEYU, animación shimmer en el icono PDF,
// estados loading/done/error, descarga directa sin abrir tab nueva.
// Soporta variante 'dark' (chat flotante) y 'light' (chat embebido).
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileDown, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

// Lee los datos capturados del chat desde localStorage (los pobla el agente
// vía CONTEXTO al ir conversando).
function readChatContact() {
  try {
    const raw = localStorage.getItem('peyu_chat_b2b_contact') || '{}';
    return JSON.parse(raw);
  } catch { return {}; }
}

function readChatProduct() {
  try {
    const raw = localStorage.getItem('peyu_chat_last_product') || 'null';
    return JSON.parse(raw);
  } catch { return null; }
}

function readChatQty() {
  try {
    const v = parseInt(localStorage.getItem('peyu_chat_last_qty') || '', 10);
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch { return null; }
}

function downloadBase64Pdf(base64, filename) {
  // Convierte base64 → Blob → trigger descarga sin abrir tab.
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'Cotizacion-Peyu.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ChatQuoteCard({ spec = '', variant = 'dark' }) {
  // spec puede venir como "SKU:qty" o vacío (usa contexto del chat).
  const [skuFromSpec, qtyFromSpec] = spec.split(':');

  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);
  const [productInfo, setProductInfo] = useState(null);

  // Resolvemos SKU + qty: priorizamos lo que viene en el tag, fallback al contexto.
  const sku = skuFromSpec || readChatProduct()?.sku;
  const qty = parseInt(qtyFromSpec, 10) || readChatQty() || 10;

  // Cargamos info del producto para mostrar nombre + precio estimado en el card.
  useEffect(() => {
    let alive = true;
    if (!sku) return;
    (async () => {
      try {
        const list = await base44.entities.Producto.filter({ sku });
        if (alive && list?.[0]) setProductInfo(list[0]);
      } catch {}
    })();
    return () => { alive = false; };
  }, [sku]);

  const handleDownload = async () => {
    if (state === 'loading') return;
    setState('loading');
    setErrorMsg('');

    try {
      const contact = readChatContact();
      const conversationId = localStorage.getItem('peyu_chat_conv_id') || null;

      const res = await base44.functions.invoke('generateChatQuotePDF', {
        conversation_id: conversationId,
        sku,
        qty,
        empresa: contact.empresa,
        contacto: contact.contacto,
        email: contact.email,
        telefono: contact.telefono,
        fecha_requerida: contact.fecha_requerida,
        personalizacion: contact.personalizacion || 'Láser UV',
      });

      const data = res?.data || {};
      if (!data.ok || !data.pdf_base64) {
        throw new Error(data.error || 'No se pudo generar la cotización');
      }

      downloadBase64Pdf(data.pdf_base64, data.filename);
      setResult(data);
      setState('done');
    } catch (e) {
      console.error('Quote download error:', e);
      setErrorMsg(e.message || 'Error generando PDF');
      setState('error');
    }
  };

  if (!sku) return null; // sin SKU no podemos cotizar nada

  const isDark = variant === 'dark';
  const precioEstimado = productInfo
    ? estimaPrecio(productInfo, qty)
    : null;

  // ─── Diseño dark (chat flotante sobre fondo navy/glass) ───
  if (isDark) {
    return (
      <div className="my-2 relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/10 backdrop-blur-md shadow-lg shadow-emerald-500/10">
        {/* Glow decoration */}
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative p-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
              {state === 'loading' ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : state === 'done' ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <FileDown className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-200">
                  Cotización lista
                </span>
              </div>
              <p className="text-sm font-semibold text-white leading-tight">
                {productInfo?.nombre || sku} × {qty}u
              </p>
              {precioEstimado && state !== 'done' && (
                <p className="text-[11px] text-emerald-100/80 mt-0.5">
                  Total estimado: <b className="text-white">${precioEstimado.toLocaleString('es-CL')}</b>
                </p>
              )}
              {state === 'done' && result && (
                <p className="text-[11px] text-emerald-100/90 mt-0.5">
                  ✓ {result.numero} · ${result.total.toLocaleString('es-CL')}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={state === 'loading'}
            className="mt-2.5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl px-4 py-2.5 transition-all shadow-md hover:shadow-emerald-500/30 hover:scale-[1.01]">
            {state === 'loading' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generando PDF…</>
            ) : state === 'done' ? (
              <><CheckCircle2 className="w-4 h-4" /> Descargar de nuevo</>
            ) : (
              <><FileDown className="w-4 h-4" /> Descargar cotización PDF</>
            )}
          </button>

          {state === 'error' && (
            <div className="mt-2 flex items-start gap-1.5 text-[11px] text-red-200 bg-red-500/10 border border-red-400/30 rounded-lg px-2 py-1.5">
              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}. Escríbenos por WhatsApp y te ayudamos.</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Diseño light (chat embebido sobre fondo blanco) ───
  return (
    <div className="my-2 relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-white shadow-sm">
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="relative p-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            {state === 'loading' ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : state === 'done' ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : (
              <FileDown className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">
                Cotización lista
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {productInfo?.nombre || sku} × {qty}u
            </p>
            {precioEstimado && state !== 'done' && (
              <p className="text-[11px] text-gray-600 mt-0.5">
                Total estimado: <b className="text-gray-900">${precioEstimado.toLocaleString('es-CL')}</b>
              </p>
            )}
            {state === 'done' && result && (
              <p className="text-[11px] text-emerald-700 mt-0.5">
                ✓ {result.numero} · ${result.total.toLocaleString('es-CL')}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={state === 'loading'}
          className="mt-2.5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl px-4 py-2.5 transition-all shadow-sm hover:shadow-md hover:scale-[1.01]">
          {state === 'loading' ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generando PDF…</>
          ) : state === 'done' ? (
            <><CheckCircle2 className="w-4 h-4" /> Descargar de nuevo</>
          ) : (
            <><FileDown className="w-4 h-4" /> Descargar cotización PDF</>
          )}
        </button>

        {state === 'error' && (
          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
            <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}. Escríbenos por WhatsApp y te ayudamos.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Estima precio según las mismas escalas que usa el backend.
function estimaPrecio(producto, qty) {
  let precio = producto.precio_b2c || 9990;
  if (qty >= 500 && producto.precio_500_mas) precio = producto.precio_500_mas;
  else if (qty >= 200 && producto.precio_200_499) precio = producto.precio_200_499;
  else if (qty >= 50 && producto.precio_50_199) precio = producto.precio_50_199;
  else if (qty >= 10 && producto.precio_base_b2b) precio = producto.precio_base_b2b;
  return precio * qty;
}