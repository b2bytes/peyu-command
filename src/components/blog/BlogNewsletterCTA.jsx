import { Mail, Leaf } from 'lucide-react';

// CTA fijo al final del blog para redirigir a contacto / WhatsApp.
// No captura email (sin integración de newsletter aún) — enlaza al canal directo.
export default function BlogNewsletterCTA() {
  return (
    <section className="mt-12 sm:mt-16 relative overflow-hidden rounded-2xl border border-teal-400/30 bg-gradient-to-br from-teal-500/15 via-emerald-500/10 to-cyan-500/15 p-6 sm:p-10">
      <Leaf className="absolute -right-6 -top-6 w-32 h-32 text-teal-300/10 rotate-12" />
      <div className="relative max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-400/40 rounded-full text-[11px] font-semibold text-teal-200 mb-3">
          <Mail className="w-3 h-3" /> COMUNIDAD PEYU
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          ¿Tu empresa quiere sumarse al cambio?
        </h3>
        <p className="text-sm sm:text-base text-white/85 mb-5">
          Desde 10 unidades con tu logo grabado en láser UV. Materiales 100% reciclados en Chile, garantía de 10 años y asesoría dedicada.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/b2b/contacto"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/30 transition-all hover:scale-[1.02]"
          >
            Cotizar para mi empresa
          </a>
          <a
            href="https://wa.me/56933766573?text=Hola%20Peyu%2C%20vengo%20del%20blog%20y%20quiero%20conocer%20m%C3%A1s"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-5 py-2.5 rounded-xl border border-white/20 transition-all"
          >
            Conversar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}