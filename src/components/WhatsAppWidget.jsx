import { useState } from 'react';
import { X, MessageCircle, Building2, ShoppingBag } from 'lucide-react';

export default function WhatsAppWidget({ context = 'general', productName = '', sku = '' }) {
  const [open, setOpen] = useState(false);

  const mensajes = {
    general: `Hola, tengo una consulta sobre los productos Peyu Chile 🌿`,
    b2b: `Hola, me interesa una cotización corporativa de Peyu Chile para regalos empresariales 🏢`,
    producto: `Hola, me interesa el producto: ${productName}${sku ? ` (SKU: ${sku})` : ''} 🌿`,
  };

  const base = 'https://wa.me/56935040242?text=';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Popup */}
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl w-72 border border-border overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-green-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-sm">Peyu Chile · WhatsApp</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">¿En qué podemos ayudarte?</p>
            <a
              href={`${base}${encodeURIComponent(mensajes.b2b)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-green-500 hover:bg-green-50 transition group"
            >
              <Building2 className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <div className="text-sm font-medium">Cotización Corporativa</div>
                <div className="text-xs text-muted-foreground">Propuesta + mockup en &lt;24h</div>
              </div>
            </a>
            <a
              href={`${base}${encodeURIComponent(context === 'producto' ? mensajes.producto : mensajes.general)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-green-500 hover:bg-green-50 transition group"
            >
              <ShoppingBag className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <div className="text-sm font-medium">Consulta General</div>
                <div className="text-xs text-muted-foreground">Precios, envíos, garantías</div>
              </div>
            </a>
            <p className="text-xs text-center text-muted-foreground pt-1">
              +56 9 3504 0242 · Lun-Vie 10-18h
            </p>
          </div>
        </div>
      )}

      {/* FAB Button — Tortuga PEYU flotando, fondo transparente */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-20 h-20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
        aria-label="Hablar con Peyu"
      >
        {open ? (
          <div className="w-14 h-14 rounded-full bg-white/95 backdrop-blur shadow-2xl flex items-center justify-center border border-gray-200">
            <X className="w-6 h-6 text-gray-700" />
          </div>
        ) : (
          <>
            {/* Halo sutil pulsante para llamar la atención sin ser invasivo */}
            <span className="absolute inset-0 rounded-full bg-teal-400/30 blur-xl group-hover:bg-teal-400/50 animate-pulse" />
            {/* Tortuga PEYU oficial flotando */}
            <img
              src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
              alt="Peyu"
              className="relative w-20 h-20 object-contain select-none drop-shadow-[0_8px_16px_rgba(15,139,108,0.5)] group-hover:drop-shadow-[0_12px_24px_rgba(15,139,108,0.65)] transition-all"
              draggable={false}
            />
            {/* Indicador "en línea" */}
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-400 ring-2 ring-white shadow" />
          </>
        )}
      </button>
    </div>
  );
}