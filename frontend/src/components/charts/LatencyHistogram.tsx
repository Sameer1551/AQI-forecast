import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { bin: '0-25ms', count: 5 },
  { bin: '25-50ms', count: 62 },
  { bin: '50-75ms', count: 24 },
  { bin: '75-100ms', count: 7 },
  { bin: '>100ms', count: 2 },
];

const colors = ['var(--aqi-good)', 'var(--accent-cyan)', 'var(--aqi-moderate)', 'var(--aqi-sensitive)', 'var(--aqi-unhealthy)'];

function LatencyHistogramBase() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
        <XAxis dataKey="bin" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={500}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const LatencyHistogram = memo(LatencyHistogramBase);
export default LatencyHistogram;
