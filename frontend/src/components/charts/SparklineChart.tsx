import { memo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import type { ForecastPoint } from '@/types/Forecast';
import { getAQIColorHSL } from '@/utils/aqiColors';

interface SparklineChartProps {
  data: ForecastPoint[];
  pollutant?: string;
  width?: number;
  height?: number;
}

function SparklineChartBase({ data, pollutant = 'pm25', width = 120, height = 40 }: SparklineChartProps) {
  const filtered = data.filter((d) => d.pollutant === pollutant);
  const chartData = [1, 6, 24, 168].map((h) => {
    const pt = filtered.find((d) => d.horizon_hours === h);
    return { value: pt?.prediction ?? 0 };
  });
  const avg = chartData.reduce((a, b) => a + b.value, 0) / chartData.length || 1;
  const color = getAQIColorHSL(avg > 150 ? 200 : avg > 50 ? 100 : 30);

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} animationDuration={500} />
      </LineChart>
    </ResponsiveContainer>
  );
}

const SparklineChart = memo(SparklineChartBase);
export default SparklineChart;
