import { memo, useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { ForecastPoint } from '@/types/Forecast';
import { POLLUTANTS, BREAKPOINT_COLORS } from '@/utils/pollutantConfig';
import { getAQIColorHSL } from '@/utils/aqiColors';
import type { PollutantKey } from '@/types/Station';
import styles from './ForecastChart.module.css';

interface ForecastChartProps {
  data: ForecastPoint[];
  pollutant: PollutantKey;
  showAll?: boolean;
}

const HORIZON_LABELS: Record<number, string> = { 1: '1h', 6: '6h', 24: '24h', 168: '168h' };

function ForecastChartBase({ data, pollutant, showAll = false }: ForecastChartProps) {
  const cfg = POLLUTANTS[pollutant];

  const chartData = useMemo(() => {
    if (showAll) {
      const horizons = [1, 6, 24, 168];
      return horizons.map((h) => {
        const row: Record<string, number | string> = { horizon: HORIZON_LABELS[h] };
        (Object.keys(POLLUTANTS) as PollutantKey[]).forEach((p) => {
          const pt = data.find((d) => d.pollutant === p && d.horizon_hours === h);
          if (pt) row[p] = pt.prediction;
        });
        return row;
      });
    }
    const filtered = data.filter((d) => d.pollutant === pollutant);
    return [1, 6, 24, 168].map((h) => {
      const pt = filtered.find((d) => d.horizon_hours === h);
      return pt
        ? { horizon: HORIZON_LABELS[h], prediction: pt.prediction, lower_90: pt.lower_90, upper_90: pt.upper_90 }
        : { horizon: HORIZON_LABELS[h], prediction: 0, lower_90: 0, upper_90: 0 };
    });
  }, [data, pollutant, showAll]);

  const colors = useMemo(() => {
    const map: Record<string, string> = {};
    (Object.keys(POLLUTANTS) as PollutantKey[]).forEach((p, i) => {
      map[p] = ['hsl(190,90%,55%)', 'hsl(215,80%,60%)', 'hsl(28,96%,53%)', 'hsl(142,71%,45%)', 'hsl(265,70%,65%)', 'hsl(0,72%,51%)'][i];
    });
    return map;
  }, []);

  return (
    <div className={styles.container}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
          <XAxis dataKey="horizon" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
          <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} label={{ value: cfg.unit, angle: -90, position: 'insideLeft', style: { fill: 'var(--text-muted)', fontSize: 11 } }} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
            labelStyle={{ color: 'var(--text-secondary)' }}
          />
          {!showAll && (
            <>
              <Area type="monotone" dataKey="upper_90" stroke="none" fill="url(#ciGrad)" />
              <Area type="monotone" dataKey="lower_90" stroke="none" fill="var(--bg-base)" />
              <Line type="monotone" dataKey="prediction" stroke="var(--accent-cyan)" strokeWidth={2} dot={{ r: 4, fill: 'var(--accent-cyan)' }} activeDot={{ r: 6 }} animationDuration={500} />
              {cfg.breakpoints.map((bp, i) => (
                <ReferenceLine
                  key={i}
                  y={bp}
                  stroke={getAQIColorHSL([0, 50, 100, 150, 200, 300][i + 1] ?? 300)}
                  strokeDasharray="4 4"
                  label={{ value: cfg.breakpointLabels[i], position: 'right', fill: 'var(--text-muted)', fontSize: 10 }}
                  opacity={0.5}
                />
              ))}
            </>
          )}
          {showAll && (Object.keys(POLLUTANTS) as PollutantKey[]).map((p) => (
            <Line key={p} type="monotone" dataKey={p} stroke={colors[p]} strokeWidth={1.5} dot={{ r: 3 }} animationDuration={500} />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

const ForecastChart = memo(ForecastChartBase);
export default ForecastChart;
