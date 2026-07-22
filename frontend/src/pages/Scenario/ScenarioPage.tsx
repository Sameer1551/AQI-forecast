import { useState } from 'react';
import { useStations } from '@/hooks/useStations';
import { useScenario } from '@/hooks/useScenario';
import { useAppStore } from '@/store/appStore';
import Card from '@/components/ui/Card';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import SimulationResults from './SimulationResults';
import ScenarioCard from './ScenarioCard';
import { Car, Factory, TreePine, Wind } from 'lucide-react';
import type { Perturbation } from '@/types/Scenario';
import styles from './ScenarioPage.module.css';

export type ScenarioType = 'traffic_reduction' | 'industrial_reduction' | 'vegetation_increase' | 'wind_change';

export interface ScenarioConfig {
  type: ScenarioType;
  label: string;
  description: string;
  icon: typeof Car;
  defaultValue: number;
  min: number;
  max: number;
  unit: string;
}

const SCENARIOS: ScenarioConfig[] = [
  { type: 'traffic_reduction', label: 'Traffic Reduction', description: 'Simulate reduced vehicle emissions (lockdown effect, odd-even policy)', icon: Car, defaultValue: 50, min: 0, max: 100, unit: '%' },
  { type: 'industrial_reduction', label: 'Industrial Emission Cut', description: 'Simulate reduction in industrial pollutant output', icon: Factory, defaultValue: 30, min: 0, max: 100, unit: '%' },
  { type: 'vegetation_increase', label: 'Green Cover Increase', description: 'Simulate effect of urban greening on particulate capture', icon: TreePine, defaultValue: 20, min: 0, max: 50, unit: '%' },
  { type: 'wind_change', label: 'Change Wind Conditions', description: 'Explore how different wind speed/direction affects transport', icon: Wind, defaultValue: 5, min: 0, max: 15, unit: ' m/s' },
];

export default function ScenarioPage() {
  const { data: stations, isLoading } = useStations();
  const selectedStationId = useAppStore((s) => s.selectedStationId);
  const setSelectedStationId = useAppStore((s) => s.setSelectedStationId);
  const mutation = useScenario();

  const [activeScenario, setActiveScenario] = useState<ScenarioType>('traffic_reduction');
  const [values, setValues] = useState<Record<ScenarioType, number>>({
    traffic_reduction: 50,
    industrial_reduction: 30,
    vegetation_increase: 20,
    wind_change: 5,
  });
  const [windDirection, setWindDirection] = useState(180);
  const [results, setResults] = useState<any>(null);
  const [computing, setComputing] = useState(false);

  const station = stations?.find((s) => s.id === selectedStationId);

  if (isLoading || !station) {
    return (
      <div className={styles.loading}>
        <SkeletonLoader width="200px" height="30px" />
        <SkeletonLoader width="100%" height="200px" />
      </div>
    );
  }

  const handleRun = () => {
    setComputing(true);
    setResults(null);
    const perturbation: Perturbation = {
      type: activeScenario,
      value: values[activeScenario],
    };
    setTimeout(() => {
      mutation.mutate(
        { station_id: station.id, perturbation },
        {
          onSuccess: (data) => {
            setResults(data);
            setComputing(false);
          },
          onError: () => {
            setComputing(false);
          },
        }
      );
    }, 2000);
  };

  const activeConfig = SCENARIOS.find((s) => s.type === activeScenario)!;
  const liveLabel = activeScenario === 'wind_change'
    ? `Wind: ${values.wind_change.toFixed(1)} m/s from ${windDirection}°`
    : `${activeConfig.label.replace(' Reduction', ' reduction').replace(' Cut', ' cut').replace(' Increase', ' increase')} by ${values[activeScenario]}%`;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Digital Twin Policy Simulator</h1>
        <p>Explore how urban planning decisions could affect air quality. Powered by the MAADG physics-informed AI model.</p>
      </div>

      <div className={styles.banner}>
        These projections are AI model outputs for decision support. They are not causal predictions.
      </div>

      <div className={styles.layout}>
        <div className={styles.controls}>
          <div className={styles.stationSelector}>
            <label className={styles.label}>Station</label>
            <select
              className={styles.select}
              value={selectedStationId ?? 1}
              onChange={(e) => setSelectedStationId(Number(e.target.value))}
            >
              {stations?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — AQI {s.current_aqi}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.scenarioCards}>
            {SCENARIOS.map((cfg) => (
              <ScenarioCard
                key={cfg.type}
                config={cfg}
                active={activeScenario === cfg.type}
                value={values[cfg.type]}
                onChange={(v) => setValues({ ...values, [cfg.type]: v })}
                onSelect={() => setActiveScenario(cfg.type)}
                windDirection={windDirection}
                onWindDirChange={setWindDirection}
              />
            ))}
          </div>

          <div className={styles.liveLabel}>{liveLabel}</div>

          <button className={styles.runBtn} onClick={handleRun} disabled={computing}>
            {computing ? 'AI computing physics-informed counterfactual...' : 'Run Simulation'}
          </button>
        </div>

        <div className={styles.results}>
          {computing ? (
            <div className={styles.computing}>
              <div className={styles.computingSpinner} />
              <p>AI computing physics-informed counterfactual...</p>
            </div>
          ) : results ? (
            <SimulationResults results={results} station={station} scenarioLabel={liveLabel} />
          ) : (
            <div className={styles.placeholder}>
              <p>Run a simulation to see projected air quality changes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
