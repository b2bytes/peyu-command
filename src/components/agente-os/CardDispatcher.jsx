import DailySummaryCard from './cards/DailySummaryCard';
import SalesCard from './cards/SalesCard';
import OrdersCard from './cards/OrdersCard';
import StockCard from './cards/StockCard';
import QuotesCard from './cards/QuotesCard';
import ClientsCard from './cards/ClientsCard';
import ConsultasCard from './cards/ConsultasCard';
import LeadsCard from './cards/LeadsCard';
import ProposalsCard from './cards/ProposalsCard';
import ShipmentsCard from './cards/ShipmentsCard';
import PipelineCard from './cards/PipelineCard';

// Renderiza la tarjeta rica correcta según el tipo detectado, hidratada con
// los datos reales del CRM + las listas/métricas en vivo de peyuBrainOps.
// onDone refresca métricas tras ejecutar una acción.
export default function CardDispatcher({ card, crm, metrics, lists = {}, onAsk, onDone }) {
  switch (card.type) {
    case 'summary':
      return <DailySummaryCard metrics={metrics} onAsk={onAsk} />;
    case 'sales':
      return <SalesCard metrics={metrics} periodo={card.periodo} />;
    case 'orders':
      return <OrdersCard pedidos={crm.pedidos} lista={lists.pedidos_pendientes} onDone={onDone} />;
    case 'pipeline':
      return <PipelineCard lista={lists.pedidos_pendientes || crm.pedidos} onDone={onDone} />;
    case 'stock':
      return <StockCard productos={crm.productos} lista={lists.stock_bajo_list} onDone={onDone} />;
    case 'quotes':
      return <QuotesCard cotizaciones={crm.cotizaciones} />;
    case 'proposals':
      return <ProposalsCard cotizaciones={crm.cotizaciones} lista={lists.propuestas_pendientes_list} onDone={onDone} />;
    case 'leads':
      return <LeadsCard leads={lists.leads_top || crm.leads} onDone={onDone} />;
    case 'shipments':
      return <ShipmentsCard envios={lists.envios_list || []} metrics={metrics} onDone={onDone} />;
    case 'consultas':
      return <ConsultasCard consultas={lists.consultas_pendientes || crm.consultas} onDone={onDone} />;
    case 'clients':
      return card.modo === 'nuevos'
        ? <ClientsCard clientes={lists.clientes_nuevos || crm.clientes} titulo="Clientes nuevos (últimos registrados)" mostrarFecha />
        : <ClientsCard clientes={lists.clientes_top || crm.clientes} titulo="Clientes top (mejores compradores)" />;
    default:
      return null;
  }
}