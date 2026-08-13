import { Truck, RefreshCw } from 'lucide-react';
import ChatCardShell from './ChatCardShell';
import ActionButton from '../ActionButton';
import ShipmentRow from './ShipmentRow';

// Envíos BlueExpress en la conversación: KPIs de la operación, envíos
// accionables (etiqueta / emisión pendiente) y sincronización de tracking.
export default function ShipmentsCard({ envios = [], metrics = {}, onDone }) {
  const conExcepcion = metrics.envios_con_excepcion || 0;

  return (
    <ChatCardShell
      icon={Truck}
      title="Envíos BlueExpress"
      subtitle={envios.length ? 'Estado real de la operación' : undefined}
      count={envios.length}
      metrics={[
        { label: 'En tránsito', value: metrics.envios_en_transito ?? '—' },
        { label: 'Entregados hoy', value: metrics.envios_entregados_hoy ?? '—', tone: 'accent' },
        { label: 'Con excepción', value: metrics.envios_con_excepcion ?? '—', tone: conExcepcion > 0 ? 'warn' : undefined },
      ]}
      items={envios}
      renderItem={(e) => <ShipmentRow key={e.id} envio={e} onDone={onDone} />}
      emptyText="Sin envíos activos en este momento 🎉"
      linkTo="/admin/bluex"
      linkLabel="Centro logístico"
      footer={
        <ActionButton
          action="sincronizarTracking"
          payload={{}}
          label="Sincronizar tracking BlueExpress"
          icon={RefreshCw}
          onDone={onDone}
        />
      }
    />
  );
}