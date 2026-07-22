import { getAQIColorHSL } from '@/utils/aqiColors';
import { getAQICategory } from '@/utils/aqiColors';
import styles from './Badge.module.css';

interface BadgeProps {
  aqi?: number;
  category?: string;
  label?: string;
  color?: string;
  variant?: 'category' | 'plain' | 'demo' | 'status';
}

export default function Badge({ aqi, category, label, color, variant = 'plain' }: BadgeProps) {
  let bg = color;
  let text = label ?? category;

  if (variant === 'category' && aqi !== undefined) {
    bg = getAQIColorHSL(aqi);
    text = category ?? getAQICategory(aqi);
  }
  if (variant === 'demo') {
    bg = 'var(--status-warning)';
    text = label ?? 'DEMO';
  }

  return (
    <span
      className={styles.badge}
      style={{
        background: bg ? `${bg}22` : 'var(--bg-elevated)',
        color: bg ?? 'var(--text-primary)',
        borderColor: bg ? `${bg}44` : 'var(--border)',
      }}
    >
      {text}
    </span>
  );
}
