// Social proof row — logos de clientes + números clave.
export default function SocialProof() {
  const stats = [
    { n: '120+', l: 'empresas atendidas' },
    { n: '4h', l: 'tiempo respuesta cotización' },
    { n: '98%', l: 'OTIF (entrega a tiempo)' },
    { n: '0', l: 'plástico virgen usado' },
  ];
  return (
    <section className="py-16 bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-xs uppercase tracking-widest text-slate-400 font-semibold">
          Confían en PEYU
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-60">
          {['CMPC', 'Coca-Cola Chile', 'Falabella', 'BCI', 'Antofagasta Minerals', 'CCU'].map(b => (
            <span key={b} className="text-slate-500 font-semibold font-poppins text-lg tracking-tight">{b}</span>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-emerald-700 font-poppins">{s.n}</p>
              <p className="mt-1 text-sm text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}