import AQIGauge from '@/components/ui/AQIGauge';
import Card from '@/components/ui/Card';
import PollutantPill from '@/components/ui/PollutantPill';
import WindCompass from '@/components/ui/WindCompass';
import { POLLUTANT_ORDER, POLLUTANTS, concentrationToSubAQI } from '@/utils/pollutantConfig';
import { getAQIColorHSL } from '@/utils/aqiColors';
import { formatConcentration, formatWindFull } from '@/utils/formatters';
import { Wind, Thermometer, Layers, Droplet } from 'lucide-react';
import type { Station, PollutantKey } from '@/types/Station';
import styles from './CurrentConditions.module.css';

interface CurrentConditionsProps {
  station: Station;
}

export default function CurrentConditions({ station }: CurrentConditionsProps) {
  return (
    <div className={styles.section}>
      <Card className={styles.gaugeCard}>
        <AQIGauge aqi={station.current_aqi} size={200} />
      </Card>

      <div className={styles.pollutants}>
        {POLLUTANT_ORDER.map((p) => {
          const cfg = POLLUTANTS[p];
          const val = station[`current_${p}` as keyof Station] as number;
          const subAqi = concentrationToSubAQI(p, val);
          return (
            <Card key={p} className={styles.pollutantCard}>
              <div className={styles.pHeader}>
                <span className={styles.pName}>{cfg.label}</span>
                <span className={styles.pUnit}>{cfg.unit}</span>
              </div>
              <span className={styles.pValue} style={{ color: getAQIColorHSL(subAqi) }}>
                {formatConcentration(val, cfg.unit)}
              </span>
              <span className={styles.pSubAqi} style={{ color: getAQIColorHSL(subAqi) }}>
                Sub-AQI: {subAqi}
              </span>
              <div className={styles.pBar}>
                <div
                  className={styles.pBarFill}
                  style={{ width: `${Math.min(100, (subAqi / 500) * 100)}%`, background: getAQIColorHSL(subAqi) }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      <Card className={styles.weatherCard}>
        <div className={styles.weatherRow}>
          <div className={styles.weatherItem}>
            <Wind size={16} />
            <div>
              <span className={styles.wLabel}>Wind</span>
              <span className={styles.wValue}>{formatWindFull(station.wind_speed_ms, station.wind_direction_deg)}</span>
            </div>
          </div>
          <div className={styles.weatherItem}>
            <Thermometer size={16} />
            <div>
              <span className={styles.wLabel}>Temperature</span>
              <span className={styles.wValue}>{station.temperature_c.toFixed(1)}°C</span>
            </div>
          </div>
          <div className={styles.weatherItem}>
            <Layers size={16} />
            <div>
              <span className={styles.wLabel}>Boundary Layer</span>
              <span className={styles.wValue}>{station.boundary_layer_height_m}m</span>
            </div>
          </div>
          <div className={styles.weatherItem}>
            <Droplet size={16} />
            <div>
              <span className={styles.wLabel}>Precipitation</span>
              <span className={styles.wValue}>0 mm/h</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
