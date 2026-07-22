import { useCounterAnimation } from '@/hooks/useCounterAnimation';
import { getAQIColorHSL, getAQICategory } from '@/utils/aqiColors';
import styles from './AQIGauge.module.css';

interface AQIGaugeProps {
  aqi: number;
  size?: number;
}

export default function AQIGauge({ aqi, size = 200 }: AQIGaugeProps) {
  const animated = useCounterAnimation(aqi);
  const color = getAQIColorHSL(aqi);
  const category = getAQICategory(aqi);
  const max = 500;
  const clamped = Math.min(aqi, max);
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const progress = clamped / max;

  const isHazard = aqi > 200;

  return (
    <div className={`${styles.gauge} ${isHazard ? styles.pulse : ''}`} style={{ width: size, height: size * 0.7 }}>
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--aqi-good)" />
            <stop offset="20%" stopColor="var(--aqi-moderate)" />
            <stop offset="40%" stopColor="var(--aqi-sensitive)" />
            <stop offset="60%" stopColor="var(--aqi-unhealthy)" />
            <stop offset="80%" stopColor="var(--aqi-very-unhealthy)" />
            <stop offset="100%" stopColor="var(--aqi-hazardous)" />
          </linearGradient>
        </defs>
        <path
          d={`M 10 ${radius} A ${radius} ${radius} 0 0 1 ${size - 10} ${radius}`}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M 10 ${radius} A ${radius} ${radius} 0 0 1 ${size - 10} ${radius}`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d={`M 10 ${radius} A ${radius} ${radius} 0 0 1 ${10 + (size - 20) * progress} ${radius - Math.sin(progress * Math.PI) * radius}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 800ms ease-out, stroke 500ms ease' }}
        />
      </svg>
      <div className={styles.center}>
        <span className={styles.value} style={{ color }}>
          {Math.round(animated)}
        </span>
        <span className={styles.label}>{category}</span>
      </div>
    </div>
  );
}
