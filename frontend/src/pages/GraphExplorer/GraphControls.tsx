import { useAppStore } from '@/store/appStore';
import { useStations } from '@/hooks/useStations';
import { CITIES } from '@/mock/mockStations';
import WindCompass from '@/components/ui/WindCompass';
import Card from '@/components/ui/Card';
import type { GraphData } from '@/types/Graph';
import { getEdgeColorHSL } from '@/utils/aqiColors';
import { formatWindDir } from '@/utils/formatters';
import { AlertTriangle } from 'lucide-react';
import styles from './GraphControls.module.css';

interface GraphControlsProps {
  data: GraphData;
}

const RELATION_LAYERS = [
  { key: 'transport', label: 'Transport (wind-driven)', color: 'hsl(190, 90%, 55%)' },
  { key: 'weather', label: 'Weather (shared patterns)', color: 'hsl(215, 80%, 60%)' },
  { key: 'traffic_emission', label: 'Traffic & Emission', color: 'hsl(28, 96%, 53%)' },
  { key: 'land_use', label: 'Land Use & Urban Form', color: 'hsl(142, 71%, 45%)' },
  { key: 'sensor', label: 'Sensor (historical corr.)', color: 'hsl(265, 70%, 65%)' },
];

export default function GraphControls({ data }: GraphControlsProps) {
  const selectedCity = useAppStore((s) => s.selectedCity);
  const setSelectedCity = useAppStore((s) => s.setSelectedCity);
  const activeLayers = useAppStore((s) => s.activeRelationLayers);
  const toggleLayer = useAppStore((s) => s.toggleRelationLayer);
  const { data: stations } = useStations();

  const activeEdges = data.edges.filter((e) => activeLayers.includes(e.relation_type));
  const strongestEdge = activeEdges.length > 0
    ? activeEdges.reduce((max, e) => (e.weight > max.weight ? e : max))
    : null;
  const avgWeight = activeEdges.length > 0
    ? (activeEdges.reduce((sum, e) => sum + e.weight, 0) / activeEdges.length).toFixed(2)
    : '0';

  const sourceNode = strongestEdge ? data.nodes.find((n) => n.id === strongestEdge.source) : null;
  const targetNode = strongestEdge ? data.nodes.find((n) => n.id === strongestEdge.target) : null;

  const lowWind = data.wind_speed_ms < 2;
  const lowBLH = data.boundary_layer_height_m < 400;

  let physicsText = 'Normal atmospheric dispersion conditions. Transport edges reflect typical wind-driven pollution movement.';
  if (lowWind && lowBLH) {
    physicsText = 'Low wind speed and suppressed boundary layer indicate poor atmospheric dispersion. Transport edges dominate near-field pollution accumulation.';
  } else if (lowWind) {
    physicsText = 'Low wind speed limits horizontal dispersion. Pollution tends to accumulate locally rather than transport downwind.';
  } else if (lowBLH) {
    physicsText = 'Suppressed boundary layer traps emissions near the surface. Expect elevated concentrations across the network.';
  }

  return (
    <div className={styles.controls}>
      <h2 className={styles.title}>MAADG Graph Explorer</h2>

      <div className={styles.section}>
        <label className={styles.label}>City</label>
        <select
          className={styles.select}
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
        >
          {CITIES.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Relation Layer Filters</label>
        <div className={styles.layers}>
          {RELATION_LAYERS.map((layer) => (
            <label key={layer.key} className={styles.layerRow}>
              <input
                type="checkbox"
                checked={activeLayers.includes(layer.key)}
                onChange={() => toggleLayer(layer.key)}
                className={styles.checkbox}
              />
              <span className={styles.layerDot} style={{ background: layer.color }} />
              <span className={styles.layerLabel}>{layer.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Current Atmospheric Context</label>
        <div className={styles.contextGrid}>
          <div className={styles.compassWrap}>
            <WindCompass speed={data.wind_speed_ms} direction={data.wind_direction_deg} size={100} />
          </div>
          <div className={styles.contextItems}>
            <div className={styles.contextItem}>
              <span className={styles.cLabel}>Wind</span>
              <span className={styles.cValue}>{data.wind_speed_ms.toFixed(1)} m/s from {Math.round(data.wind_direction_deg)}° ({formatWindDir(data.wind_direction_deg)})</span>
            </div>
            <div className={styles.contextItem}>
              <span className={styles.cLabel}>Boundary Layer</span>
              <span className={styles.cValue}>
                {data.boundary_layer_height_m}m
                {lowBLH && (
                  <span className={styles.inversionBadge}>
                    <AlertTriangle size={10} /> Inversion Risk
                  </span>
                )}
              </span>
            </div>
            <div className={styles.contextItem}>
              <span className={styles.cLabel}>Temperature</span>
              <span className={styles.cValue}>
                {stations?.find((s) => s.city === selectedCity)?.temperature_c.toFixed(1) ?? '—'}°C
              </span>
            </div>
            <div className={styles.contextItem}>
              <span className={styles.cLabel}>Precipitation</span>
              <span className={styles.cValue}>0 mm/h</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Graph Statistics</label>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{data.nodes.length}</span>
            <span className={styles.statLabel}>Nodes</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{activeEdges.length}</span>
            <span className={styles.statLabel}>Edges</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{activeLayers.length}</span>
            <span className={styles.statLabel}>Active Layers</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{avgWeight}</span>
            <span className={styles.statLabel}>Avg Weight</span>
          </div>
        </div>
        {strongestEdge && sourceNode && targetNode && (
          <div className={styles.strongest}>
            Strongest: {sourceNode.name} → {targetNode.name} ({strongestEdge.weight})
          </div>
        )}
      </div>

      <div className={styles.physicsBox}>
        <div className={styles.physicsTitle}>Physics Interpretation</div>
        <p className={styles.physicsText}>{physicsText}</p>
      </div>
    </div>
  );
}
