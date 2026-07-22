import Card from '@/components/ui/Card';
import type { ScenarioConfig } from './ScenarioPage';
import styles from './ScenarioCard.module.css';

export interface ScenarioCardProps {
  config: ScenarioConfig;
  active: boolean;
  value: number;
  onChange: (v: number) => void;
  onSelect: () => void;
  windDirection: number;
  onWindDirChange: (deg: number) => void;
}

export default function ScenarioCard({ config, active, value, onChange, onSelect, windDirection, onWindDirChange }: ScenarioCardProps) {
  const { icon: Icon, label, description, min, max, unit } = config;

  return (
    <Card
      className={`${styles.card} ${active ? styles.active : ''}`}
      onClick={onSelect}
      hover
    >
      <div className={styles.header}>
        <Icon size={18} className={styles.icon} />
        <span className={styles.label}>{label}</span>
      </div>
      <p className={styles.desc}>{description}</p>
      {config.type === 'wind_change' ? (
        <div className={styles.windControls}>
          <div className={styles.sliderRow}>
            <span className={styles.sliderLabel}>Speed</span>
            <input
              type="range"
              min={min}
              max={max}
              step={0.5}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.sliderValue}>{value.toFixed(1)}{unit}</span>
          </div>
          <div className={styles.sliderRow}>
            <span className={styles.sliderLabel}>Direction</span>
            <input
              type="range"
              min={0}
              max={360}
              step={5}
              value={windDirection}
              onChange={(e) => onWindDirChange(Number(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.sliderValue}>{windDirection}°</span>
          </div>
        </div>
      ) : (
        <div className={styles.sliderRow}>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.sliderValue}>{value}{unit}</span>
        </div>
      )}
    </Card>
  );
}
