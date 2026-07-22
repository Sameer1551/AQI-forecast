import { useState } from 'react';
import { useStations } from '@/hooks/useStations';
import { useForecast } from '@/hooks/useForecast';
import { useAppStore } from '@/store/appStore';
import AQIGauge from '@/components/ui/AQIGauge';
import Card from '@/components/ui/Card';
import PollutantPill from '@/components/ui/PollutantPill';
import WindCompass from '@/components/ui/WindCompass';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import ForecastChart from '@/components/charts/ForecastChart';
import CurrentConditions from './CurrentConditions';
import ExplainabilityPanel from './ExplainabilityPanel';
import { POLLUTANTS, POLLUTANT_ORDER, concentrationToSubAQI } from '@/utils/pollutantConfig';
import { getAQIColorHSL, getAQICategory } from '@/utils/aqiColors';
import { formatConcentration, formatWindFull, formatTimestamp } from '@/utils/formatters';
import type { PollutantKey } from '@/types/Station';
import { AlertTriangle, Search, ChevronDown } from 'lucide-react';
import styles from './ForecastPage.module.css';

export default function ForecastPage() {
  const { data: stations, isLoading } = useStations();
  const selectedStationId = useAppStore((s) => s.selectedStationId);
  const setSelectedStationId = useAppStore((s) => s.setSelectedStationId);
  const { data: forecast, isLoading: forecastLoading } = useForecast(selectedStationId);
  const [selectedPollutant, setSelectedPollutant] = useState<PollutantKey>('pm25');
  const [showAll, setShowAll] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');

  const station = stations?.find((s) => s.id === selectedStationId);

  if (isLoading || !station) {
    return (
      <div className={styles.loading}>
        <SkeletonLoader width="200px" height="30px" />
        <SkeletonLoader width="100%" height="200px" />
      </div>
    );
  }

  const alert = forecast?.some(
    (f) => f.pollutant === 'pm25' && f.upper_90 > 300
  );

  const filteredStations = stations?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const cities = [...new Set(filteredStations?.map((s) => s.city) ?? [])];

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.dropdown}>
          <button className={styles.dropdownBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
            <span>{station.name} — AQI {station.current_aqi}</span>
            <ChevronDown size={16} />
          </button>
          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.searchBox}>
                <Search size={14} />
                <input
                  placeholder="Search stations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className={styles.dropdownList}>
                {cities.map((city) => (
                  <div key={city} className={styles.dropdownGroup}>
                    <div className={styles.groupLabel}>{city}</div>
                    {filteredStations.filter((s) => s.city === city).map((s) => (
                      <button
                        key={s.id}
                        className={`${styles.dropdownItem} ${s.id === selectedStationId ? styles.dropdownItemActive : ''}`}
                        onClick={() => {
                          setSelectedStationId(s.id);
                          setDropdownOpen(false);
                          setSearch('');
                        }}
                      >
                        <span>{s.name}</span>
                        <span className={styles.itemAqi} style={{ color: getAQIColorHSL(s.current_aqi) }}>
                          {s.current_aqi}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <span className={styles.updated}>Last updated: {formatTimestamp(new Date().toISOString())}</span>
      </div>

      <CurrentConditions station={station} />

      {alert && (
        <div className={styles.alertBanner}>
          <AlertTriangle size={18} />
          <span>HAZARD ALERT — upper bound exceeds 300 AQI threshold</span>
        </div>
      )}

      <Card className={styles.forecastCard}>
        <div className={styles.forecastHeader}>
          <h2>Multi-Horizon Probabilistic Forecast</h2>
          <div className={styles.pollutantTabs}>
            {POLLUTANT_ORDER.map((p) => (
              <button
                key={p}
                className={`${styles.tab} ${selectedPollutant === p && !showAll ? styles.tabActive : ''}`}
                onClick={() => { setSelectedPollutant(p); setShowAll(false); }}
              >
                {POLLUTANTS[p].label}
              </button>
            ))}
          </div>
        </div>
        {forecastLoading ? (
          <SkeletonLoader width="100%" height="300px" />
        ) : (
          <ForecastChart data={forecast ?? []} pollutant={selectedPollutant} showAll={showAll} />
        )}
        <div className={styles.toggleRow}>
          <label className={styles.toggle}>
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            <span>Show all pollutants (normalized to sub-AQI)</span>
          </label>
        </div>
      </Card>

      <ExplainabilityPanel forecast={forecast ?? []} />
    </div>
  );
}
