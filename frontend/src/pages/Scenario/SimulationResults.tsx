import { memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import Card from '@/components/ui/Card';
import { ArrowRight } from 'lucide-react';
import type { Station } from '@/types/Station';
import styles from './SimulationResults.module.css';

interface SimulationResultsProps {
  results: {
    baseline: any[];
    perturbed: any[];
    delta_pm25_24h: number;
    delta_aqi_24h: number;
    aqi_category_change: { from: string; to: string };
  };
  station: Station;
  scenarioLabel: string;
}

function SimulationResultsBase({ results, station, scenarioLabel }: SimulationResultsProps) {
  const chartData = useMemo(() => {
    const horizons = [1, 6, 24, 168];
    const labels: Record<number, string> = { 1: '1h', 6: '6h', 24: '24h', 168: '168h' };
    return horizons.map((h) => {
      const base = results.baseline.find((p: any) => p.pollutant === 'pm25' && p.horizon_hours === h);
      const pert = results.perturbed.find((p: any) => p.pollutant === 'pm25' && p.horizon_hours === h);
      return {
        horizon: labels[h],
        baseline: base?.prediction ?? 0,
        perturbed: pert?.prediction ?? 0,
      };
    });
  }, [results]);

  const isImprovement = results.delta_pm25_24h < 0;

  return (
    <div className={styles.container}>
      <div className={styles.summaryCards}>
        <Card className={styles.summaryCard}>
          <span className={styles.cardLabel}>ΔPM2.5 at 24h</span>
          <span className={styles.cardValue} style={{ color: isImprovement ? 'var(--aqi-good)' : 'var(--aqi-unhealthy)' }}>
            {results.delta_pm25_24h > 0 ? '+' : ''}{results.delta_pm25_24h} µg/m³
          </span>
        </Card>
        <Card className={styles.summaryCard}>
          <span className={styles.cardLabel}>ΔAQI at 24h</span>
          <span className={styles.cardValue} style={{ color: isImprovement ? 'var(--aqi-good)' : 'var(--aqi-unhealthy)' }}>
            {results.delta_aqi_24h > 0 ? '+' : ''}{results.delta_aqi_24h} AQI points
          </span>
        </Card>
        <Card className={styles.summaryCard}>
          <span className={styles.cardLabel}>Category Change</span>
          <span className={styles.categoryChange}>
            {results.aqi_category_change.from}
            <ArrowRight size={14} />
            {results.aqi_category_change.to}
          </span>
        </Card>
      </div>

      <Card className={styles.chartCard}>
        <h3 className={styles.chartTitle}>
          PM2.5 Forecast: Baseline vs. {scenarioLabel}
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="improvementGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--aqi-good)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--aqi-good)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
            <XAxis dataKey="horizon" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', style: { fill: 'var(--text-muted)', fontSize: 11 } }} />
            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
            <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
            <Line type="monotone" dataKey="baseline" stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Baseline" animationDuration={500} />
            <Line type="monotone" dataKey="perturbed" stroke="var(--accent-cyan)" strokeWidth={2} dot={{ r: 4, fill: 'var(--accent-cyan)' }} name="With Policy" animationDuration={500} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className={styles.interpretation}>
        <p className={styles.interpretationText}>
          A {scenarioLabel} at {station.name} is projected to reduce PM2.5 by {Math.abs(results.delta_pm25_24h)} µg/m³ at the 24h horizon, shifting the category from '{results.aqi_category_change.from}' to '{results.aqi_category_change.to}'. This estimate assumes current atmospheric dispersion conditions (wind: {station.wind_speed_ms} m/s, boundary layer: {station.boundary_layer_height_m}m).
        </p>
      </Card>
    </div>
  );
}

const SimulationResults = memo(SimulationResultsBase);
export default SimulationResults;
