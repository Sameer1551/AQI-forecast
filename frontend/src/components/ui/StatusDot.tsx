import styles from './StatusDot.module.css';

interface StatusDotProps {
  status: 'ok' | 'warning' | 'error' | 'offline';
  size?: number;
  label?: string;
}

export default function StatusDot({ status, size = 8, label }: StatusDotProps) {
  const colorMap = {
    ok: 'var(--status-ok)',
    warning: 'var(--status-warning)',
    error: 'var(--status-error)',
    offline: 'var(--text-muted)',
  };
  return (
    <span className={styles.wrapper}>
      <span
        className={styles.dot}
        style={{ width: size, height: size, background: colorMap[status] }}
      />
      {label && <span className={styles.label}>{label}</span>}
    </span>
  );
}
