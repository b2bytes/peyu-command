import React, { useState } from 'react';
import { EMAIL_PREVIEWS } from '@/lib/email-previews';
import { Mail, Monitor, Smartphone, AlertTriangle } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// CorreosCatalogo — Catálogo visual de TODOS los correos al cliente.
// Renderiza cada plantilla en un iframe aislado (para que sus estilos inline
// no afecten al admin) con alternancia desktop/mobile. Permite revisarlos
// lado a lado cuando se quiera. Datos de ejemplo definidos en email-previews.js
// ════════════════════════════════════════════════════════════════════════

function EmailFrame({ correo, mobile }) {
  const esTextoPlano = correo.estetica.includes('Texto plano');
  return (
    <div className="ld-card overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-ld-border flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-jakarta font-bold text-ld-fg text-sm truncate">{correo.nombre}</h3>
          <p className="text-[11px] text-ld-fg-muted mt-0.5 truncate">{correo.cuando}</p>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-1 rounded-md whitespace-nowrap flex items-center gap-1 ${
            esTextoPlano ? 'bg-amber-100 text-amber-700' : 'bg-ld-action-soft text-ld-action'
          }`}
        >
          {esTextoPlano && <AlertTriangle className="w-3 h-3" />}
          {correo.estetica}
        </span>
      </div>
      <div className="bg-[#eceae6] p-3 flex justify-center">
        <iframe
          title={correo.nombre}
          srcDoc={`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>${correo.html}</html>`}
          className="bg-white rounded-lg border border-ld-border shadow-sm"
          style={{ width: mobile ? 360 : '100%', maxWidth: '100%', height: 640 }}
        />
      </div>
      <div className="px-4 py-2 border-t border-ld-border bg-ld-bg-soft">
        <code className="text-[10px] text-ld-fg-muted font-mono">{correo.funcion}</code>
      </div>
    </div>
  );
}

export default function CorreosCatalogo() {
  const [mobile, setMobile] = useState(false);

  const totalCorreos = EMAIL_PREVIEWS.reduce((acc, g) => acc + g.correos.length, 0);
  const textoPlano = EMAIL_PREVIEWS
    .flatMap((g) => g.correos)
    .filter((c) => c.estetica.includes('Texto plano')).length;

  return (
    <div className="ld-canvas min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-ld-action-soft flex items-center justify-center">
              <Mail className="w-5 h-5 text-ld-action" />
            </div>
            <div>
              <h1 className="ld-display text-2xl md:text-3xl text-ld-fg">Correos al cliente</h1>
              <p className="text-sm text-ld-fg-muted mt-0.5">
                {totalCorreos} correos · catálogo visual con datos de ejemplo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ld-glass rounded-xl p-1">
            <button
              onClick={() => setMobile(false)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                !mobile ? 'bg-ld-action text-white' : 'text-ld-fg-muted hover:text-ld-fg'
              }`}
            >
              <Monitor className="w-4 h-4" /> Desktop
            </button>
            <button
              onClick={() => setMobile(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                mobile ? 'bg-ld-action text-white' : 'text-ld-fg-muted hover:text-ld-fg'
              }`}
            >
              <Smartphone className="w-4 h-4" /> Mobile
            </button>
          </div>
        </div>

        {/* Aviso texto plano */}
        {textoPlano > 0 && (
          <div className="ld-card p-4 mb-8 border-l-4 border-amber-400 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-ld-fg-soft">
              <strong>{textoPlano} correos de tránsito BlueExpress</strong> salen en texto plano, sin diseño.
              Se ven pobres comparados con el resto. Marcados en ámbar abajo — candidatos a rediseñar y unificar con la marca.
            </p>
          </div>
        )}

        {/* Grupos */}
        {EMAIL_PREVIEWS.map((grupo) => (
          <section key={grupo.grupo} className="mb-10">
            <h2 className="font-jakarta font-bold text-lg text-ld-fg mb-4 flex items-center gap-2">
              <span className="ld-divider flex-1 max-w-[2rem]" />
              {grupo.grupo}
              <span className="text-sm font-normal text-ld-fg-muted">({grupo.correos.length})</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {grupo.correos.map((correo) => (
                <EmailFrame key={correo.id} correo={correo} mobile={mobile} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}