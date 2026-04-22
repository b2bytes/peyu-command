import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Mapa mundial de proveedores.
 * Muestra los proveedores con coordenadas, coloreados por categoría/riesgo.
 */
export default function SupplierMap({ proveedores = [], height = 360, onSelect }) {
  const withCoords = proveedores.filter(p => p.latitud && p.longitud);

  const colorByRisk = (nivel) => {
    switch (nivel) {
      case 'Bajo':    return '#059669';
      case 'Medio':   return '#D97706';
      case 'Alto':    return '#DC2626';
      case 'Crítico': return '#7F1D1D';
      default:        return '#6B7280';
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-lg" style={{ height }}>
      <MapContainer
        center={[-10, -40]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map(p => (
          <CircleMarker
            key={p.id}
            center={[p.latitud, p.longitud]}
            radius={p.tier?.startsWith('Tier 1') ? 10 : 7}
            pathOptions={{
              color: colorByRisk(p.riesgo_nivel),
              fillColor: colorByRisk(p.riesgo_nivel),
              fillOpacity: 0.65,
              weight: 2,
            }}
            eventHandlers={{ click: () => onSelect?.(p) }}
          >
            <Tooltip direction="top" offset={[0, -5]} opacity={1}>
              <div className="text-xs">
                <div className="font-bold">{p.nombre}</div>
                <div className="text-muted-foreground">{p.ciudad}{p.pais ? `, ${p.pais}` : ''}</div>
                <div>{p.categoria} · {p.tier?.split(' - ')[0]}</div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}