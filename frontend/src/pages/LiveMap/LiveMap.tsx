import { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, Polyline, useMap } from 'react-leaflet';
import type L from 'leaflet';
import { useStations } from '@/hooks/useStations';
import { useGraph } from '@/hooks/useGraph';
import { useAppStore } from '@/store/appStore';
import { getAQIColorHSL, getAQICategory, getEdgeColorHSL } from '@/utils/aqiColors';
import { CITIES, CITY_CENTERS } from '@/mock/mockStations';
import StationPopup from './StationPopup';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { MapPin, Network } from 'lucide-react';
import styles from './LiveMap.module.css';

const AQI_CATEGORIES = [
  { label: 'Good', range: '0-50', color: 'var(--aqi-good)' },
  { label: 'Moderate', range: '51-100', color: 'var(--aqi-moderate)' },
  { label: 'USG', range: '101-150', color: 'var(--aqi-sensitive)' },
  { label: 'Unhealthy', range: '151-200', color: 'var(--aqi-unhealthy)' },
  { label: 'Very Unhealthy', range: '201-300', color: 'var(--aqi-very-unhealthy)' },
  { label: 'Hazardous', range: '301+', color: 'var(--aqi-hazardous)' },
];

function MapController({ city }: { city: string }) {
  const map = useMap();
  useEffect(() => {
    if (city === 'All') {
      map.setView([20.5937, 78.9629], 5, { animate: true });
    } else if (CITY_CENTERS[city]) {
      map.setView(CITY_CENTERS[city], 11, { animate: true });
    }
  }, [city, map]);
  return null;
}

export default function LiveMap() {
  const { data: stations, isLoading } = useStations();
  const selectedCity = useAppStore((s) => s.selectedCity);
  const setSelectedCity = useAppStore((s) => s.setSelectedCity);
  const graphOverlay = useAppStore((s) => s.graphOverlayEnabled);
  const setGraphOverlay = useAppStore((s) => s.setGraphOverlay);
  const mapRef = useRef<L.Map | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);

  const { data: delhiGraph } = useGraph(1);

  const filteredStations = stations?.filter((s) => selectedCity === 'All' || s.city === selectedCity) ?? [];

  const graphEdges = graphOverlay && delhiGraph && selectedCity === 'All'
    ? delhiGraph.edges.map((edge) => {
        const source = delhiGraph.nodes.find((n) => n.id === edge.source);
        const target = delhiGraph.nodes.find((n) => n.id === edge.target);
        if (!source || !target) return null;
        return {
          positions: [[source.lat, source.lon], [target.lat, target.lon]] as [number, number][],
          color: getEdgeColorHSL(edge.relation_type),
          weight: edge.weight * 4,
        };
      }).filter(Boolean)
    : [];

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <SkeletonLoader width="100%" height="100%" borderRadius="0" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.cityFilters}>
        <button
          className={`${styles.cityPill} ${selectedCity === 'All' ? styles.cityActive : ''}`}
          onClick={() => setSelectedCity('All')}
        >
          All
        </button>
        {CITIES.map((city) => (
          <button
            key={city}
            className={`${styles.cityPill} ${selectedCity === city ? styles.cityActive : ''}`}
            onClick={() => setSelectedCity(city)}
          >
            {city}
          </button>
        ))}
      </div>

      <button
        className={`${styles.overlayToggle} ${graphOverlay ? styles.overlayActive : ''}`}
        onClick={() => setGraphOverlay(!graphOverlay)}
      >
        <Network size={16} />
        <span>Graph Overlay</span>
      </button>

      <MapContainer
        ref={mapRef}
        center={[20.5937, 78.9629]}
        zoom={5}
        className={styles.map}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CartoDB'
        />
        <MapController city={selectedCity} />

        {graphEdges.map((edge, i) => (
          <Polyline
            key={i}
            positions={edge!.positions}
            pathOptions={{ color: edge!.color, weight: edge!.weight, opacity: 0.6 }}
          />
        ))}

        {filteredStations.map((station) => {
          const color = getAQIColorHSL(station.current_aqi);
          const radius = Math.min(22, Math.max(8, 8 + (station.current_aqi / 500) * 14));
          return (
            <CircleMarker
              key={station.id}
              center={[station.lat, station.lon]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.7,
                weight: 2,
              }}
              eventHandlers={{
                click: () => setSelectedStationId(station.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -radius]} opacity={1}>
                <div className={styles.tooltip}>
                  <strong>{station.name}</strong> — AQI {station.current_aqi} ({getAQICategory(station.current_aqi)})
                </div>
              </Tooltip>
              <Popup className={styles.popupWrap}>
                <StationPopup station={station} />
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className={styles.legend}>
        <div className={styles.legendTitle}>
          <MapPin size={12} /> AQI Categories
        </div>
        <div className={styles.legendItems}>
          {AQI_CATEGORIES.map((cat) => (
            <div key={cat.label} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: cat.color }} />
              <span className={styles.legendLabel}>{cat.label}</span>
              <span className={styles.legendRange}>({cat.range})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
