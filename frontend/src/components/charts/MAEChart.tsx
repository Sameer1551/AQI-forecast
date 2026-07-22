import { memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const data = [
  { date: 'Jul 16', mae: 11.8 },
  { date: 'Jul 17', mae: 12.1 },
  { date: 'Jul 18', mae: 12.3 },
  { date: 'Jul 19', mae: 12.9 },
  { date: 'Jul 20', mae: 13.4 },
  { date: 'Jul 21', mae: 13.8 },
  { date: 'Jul 22', mae: 14.2 },
];

function MAEChartBase() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
        <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} domain={[10, 16]} label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', style: { fill: 'var(--text-muted)', fontSize: 11 } }} />
        <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
        <ReferenceLine y={12.4} stroke="var(--status-warning)" strokeDasharray="5 5" label={{ value: 'Training baseline', fill: 'var(--text-muted)', fontSize: 10, position: 'right' }} />
        <Line type="monotone" dataKey="mae" stroke="var(--accent-cyan)" strokeWidth={2} dot={{ r: 4, fill: 'var(--accent-cyan)' }} animationDuration={500} />
      </LineChart>
    </ResponsiveContainer>
  );
}

const MAEChart = memo(MAEChartBase);
export default MAEChart;
