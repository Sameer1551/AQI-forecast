import { useNavigate } from 'react-router-dom';
import type { Station, PollutantKey } from '@/types/Station';
import { getAQIColorHSL, getAQICategory } from '@/utils/aqiColors';
import { POLLUTANTS } from '@/utils/pollutantConfig';
import { useForecast } from '@/hooks/useForecast';
import SparklineChart from '@/components/charts/SparklineChart';
import { formatConcentration } from '@/utils/formatters';
import styles from './StationPopup.module.css';

interface StationPopupProps {
  station: Station;
}

export default function StationPopup({ station }: StationPopupProps) {
  const navigate = useNavigate();
  const { data: forecast } = useForecast(station.id);
  const color = getAQIColorHSL(station.current_aqi);
  const category = getAQICategory(station.current_aqi);

  const pollutants: PollutantKey[] = ['pm25', 'pm10', 'no2', 'o3', 'co', 'so2'];

  return (
    <div className={styles.popup}>
      <div className={styles.header}>
        <span className={styles.name}>{station.name}</span>
        <span className={styles.cityBadge}>{station.city}</span>
      </div>
      <div className={styles.aqiRow}>
        <span className={styles.aqiValue} style={{ color }}>
          {station.current_aqi}
        </span>
        <span className={styles.category} style={{ color }}>
          {category}
        </span>
      </div>
      <div className={styles.pills}>
        {pollutants.map((p) => {
          const cfg = POLLUTANTS[p];
          const val = station[`current_${p}` as keyof Station] as number;
          return (
            <div key={p} className={styles.pill}>
              <span className={styles.pillName}>{cfg.label}</span>
              <span className={styles.pillValue}>{formatConcentration(val, cfg.unit)}</span>
            </div>
          );
        })}
      </div>
      <div className={styles.sparkline}>
        {forecast && <SparklineChart data={forecast} pollutant="pm25" width={140} height={36} />}
      </div>
      <div className={styles.buttons}>
        <button className={styles.btn} onClick={() => navigate('/forecast')}>
          View Full Forecast →
        </button>
        <button className={styles.btn} onClick={() => navigate('/graph')}>
          View Graph →
        </button>
      </div>
    </div>
  );
}
