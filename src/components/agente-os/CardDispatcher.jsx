import DailySummaryCard from './cards/DailySummaryCard';
import SalesCard from './cards/SalesCard';
import OrdersCard from './cards/OrdersCard';
import StockCard from './cards/StockCard';
import QuotesCard from './cards/QuotesCard';
import ClientsCard from './cards/ClientsCard';

// Renderiza la tarjeta rica correcta según el tipo detectado, hidratada con
// los datos reales del CRM + las métricas en vivo de peyuBrainOps.
export default function CardDispatcher({ card, crm, metrics, onAsk }) {
  switch (card.type) {
    case 'summary':
      return <DailySummaryCard metrics={metrics} onAsk={onAsk} />;
    case 'sales':
      return <SalesCard metrics={metrics} periodo={card.periodo} />;
    case 'orders':
      return <OrdersCard pedidos={crm.pedidos} />;
    case 'stock':
      return <StockCard productos={crm.productos} />;
    case 'quotes':
      return <QuotesCard cotizaciones={crm.cotizaciones} />;
    case 'clients':
      return <ClientsCard clientes={crm.clientes} />;
    default:
      return null;
  }
}