import { formatWindDir } from '@/utils/formatters';
import styles from './WindCompass.module.css';

interface WindCompassProps {
  speed: number;
  direction: number;
  size?: number;
}

export default function WindCompass({ speed, direction, size = 120 }: WindCompassProps) {
  const center = size / 2;
  const radius = center - 10;
  const arrowLength = radius * 0.7;
  const rad = (direction - 90) * (Math.PI / 180);
  const endX = center + Math.cos(rad) * arrowLength;
  const endY = center + Math.sin(rad) * arrowLength;
  const startX = center - Math.cos(rad) * arrowLength * 0.3;
  const startY = center - Math.sin(rad) * arrowLength * 0.3;

  return (
    <div className={styles.compass} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--border)" strokeWidth="1" />
        <circle cx={center} cy={center} r={radius * 0.7} fill="none" stroke="var(--border-glass)" strokeWidth="0.5" />
        <text x={center} y={14} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="600">N</text>
        <text x={center} y={size - 5} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="600">S</text>
        <text x={size - 6} y={center + 3} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="600">E</text>
        <text x={6} y={center + 3} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="600">W</text>
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="var(--accent-cyan)"
          strokeWidth="2"
          strokeLinecap="round"
          className={styles.arrow}
        />
        <circle cx={endX} cy={endY} r="3" fill="var(--accent-cyan)" className={styles.tip} />
      </svg>
      <div className={styles.info}>
        <span className={styles.speed}>{speed.toFixed(1)} m/s</span>
        <span className={styles.dir}>{formatWindDir(direction)}</span>
      </div>
    </div>
  );
}
