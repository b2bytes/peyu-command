import { FileText } from 'lucide-react';
import ChatCardShell from './ChatCardShell';
import QuoteRow from './QuoteRow';

const fmtCompacto = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
};

// Cotizaciones B2B recientes. Prioriza lo que decide plata: primero las que
// están esperando respuesta del cliente (ahí está la venta que se puede cerrar
// hoy), después el resto. El fundador ve el monto en juego antes del detalle.
export default function QuotesCard({ cotizaciones = [] }) {
  const abiertas = cotizaciones.filter((c) => c.status === 'Enviada');
  const aceptadas = cotizaciones.filter((c) => c.status === 'Aceptada');
  const enJuego = abiertas.reduce((s, c) => s + (Number(c.total) || 0), 0);
  const ganado = aceptadas.reduce((s, c) => s + (Number(c.total) || 0), 0);

  // Orden de lectura: lo esperando respuesta arriba, luego por fecha.
  const orden = { 'Enviada': 0, 'Borrador': 1, 'Aceptada': 2, 'Rechazada': 3, 'Vencida': 4 };
  const ordenadas = [...cotizaciones].sort(
    (a, b) => (orden[a.status] ?? 9) - (orden[b.status] ?? 9)
  );

  return (
    <ChatCardShell
      icon={FileText}
      title="Cotizaciones B2B"
      subtitle={abiertas.length ? `${abiertas.length} esperando respuesta del cliente` : 'Ninguna esperando respuesta'}
      count={cotizaciones.length}
      metrics={[
        { label: 'En juego', value: fmtCompacto(enJuego), tone: 'accent' },
        { label: 'Aceptado', value: fmtCompacto(ganado) },
        { label: 'Por responder', value: abiertas.length, tone: abiertas.length ? 'warn' : undefined },
      ]}
      items={ordenadas}
      renderItem={(c) => <QuoteRow key={c.id} cotizacion={c} />}
      emptyText="Sin cotizaciones recientes."
      linkTo="/admin/propuestas"
      linkLabel="Ver todas"
    />
  );
}