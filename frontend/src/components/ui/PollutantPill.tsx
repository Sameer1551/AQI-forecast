import { POLLUTANTS } from '@/utils/pollutantConfig';
import { getAQIColorHSL } from '@/utils/aqiColors';
import { concentrationToSubAQI } from '@/utils/pollutantConfig';
import type { PollutantKey } from '@/types/Station';
import styles from './PollutantPill.module.css';

interface PollutantPillProps {
  pollutant: PollutantKey;
  value: number;
  compact?: boolean;
}

export default function PollutantPill({ pollutant, value, compact = false }: PollutantPillProps) {
  const cfg = POLLUTANTS[pollutant];
  const subAqi = concentrationToSubAQI(pollutant, value);
  const color = getAQIColorHSL(subAqi);
  const decimals = cfg.unit === 'ppm' ? 1 : value < 10 ? 1 : 0;

  return (
    <div className={`${styles.pill} ${compact ? styles.compact : ''}`} style={{ borderColor: `${color}44` }}>
      <div className={styles.header}>
        <span className={styles.name}>{cfg.label}</span>
        <span className={styles.subAqi} style={{ color }}>
          {subAqi}
        </span>
      </div>
      <div className={styles.value}>
        <span className={styles.number} style={{ color }}>
          {value.toFixed(decimals)}
        </span>
        <span className={styles.unit}>{cfg.unit}</span>
      </div>
    </div>
  );
}
